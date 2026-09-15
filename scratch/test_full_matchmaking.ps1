$ErrorActionPreference = "Stop"

# 1. Login Gestor
$loginGestor = @{
    email = "gestor@setelagoas.mg.gov.br"
    senha = "senhaSegura123"
} | ConvertTo-Json
$resGestor = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginGestor -ContentType "application/json"
$tokenGestor = $resGestor.token
Write-Host "[OK] Gestor autenticado com sucesso!"

# 2. Criar Partida de Basquete no Centro
$amanha = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss")
$criarBody = @{
    esporte = "Basquete"
    dataHora = $amanha
    duracaoMinutos = 90
    minJogadores = 6
    maxJogadores = 10
    descricao = "Racha 3x3 de Basquete da Galera"
    bairro = "Centro"
    latitude = -19.4620
    longitude = -44.2450
} | ConvertTo-Json

$partida = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas" -Method Post -Headers @{ Authorization = "Bearer $tokenGestor" } -Body $criarBody -ContentType "application/json"
$partidaId = $partida.id
Write-Host "[OK] Partida de Basquete criada! ID: $partidaId"
Write-Host "     Criador: $($partida.criadorNome) ($($partida.bairroCriador))"
Write-Host "     Centróide Inicial: $($partida.centroideLat), $($partida.centroideLng)"
Write-Host "     Top 3 Quadras Sugeridas para Basquete:"
foreach ($q in $partida.sugestoesQuadras) {
    Write-Host "     -> #$($q.quadraId): $($q.nome) ($($q.bairro)) - Distância Média: $($q.distanciaMediaKm) km"
}

# 3. O Criador Escolhe a Quadra #1 Sugerida
$primeiraQuadraId = $partida.sugestoesQuadras[0].quadraId
$escolhaBody = @{
    quadraId = $primeiraQuadraId
} | ConvertTo-Json

$partidaComQuadra = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas/$partidaId/escolher-quadra" -Method Post -Headers @{ Authorization = "Bearer $tokenGestor" } -Body $escolhaBody -ContentType "application/json"
Write-Host "[OK] Quadra oficial escolhida pelo criador!"
Write-Host "     Status Atual: $($partidaComQuadra.status)"
Write-Host "     Quadra Escolhida: $($partidaComQuadra.quadraEscolhida.nome) ($($partidaComQuadra.quadraEscolhida.bairro))"

# 4. Segundo Usuário Confirma Presença (Vinícius Castilho do bairro Montreal)
$loginUser2 = @{
    email = "viniciuscastilho8@gmail.com"
    senha = "senhaSegura123"
} | ConvertTo-Json
$resUser2 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginUser2 -ContentType "application/json"
$tokenUser2 = $resUser2.token
Write-Host "[OK] Segundo usuário autenticado (Vinícius Castilho)!"

$confirmarBody = @{
    bairro = "Montreal"
    latitude = -19.4750
    longitude = -44.2650
} | ConvertTo-Json

$partidaAtualizada = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas/$partidaId/confirmar" -Method Post -Headers @{ Authorization = "Bearer $tokenUser2" } -Body $confirmarBody -ContentType "application/json"
Write-Host "[OK] Presença confirmada pelo segundo jogador!"
Write-Host "     Total Participantes: $($partidaAtualizada.totalParticipantes) / $($partidaAtualizada.minJogadores) mín"
Write-Host "     Novo Centróide do Grupo: $($partidaAtualizada.centroideLat), $($partidaAtualizada.centroideLng)"
Write-Host "     Participantes na Sala:"
foreach ($p in $partidaAtualizada.participantes) {
    Write-Host "     - $($p.nome) ($($p.bairro))"
}

# 5. Segundo Usuário Desiste da Partida (Testar recálculo do centróide)
Invoke-RestMethod -Uri "http://localhost:8080/api/partidas/$partidaId/sair" -Method Delete -Headers @{ Authorization = "Bearer $tokenUser2" }
$partidaPosSaida = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas/$partidaId" -Method Get
Write-Host "[OK] Jogador 2 saiu da partida com sucesso!"
Write-Host "     Total Participantes agora: $($partidaPosSaida.totalParticipantes)"
Write-Host "     Centróide voltou para o bairro do criador: $($partidaPosSaida.centroideLat), $($partidaPosSaida.centroideLng)"

Write-Host "`n>>> FLUXO COMPLETO DE MATCHMAKING VALIDADO COM SUCESSO! <<<"
