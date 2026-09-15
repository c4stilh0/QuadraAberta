# Script de Verificação E2E Completo do Sistema de Reputação & Habilidade
Write-Host "=== TESTE E2E: REPUTAÇÃO ESTILO UBER & VALIDAÇÃO DE HABILIDADE ===" -ForegroundColor Cyan

# 1. Login Gestor e Usuário Comunitário
$loginGestor = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"gestor@setelagoas.mg.gov.br","senha":"senhaSegura123"}'
$hGestor = @{ "Authorization" = "Bearer $($loginGestor.token)" }

$loginUser = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"viniciuscastilho8@gmail.com","senha":"senhaSegura123"}'
$hUser = @{ "Authorization" = "Bearer $($loginUser.token)" }

# 2. Testar Autoavaliação de Habilidade no Perfil
Write-Host "`n[1/4] Testando Atualização de Perfil com Autoavaliação de Habilidade..." -ForegroundColor Yellow
$updatePerfil = @{
    nome = "Vinícius Castilho de Souza e Silva"
    telefone = "31988887777"
    objetivo = "PRATICAR_ESPORTES"
    habilidadeDeclarada = "JOGADOR_AMADOR"
} | ConvertTo-Json

$perfilAtualizado = Invoke-RestMethod -Uri "http://localhost:8080/api/usuarios/perfil" -Method Put -Headers $hUser -ContentType "application/json" -Body $updatePerfil
Write-Host "-> Habilidade Declarada: $($perfilAtualizado.habilidadeDeclarada) ($($perfilAtualizado.habilidadeDeclaradaDescricao))" -ForegroundColor Green
Write-Host "-> Reputação Atual: $($perfilAtualizado.reputacao) / 5.0 (Total Avaliações: $($perfilAtualizado.totalAvaliacoesReputacao))" -ForegroundColor Green

# 3. Criar uma nova partida para avaliação entre pares
Write-Host "`n[2/4] Criando Partida Comunitária para Avaliação Entre Pares..." -ForegroundColor Yellow
$partidaReq = @{
    esporte = "Basquete"
    dataHora = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss")
    duracaoMinutos = 60
    minJogadores = 6
    maxJogadores = 10
    descricao = "Basquete 3x3 no Parque da Cascata"
    latitude = -19.4620
    longitude = -44.2460
    bairro = "Centro"
} | ConvertTo-Json

$partida = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas" -Method Post -Headers $hUser -ContentType "application/json" -Body $partidaReq
Write-Host "-> Partida Criada ID: $($partida.id)" -ForegroundColor Green

# Gestor confirma presença
$confReq = @{
    latitude = -19.4630
    longitude = -44.2470
    bairro = "Canaã"
} | ConvertTo-Json

$partidaConfirmada = Invoke-RestMethod -Uri "http://localhost:8080/api/partidas/$($partida.id)/confirmar" -Method Post -Headers $hGestor -ContentType "application/json" -Body $confReq
Write-Host "-> Gestor confirmou presença! Total participantes: $($partidaConfirmada.participantes.Count)" -ForegroundColor Green

# 4. Gestor avalia Vinícius anonimamente com nota 5 e Habilidade AMADOR
Write-Host "`n[3/4] Enviando Avaliação Anônima da Partida..." -ForegroundColor Yellow
$avaliacaoReq = @{
    avaliacoes = @(
        @{
            avaliadoId = $loginUser.usuarioId
            notaReputacao = 5
            nivelHabilidade = "JOGADOR_AMADOR"
            comentario = "Excelente jogador, ótimo fair play e pontualidade!"
        }
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8080/api/avaliacoes/partida/$($partida.id)" -Method Post -Headers $hGestor -ContentType "application/json" -Body $avaliacaoReq
Write-Host "-> Avaliação enviada pelo Gestor com sucesso!" -ForegroundColor Green

# 5. Consultar Reputação e Validação de Habilidade
Write-Host "`n[4/4] Consultando Estado Atualizado do Usuário Avaliado..." -ForegroundColor Yellow
$rep = Invoke-RestMethod -Uri "http://localhost:8080/api/avaliacoes/usuario/$($loginUser.usuarioId)" -Method Get -Headers $hUser

Write-Host "================ RESUMO DO PERFIL DO ATLETA ================" -ForegroundColor Cyan
Write-Host "Reputação Fair Play: $($rep.reputacao) / 5.0 (Total Avaliações: $($rep.totalAvaliacoesReputacao))"
Write-Host "Habilidade Declarada (Autoavaliação): $($rep.habilidadeDeclaradaDescricao)"
Write-Host "Habilidade Validada pelos Pares: $($rep.habilidadeValidada) / 4.0 ($($rep.habilidadeValidadaDescricao))"
Write-Host "Total Avaliações de Habilidade: $($rep.totalAvaliacoesHabilidade)"
Write-Host "Nível Confirmado pela Comunidade: $($rep.nivelConfirmadoPelaComunidade)"
Write-Host "============================================================" -ForegroundColor Cyan

if ($rep.reputacao -ge 4.5 -and $rep.habilidadeDeclarada -eq "JOGADOR_AMADOR") {
    Write-Host "`n>>> SUCESSO TOTAL: TODAS AS REGRAS DE REPUTAÇÃO E HABILIDADE FORAM VALIDADAS! <<<" -ForegroundColor Green
} else {
    Write-Host "`n>>> ATENÇÃO: Valores divergentes do esperado! <<<" -ForegroundColor Red
}
