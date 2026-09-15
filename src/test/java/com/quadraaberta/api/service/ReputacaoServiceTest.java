package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.AvaliacaoLoteRequestDTO;
import com.quadraaberta.api.dto.AvaliarColegaRequestDTO;
import com.quadraaberta.api.dto.ReputacaoUsuarioDTO;
import com.quadraaberta.api.entity.PartidaMatch;
import com.quadraaberta.api.entity.ParticipantePartida;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.NivelHabilidade;
import com.quadraaberta.api.repository.AvaliacaoUsuarioRepository;
import com.quadraaberta.api.repository.PartidaMatchRepository;
import com.quadraaberta.api.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReputacaoServiceTest {

    @Mock
    private AvaliacaoUsuarioRepository avaliacaoUsuarioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PartidaMatchRepository partidaRepository;

    @InjectMocks
    private ReputacaoService reputacaoService;

    private Usuario jogadorAvaliador;
    private Usuario jogadorAvaliado;
    private PartidaMatch partida;

    @BeforeEach
    void setUp() {
        jogadorAvaliador = Usuario.builder()
                .id(1L)
                .nome("Avaliador")
                .email("avaliador@teste.com")
                .reputacao(5.0)
                .totalAvaliacoesReputacao(0)
                .streakPositiva(0)
                .streakNegativa(0)
                .habilidadeDeclarada(NivelHabilidade.JOGADOR_CASUAL)
                .build();

        jogadorAvaliado = Usuario.builder()
                .id(2L)
                .nome("Avaliado")
                .email("avaliado@teste.com")
                .reputacao(5.0)
                .totalAvaliacoesReputacao(0)
                .streakPositiva(0)
                .streakNegativa(0)
                .habilidadeDeclarada(NivelHabilidade.JOGADOR_AMADOR)
                .build();

        List<ParticipantePartida> participantes = new ArrayList<>();
        partida = PartidaMatch.builder()
                .id(100L)
                .participantes(participantes)
                .build();

        participantes.add(ParticipantePartida.builder().partida(partida).usuario(jogadorAvaliador).bairro("Canaã").build());
        participantes.add(ParticipantePartida.builder().partida(partida).usuario(jogadorAvaliado).bairro("Progresso").build());
    }

    @Test
    @DisplayName("Usuário com streak positiva sofre amortecimento ao receber nota negativa isolada")
    void testAmortecimentoNotaNegativaComStreakPositiva() {
        // Simula usuário já com 5 avaliações positivas seguidas
        jogadorAvaliado.setReputacao(5.0);
        jogadorAvaliado.setTotalAvaliacoesReputacao(5);
        jogadorAvaliado.setStreakPositiva(5);
        jogadorAvaliado.setStreakNegativa(0);

        when(partidaRepository.findById(100L)).thenReturn(Optional.of(partida));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(jogadorAvaliador));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(jogadorAvaliado));
        when(avaliacaoUsuarioRepository.existsByPartidaIdAndAvaliadorIdAndAvaliadoId(100L, 1L, 2L)).thenReturn(false);

        // Avaliador dá nota 1 (nota negativa)
        AvaliarColegaRequestDTO avaliacao = new AvaliarColegaRequestDTO(
                2L,
                1,
                NivelHabilidade.JOGADOR_AMADOR,
                "Não tocou a bola"
        );
        AvaliacaoLoteRequestDTO lote = new AvaliacaoLoteRequestDTO(List.of(avaliacao));

        reputacaoService.registrarAvaliacoesEmLote(100L, 1L, lote);

        // Sem amortecimento: (5.0 * 5 + 1 * 1) / 6 = 4.33
        // Com amortecimento: peso = 1 / (1 + 0.25 * 5) = 1 / 2.25 = 0.444
        // novaRep = (25 + 0.444) / 5.444 = 4.67
        assertTrue(jogadorAvaliado.getReputacao() > 4.60,
                "A reputação deve ser protegida pelo amortecimento de streak positiva (esperado > 4.60, obtido: " + jogadorAvaliado.getReputacao() + ")");
        assertEquals(4, jogadorAvaliado.getStreakPositiva(), "Streak positiva deve ser decrementada em 1");
        assertEquals(0, jogadorAvaliado.getStreakNegativa());
    }

    @Test
    @DisplayName("Usuário com streak negativa não infla nota bruscamente com nota positiva isolada")
    void testAmortecimentoNotaPositivaComStreakNegativa() {
        // Simula usuário com streak negativa de 4 avaliações ruins
        jogadorAvaliado.setReputacao(2.5);
        jogadorAvaliado.setTotalAvaliacoesReputacao(4);
        jogadorAvaliado.setStreakPositiva(0);
        jogadorAvaliado.setStreakNegativa(4);

        when(partidaRepository.findById(100L)).thenReturn(Optional.of(partida));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(jogadorAvaliador));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(jogadorAvaliado));
        when(avaliacaoUsuarioRepository.existsByPartidaIdAndAvaliadorIdAndAvaliadoId(100L, 1L, 2L)).thenReturn(false);

        // Avaliador dá nota 5 (nota positiva)
        AvaliarColegaRequestDTO avaliacao = new AvaliarColegaRequestDTO(
                2L,
                5,
                NivelHabilidade.JOGADOR_AMADOR,
                "Jogou bem hoje"
        );
        AvaliacaoLoteRequestDTO lote = new AvaliacaoLoteRequestDTO(List.of(avaliacao));

        reputacaoService.registrarAvaliacoesEmLote(100L, 1L, lote);

        // Sem amortecimento: (2.5 * 4 + 5 * 1) / 5 = 3.00
        // Com amortecimento: peso = 1 / (1 + 0.25 * 4) = 0.5
        // novaRep = (10 + 2.5) / 4.5 = 2.78
        assertTrue(jogadorAvaliado.getReputacao() < 2.90,
                "A reputação deve ter recuperação gradual amortecida (esperado < 2.90, obtido: " + jogadorAvaliado.getReputacao() + ")");
        assertEquals(3, jogadorAvaliado.getStreakNegativa(), "Streak negativa deve ser decrementada em 1");
    }

    @Test
    @DisplayName("Validação de habilidade por pares calcula média e valida nível")
    void testValidacaoHabilidadePorPares() {
        jogadorAvaliado.setHabilidadeDeclarada(NivelHabilidade.JOGADOR_AMADOR); // peso 3.0
        jogadorAvaliado.setHabilidadeValidada(null);
        jogadorAvaliado.setTotalAvaliacoesHabilidade(0);

        when(partidaRepository.findById(100L)).thenReturn(Optional.of(partida));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(jogadorAvaliador));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(jogadorAvaliado));
        when(avaliacaoUsuarioRepository.existsByPartidaIdAndAvaliadorIdAndAvaliadoId(100L, 1L, 2L)).thenReturn(false);

        AvaliarColegaRequestDTO avaliacao = new AvaliarColegaRequestDTO(
                2L,
                5,
                NivelHabilidade.JOGADOR_AMADOR,
                "Joga muito bem no nível amador"
        );
        AvaliacaoLoteRequestDTO lote = new AvaliacaoLoteRequestDTO(List.of(avaliacao));

        reputacaoService.registrarAvaliacoesEmLote(100L, 1L, lote);

        assertEquals(3.0, jogadorAvaliado.getHabilidadeValidada());
        assertEquals(1, jogadorAvaliado.getTotalAvaliacoesHabilidade());

        // Simula mais 2 avaliações de outros pares no nível amador
        jogadorAvaliado.setTotalAvaliacoesHabilidade(3);
        jogadorAvaliado.setHabilidadeValidada(3.0);

        ReputacaoUsuarioDTO dto = ReputacaoUsuarioDTO.fromUsuario(jogadorAvaliado);
        assertTrue(dto.nivelConfirmadoPelaComunidade(), "Com 3 avaliações coerentes, o nível deve ser confirmado pela comunidade!");
        assertEquals("Jogador Amador", dto.habilidadeValidadaDescricao());
    }
}
