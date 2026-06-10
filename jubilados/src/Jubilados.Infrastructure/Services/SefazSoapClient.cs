using System.Diagnostics;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Jubilados.Infrastructure.Services;

/// <summary>
/// Envia requisições SOAP para webservices SEFAZ/SVRS usando o "curl" do sistema.
/// O endpoint de recepção de eventos da SVRS (recepcaoevento4.asmx) valida a cadeia
/// completa do certificado do cliente durante o handshake mTLS. O SslStream do .NET
/// só envia o certificado-folha (X509Certificate2 descarta as intermediárias do
/// .pfx), o que faz o servidor encerrar a conexão ("Connection reset by peer").
/// O curl/OpenSSL recebe o .pfx completo (--cert-type P12) e envia toda a cadeia —
/// é a mesma abordagem usada por bibliotecas NF-e consolidadas em PHP (sped-nfe/NFePHP)
/// no Linux.
/// </summary>
internal static class SefazSoapClient
{
    public static async Task<string> PostAsync(
        string url, string soapAction, string soapXml, byte[] pkcs12,
        TimeSpan timeout, ILogger logger, CancellationToken cancellationToken = default)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "sefaz-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        try
        {
            var certPath = Path.Combine(tempDir, "cert.p12");
            var bodyPath = Path.Combine(tempDir, "body.xml");

            await File.WriteAllBytesAsync(certPath, pkcs12, cancellationToken);
            await File.WriteAllTextAsync(bodyPath, soapXml, new UTF8Encoding(false), cancellationToken);

            if (!OperatingSystem.IsWindows())
            {
                File.SetUnixFileMode(certPath, UnixFileMode.UserRead | UnixFileMode.UserWrite);
            }

            var psi = new ProcessStartInfo
            {
                FileName = "curl",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            };
            psi.ArgumentList.Add("-s");
            psi.ArgumentList.Add("-S");
            psi.ArgumentList.Add("--tlsv1.2");
            psi.ArgumentList.Add("-k");
            psi.ArgumentList.Add("--cert"); psi.ArgumentList.Add(certPath + ":");
            psi.ArgumentList.Add("--cert-type"); psi.ArgumentList.Add("P12");
            psi.ArgumentList.Add("-H"); psi.ArgumentList.Add($"Content-Type: application/soap+xml; charset=utf-8; action=\"{soapAction}\"");
            psi.ArgumentList.Add("--data-binary"); psi.ArgumentList.Add("@" + bodyPath);
            psi.ArgumentList.Add("--max-time"); psi.ArgumentList.Add(((int)timeout.TotalSeconds).ToString());
            psi.ArgumentList.Add(url);

            using var proc = Process.Start(psi)
                ?? throw new InvalidOperationException("Não foi possível iniciar o processo curl.");

            var stdoutTask = proc.StandardOutput.ReadToEndAsync(cancellationToken);
            var stderrTask = proc.StandardError.ReadToEndAsync(cancellationToken);
            await proc.WaitForExitAsync(cancellationToken);
            var stdout = await stdoutTask;
            var stderr = await stderrTask;

            if (proc.ExitCode != 0)
            {
                logger.LogError("[SefazSoapClient] curl saiu com código {Code}: {Err}", proc.ExitCode, stderr);
                throw new HttpRequestException($"curl falhou (código {proc.ExitCode}): {stderr.Trim()}");
            }

            return stdout;
        }
        finally
        {
            try { Directory.Delete(tempDir, recursive: true); } catch { /* best-effort */ }
        }
    }
}
