# Test full peer review and reputation cycle
$login1 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"gestor@setelagoas.mg.gov.br","senha":"senhaSegura123"}'
$headers1 = @{ "Authorization" = "Bearer $($login1.token)" }

$login2 = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"viniciuscastilho8@gmail.com","senha":"senhaSegura123"}'
$headers2 = @{ "Authorization" = "Bearer $($login2.token)" }

# 1. User 1 creates match
$partidaReq = @{
    esporte = "Vôlei de Areia"
    dataHora = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss")
    duracaoMinutos = 90
    minJogadores = 4
    maxJogadores = 8
    descricao = "Vôlei de areia para testar reputação"
    latitude = -19.4600
    longitude = -44.2400
    bairro = "Centro"
} | ConvertTo-Json

$partida = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas" -Method Post -Headers $headers1 -ContentType "application/json" -Body $partidaReq
Write-Host "Partida criada ID: $($partida.id)"

# 2. User 2 confirms presence
$confReq = @{
    latitude = -19.4650
    longitude = -44.2450
    bairro = "Canaã"
} | ConvertTo-Json

$partidaAtualizada = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas/$($partida.id)/confirmar" -Method Post -Headers $headers2 -ContentType "application/json" -Body $confReq
Write-Host "Participantes na partida: $($partidaAtualizada.participantes.Count)"

# 3. User 1 lists peers to evaluate
$colegas = Invoke-RestMethod -Uri "http://localhost:8080/api/avaliacoes/partida/$($partida.id)/colegas" -Method Get -Headers $headers1
Write-Host "Colegas encontrados para User 1 avaliar:"
$colegas | ConvertTo-Json | Write-Host

# 4. User 1 evaluates User 2 (gives 5 stars and JOGADOR_CASUAL)
$avaliacaoReq = @{
    avaliacoes = @(
        @{
            avaliadoId = $login2.usuarioId
            notaReputacao = 5
            nivelHabilidade = "JOGADOR_CASUAL"
            comentario = "Excelente parceiro de equipe, muito pontual!"
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/avaliacoes/partida/$($partida.id)" -Method Post -Headers $headers1 -ContentType "application/json" -Body $avaliacaoReq
Write-Host "Avaliação enviada com sucesso!"

# 5. User 1 checks peers again
$colegasDepois = Invoke-RestMethod -Uri "http://localhost:8080/api/avaliacoes/partida/$($partida.id)/colegas" -Method Get -Headers $headers1
Write-Host "Colegas após avaliação:"
$colegasDepois | ConvertTo-Json | Write-Host

# 6. Check User 2 profile / reputation
$repUser2 = Invoke-RestMethod -Uri "http://localhost:8080/api/avaliacoes/usuario/$($login2.usuarioId)" -Method Get -Headers $headers1
Write-Host "Reputação e Habilidade do Usuário 2:"
$repUser2 | ConvertTo-Json | Write-Host
