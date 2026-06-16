# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar arquivos de projeto e restaurar dependências (cache layer)
COPY ["src/Jubilados.API/Jubilados.API.csproj",            "Jubilados.API/"]
COPY ["src/Jubilados.Application/Jubilados.Application.csproj", "Jubilados.Application/"]
COPY ["src/Jubilados.Infrastructure/Jubilados.Infrastructure.csproj", "Jubilados.Infrastructure/"]
COPY ["src/Jubilados.Domain/Jubilados.Domain.csproj",      "Jubilados.Domain/"]

RUN dotnet restore "Jubilados.API/Jubilados.API.csproj"

# Copiar código-fonte e publicar
COPY src/ .
WORKDIR "/src/Jubilados.API"
RUN dotnet publish "Jubilados.API.csproj" -c Release -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# curl é usado para chamadas SOAP aos webservices de eventos da SVRS (recepcaoevento4),
# pois o SslStream do .NET no Linux não suporta a renegociação TLS pós-handshake
# exigida por esse endpoint para solicitar o certificado do cliente.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Expor porta da API
EXPOSE 8080
EXPOSE 8081

ENV ASPNETCORE_URLS="http://+:8080"
ENV ASPNETCORE_ENVIRONMENT="Production"

ENTRYPOINT ["dotnet", "Jubilados.API.dll"]
