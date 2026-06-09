using System.Diagnostics;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Jubilados.Infrastructure.Services;

/// <summary>
/// Envia requisições SOAP para webservices SEFAZ/SVRS usando o "curl" do sistema.
/// O endpoint de recepção de eventos da SVRS (recepcaoevento4.asmx) solicita o
/// certificado do cliente via renegociação TLS pós-handshake. O SslStream do .NET
/// no Linux (OpenSSL) não suporta essa renegociação (dotnet/runtime#63699), o que
/// derruba a conexão com "Connection reset by peer". O curl/OpenSSL do sistema
/// operacional lida com essa renegociação corretamente — é a mesma abordagem usada
/// por bibliotecas NF-e consolidadas em PHP (sped-nfe/NFePHP) no Linux.
/// </summary>
internal static class SefazSoapClient
{
    public static async Task<string> PostAsync(
        string url, string soapAction, string soapXml, X509Certificate2 certificado,
        TimeSpan timeout, ILogger logger, CancellationToken cancellationToken = default)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "sefaz-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        try
        {
            var certPath = Path.Combine(tempDir, "cert.pem");
            var keyPath = Path.Combine(tempDir, "key.pem");
            var bodyPath = Path.Combine(tempDir, "body.xml");

            await File.WriteAllTextAsync(certPath, certificado.ExportCertificatePem(), cancellationToken);
            await File.WriteAllTextAsync(keyPath, certificado.GetRSAPrivateKey()!.ExportPkcs8PrivateKeyPem(), cancellationToken);
            await File.WriteAllTextAsync(bodyPath, soapXml, new UTF8Encoding(false), cancellationToken);

            if (!OperatingSystem.IsWindows())
            {
                File.SetUnixFileMode(keyPath, UnixFileMode.UserRead | UnixFileMode.UserWrite);
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
            psi.ArgumentList.Add("--cert"); psi.ArgumentList.Add(certPath);
            psi.ArgumentList.Add("--key"); psi.ArgumentList.Add(keyPath);
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
