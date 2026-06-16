using Microsoft.Playwright;
using Xunit;

namespace Jubilados.EndToEndTests;

public class DashboardRenderConsoleTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public DashboardRenderConsoleTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task PaginasPublicasEDashboard_RenderizamSemConsoleError()
    {
        var pages = new[] { "/", "/login.html", "/onboarding.html", "/index2.html" };
        using var client = _factory.CreateClient(new() { AllowAutoRedirect = false });

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true
        });

        foreach (var path in pages)
        {
            var html = await client.GetStringAsync(path);
            Assert.False(string.IsNullOrWhiteSpace(html));

            var context = await browser.NewContextAsync();
            var page = await context.NewPageAsync();
            var consoleErrors = new List<string>();

            page.Console += (_, msg) =>
            {
                if (msg.Type == "error")
                {
                    consoleErrors.Add(msg.Text);
                }
            };

                        await page.AddInitScriptAsync(@"
                                const authPayload = btoa(JSON.stringify({ email: 'teste@jubilados.com' }));
                                localStorage.setItem('jubilados_token', 'a.' + authPayload + '.c');

                                const empresa = {
                                    id: '11111111-1111-1111-1111-111111111111',
                                    cnpj: '21362844000152',
                                    razaoSocial: 'Empresa Teste',
                                    nomeFantasia: 'Empresa Teste',
                                    inscricaoEstadual: '123456789',
                                    logradouro: 'Rua A',
                                    numero: '100',
                                    bairro: 'Centro',
                                    municipio: 'Joao Pessoa',
                                    uf: 'PB',
                                    cep: '58000000'
                                };

                                window.fetch = async function(url) {
                                    const u = String(url || '');
                                    if (u.includes('/api/auth/me')) {
                                        return {
                                            ok: true,
                                            status: 200,
                                            json: async () => ({ onboardingConcluido: true, empresaId: empresa.id })
                                        };
                                    }
                                    if (u.includes('/api/empresa/' + empresa.id)) {
                                        return {
                                            ok: true,
                                            status: 200,
                                            json: async () => empresa
                                        };
                                    }
                                    if (u.includes('/api/empresa')) {
                                        return {
                                            ok: true,
                                            status: 200,
                                            json: async () => [empresa]
                                        };
                                    }
                                    if (u.includes('/api/produto/classificacao-tributaria')) {
                                        return {
                                            ok: true,
                                            status: 200,
                                            json: async () => ({ itens: [] })
                                        };
                                    }

                                    return {
                                        ok: true,
                                        status: 200,
                                        json: async () => ({}),
                                        text: async () => '{}'
                                    };
                                };
                        ");

                        await page.SetContentAsync(html, new PageSetContentOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle,
                Timeout = 30000
            });

            Assert.NotEmpty(await page.TitleAsync());
            Assert.True(consoleErrors.Count == 0, $"Console errors em {path}: {string.Join(" | ", consoleErrors)}");

            await page.CloseAsync();
                        await context.CloseAsync();
        }
    }
}
