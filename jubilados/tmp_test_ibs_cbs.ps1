$base='http://localhost:5080'
$empresaId='dd104b57-010a-4458-8699-d63807e205d3'

function Invoke-Api {
  param([string]$Method,[string]$Url,[object]$Body)
  try {
    if ($null -ne $Body) {
      $json = $Body | ConvertTo-Json -Depth 10
      $resp = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $Url -ContentType 'application/json' -Body $json
    } else {
      $resp = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $Url
    }
    [PSCustomObject]@{ Ok=$true; Status=[int]$resp.StatusCode; Body=$resp.Content }
  } catch {
    $status = 0
    try { $status = [int]$_.Exception.Response.StatusCode } catch {}
    $body = $_.ErrorDetails.Message
    [PSCustomObject]@{ Ok=$false; Status=$status; Body=$body }
  }
}

Write-Output '=== TESTE 1: GET classificacao-tributaria ==='
$t1 = Invoke-Api -Method GET -Url "$base/api/produto/classificacao-tributaria"
$t1Body = $t1.Body | ConvertFrom-Json
Write-Output ("status={0} total={1}" -f $t1.Status, $t1Body.total)
Write-Output ("codigos amostra: " + (($t1Body.itens | Select-Object -First 5 | ForEach-Object { $_.codigo + '/' + $_.cst }) -join ', '))

Write-Output '=== TESTE 2: POST produto SEM cClassTrib (deve bloquear) ==='
$nome = 'ProdutoSemClass-' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
$payloadSem = @{ empresaId=$empresaId; nome=$nome; descricao='teste'; ncm='84713012'; cfop='5102'; cst='00'; csosn='102'; unidade='UN'; preco=10.50; aliquotaICMS=0; aliquotaIPI=0; aliquotaPIS=0.65; aliquotaCOFINS=3 }
$t2 = Invoke-Api -Method POST -Url "$base/api/produto" -Body $payloadSem
Write-Output ("status={0} ok={1}" -f $t2.Status, $t2.Ok)
Write-Output $t2.Body

Write-Output '=== TESTE 3: POST produto COM cClassTrib valido ==='
$nome2 = 'ProdutoComClass-' + [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
$payloadCom = @{ empresaId=$empresaId; nome=$nome2; descricao='teste'; ncm='84713012'; cfop='5102'; cst='00'; csosn='102'; cClassTrib='000001'; cstIbsCbs='000'; unidade='UN'; preco=11.25; aliquotaICMS=0; aliquotaIPI=0; aliquotaPIS=0.65; aliquotaCOFINS=3 }
$t3 = Invoke-Api -Method POST -Url "$base/api/produto" -Body $payloadCom
Write-Output ("status={0} ok={1}" -f $t3.Status, $t3.Ok)
Write-Output $t3.Body
$produtoCriado = $null
if ($t3.Ok) { $produtoCriado = $t3.Body | ConvertFrom-Json }

Write-Output '=== TESTE 4: COMPLEMENTAR sem cClassTrib (deve bloquear) ==='
if ($produtoCriado -ne $null) {
  $t4Payload = @{ precoVenda=19.90; cfop='5102' }
  $t4 = Invoke-Api -Method PUT -Url "$base/api/produto/$($produtoCriado.id)/complementar" -Body $t4Payload
  Write-Output ("status={0} ok={1}" -f $t4.Status, $t4.Ok)
  Write-Output $t4.Body

  Write-Output '=== TESTE 5: COMPLEMENTAR com cClassTrib valido ==='
  $t5Payload = @{ precoVenda=19.90; cfop='5102'; cClassTrib='000001'; cstIbsCbs='000' }
  $t5 = Invoke-Api -Method PUT -Url "$base/api/produto/$($produtoCriado.id)/complementar" -Body $t5Payload
  Write-Output ("status={0} ok={1}" -f $t5.Status, $t5.Ok)
  Write-Output $t5.Body
}

Write-Output '=== TESTE 6: Importar XML entrada + complemento fiscal ==='
$chave = -join ((1..44) | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 })
$numeroNf = Get-Random -Minimum 10000 -Maximum 99999
$xml = @"
<?xml version='1.0' encoding='utf-8'?>
<nfeProc xmlns='http://www.portalfiscal.inf.br/nfe'>
  <NFe>
    <infNFe Id='NFe$chave' versao='4.00'>
      <ide>
        <nNF>$numeroNf</nNF>
        <serie>1</serie>
        <natOp>Compra para revenda</natOp>
        <dhEmi>2026-05-04T12:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>11222333000144</CNPJ>
        <xNome>Fornecedor XML Teste</xNome>
        <IE>ISENTO</IE>
        <enderEmit>
          <xLgr>Rua Teste</xLgr>
          <nro>100</nro>
          <xBairro>Centro</xBairro>
          <xMun>Brasilia</xMun>
          <cMun>5300108</cMun>
          <UF>DF</UF>
          <CEP>70000000</CEP>
        </enderEmit>
      </emit>
      <det nItem='1'>
        <prod>
          <cProd>1</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>Produto Importado XML IBS</xProd>
          <NCM>84713012</NCM>
          <CFOP>1102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>5.00</vUnCom>
          <vProd>10.00</vProd>
          <CEST>1234567</CEST>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>
"@
$xmlB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($xml))
$t6Payload = @{ empresaId=$empresaId; xmlBase64=$xmlB64 }
$t6 = Invoke-Api -Method POST -Url "$base/api/nfe/importar-xml-entrada" -Body $t6Payload
Write-Output ("status={0} ok={1}" -f $t6.Status, $t6.Ok)
Write-Output $t6.Body
if ($t6.Ok) {
  $obj6 = $t6.Body | ConvertFrom-Json
  $pImp = $obj6.produtosCriados | Select-Object -First 1
  if ($pImp -ne $null) {
    Write-Output '--- Complemento do produto importado sem cClassTrib (deve bloquear) ---'
    $t6aPayload = @{ precoVenda=8.75; cfop='5102' }
    $t6a = Invoke-Api -Method PUT -Url "$base/api/produto/$($pImp.id)/complementar" -Body $t6aPayload
    Write-Output ("status={0} ok={1}" -f $t6a.Status, $t6a.Ok)
    Write-Output $t6a.Body

    Write-Output '--- Complemento do produto importado com cClassTrib (deve salvar) ---'
    $t6bPayload = @{ precoVenda=8.75; cfop='5102'; cClassTrib='000001'; cstIbsCbs='000' }
    $t6b = Invoke-Api -Method PUT -Url "$base/api/produto/$($pImp.id)/complementar" -Body $t6bPayload
    Write-Output ("status={0} ok={1}" -f $t6b.Status, $t6b.Ok)
    Write-Output $t6b.Body
  }
}
