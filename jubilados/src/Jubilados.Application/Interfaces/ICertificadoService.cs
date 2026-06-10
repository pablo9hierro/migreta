using System.Security.Cryptography.X509Certificates;

namespace Jubilados.Application.Interfaces;

public interface ICertificadoService
{
    /// <summary>
    /// Carrega certificado X.509 a partir de base64 + senha (multi-tenant).
    /// </summary>
    X509Certificate2 CarregarCertificado(string base64, string senha);

    /// <summary>
    /// Valida se o certificado está dentro da validade.
    /// </summary>
    bool CertificadoValido(X509Certificate2 certificado);

    /// <summary>
    /// Retorna a data de expiração do certificado.
    /// </summary>
    DateTime ObterValidade(string base64, string senha);

    /// <summary>
    /// Reexporta o .pfx como PKCS#12 sem senha, preservando toda a cadeia
    /// (certificado + intermediárias) presente no arquivo original. Usado para
    /// autenticação mTLS via curl, que (diferente de X509Certificate2) envia
    /// a cadeia completa no handshake TLS.
    /// </summary>
    byte[] CarregarCadeiaPkcs12(string base64, string senha);
}
