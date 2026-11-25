package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.ConfirmarPresencaRequestDTO;
import com.quadraaberta.api.dto.PartidaResponseDTO;
import com.quadraaberta.api.entity.PartidaMatch;
import com.quadraaberta.api.entity.ParticipantePartida;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.Reserva;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.Role;
import com.quadraaberta.api.entity.enums.StatusPartida;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.entity.enums.StatusReserva;
import com.quadraaberta.api.entity.enums.TipoPiso;
import com.quadraaberta.api.exception.ConflitoHorarioException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import com.quadraaberta.api.repository.PartidaMatchRepository;
import com.quadraaberta.api.repository.QuadraRepository;
import com.quadraaberta.api.repository.ReservaRepository;
import com.quadraaberta.api.repository.TurmaSocialRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchmakingServiceTest {

    @Mock
    private PartidaMatchRepository partidaRepository;

    @Mock
    private QuadraRepository quadraRepository;

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private TurmaSocialRepository turmaSocialRepository;

    @Mock
    private ChatPartidaService chatPartidaService;

    @InjectMocks
    private MatchmakingService matchmakingService;

    private Usuario criador;
    private Usuario jogador2;
    private Quadra quadraCentro;
    private PartidaMatch partida;

    @BeforeEach
    void setUp() {
        criador = Usuario.builder()
                .id(1L)
                .nome("Criador")
                .email("criador@teste.com")
                .role(Role.ROLE_COMUNIDADE)
                .build();

        jogador2 = Usuario.builder()
                .id(2L)
                .nome("Jogador Dois")
                .email("jogador2@teste.com")
                .role(Role.ROLE_COMUNIDADE)
                .build();

        quadraCentro = Quadra.builder()
                .id(10L)
                .nome("Ginásio Centro")
                .bairro("Centro")
                .logradouro("Av. Principal, 10")
                .tipoPiso(TipoPiso.CIMENTO)
                .possuiIluminacao(true)
                .latitude(new BigDecimal("-19.4650"))
                .longitude(new BigDecimal("-44.2460"))
                .modalidades("Futsal, Basquete")
                .status(StatusQuadra.DISPONIVEL)
                .build();

        partida = PartidaMatch.builder()
                .id(100L)
                .criador(criador)
                .esporte("FUTSAL")
                .dataHora(LocalDateTime.now().plusDays(1).withHour(19).withMinute(0))
                .duracaoMinutos(60)
                .minJogadores(6)
                .maxJogadores(12)
                .bairroCriador("Centro")
                .status(StatusPartida.BUSCANDO_JOGADORES)
                .centroideLat(-19.4600)
                .centroideLng(-44.2400)
                .participantes(new ArrayList<>())
                .build();

        partida.getParticipantes().add(ParticipantePartida.builder()
                .id(1L)
                .partida(partida)
                .usuario(criador)
                .bairro("Centro")
                .latitude(-19.4600)
                .longitude(-44.2400)
                .build());
    }

    @Test
    @DisplayName("Deve recalcular centróide corretamente quando novo participante confirma presença")
    void deveRecalcularCentroideAoConfirmarPresenca() {
        when(partidaRepository.findById(100L)).thenReturn(Optional.of(partida));
        when(partidaRepository.save(any(PartidaMatch.class))).thenAnswer(inv -> inv.getArgument(0));
        when(quadraRepository.findAll()).thenReturn(List.of(quadraCentro));

        ConfirmarPresencaRequestDTO dto = new ConfirmarPresencaRequestDTO("Progresso", -19.4800, -44.2600);
        PartidaResponseDTO resp = matchmakingService.confirmarPresenca(100L, jogador2, dto);

        assertThat(resp.totalParticipantes()).isEqualTo(2);
        assertThat(resp.centroideLat()).isEqualTo(-19.4700);
        assertThat(resp.centroideLng()).isEqualTo(-44.2500);
    }

    @Test
    @DisplayName("Deve impedir escolher quadra quando já existe reserva confirmada no mesmo horário")
    void deveImpedirEscolherQuadraComConflitoDeReserva() {
        when(partidaRepository.findById(100L)).thenReturn(Optional.of(partida));
        when(quadraRepository.findById(10L)).thenReturn(Optional.of(quadraCentro));
        when(reservaRepository.findSobreposicoes(anyLong(), any(), any(), any()))
                .thenReturn(List.of(Reserva.builder()
                        .id(50L)
                        .quadra(quadraCentro)
                        .dataInicio(partida.getDataHora())
                        .dataFim(partida.getDataHora().plusHours(1))
                        .status(StatusReserva.CONFIRMADA)
                        .build()));

        assertThatThrownBy(() -> matchmakingService.escolherQuadra(100L, 10L, criador))
                .isInstanceOf(ConflitoHorarioException.class)
                .hasMessageContaining("já possui reserva confirmada");
    }

    @Test
    @DisplayName("Deve impedir escolher quadra quando já existe outra partida fixada em horário sobreposto")
    void deveImpedirEscolherQuadraComConflitoDeOutraPartida() {
        PartidaMatch outraPartida = PartidaMatch.builder()
                .id(200L)
                .quadraEscolhida(quadraCentro)
                .status(StatusPartida.QUADRA_DEFINIDA)
                .dataHora(partida.getDataHora().plusMinutes(30))
                .duracaoMinutos(60)
                .build();

        when(partidaRepository.findById(100L)).thenReturn(Optional.of(partida));
        when(quadraRepository.findById(10L)).thenReturn(Optional.of(quadraCentro));
        when(reservaRepository.findSobreposicoes(anyLong(), any(), any(), any())).thenReturn(Collections.emptyList());
        when(turmaSocialRepository.findConflitosTurma(anyLong(), any(), any(), any())).thenReturn(Collections.emptyList());
        when(partidaRepository.findPartidasFixadasNaQuadraNoPeriodo(anyLong(), any(), anyLong(), any(), any()))
                .thenReturn(List.of(outraPartida));

        assertThatThrownBy(() -> matchmakingService.escolherQuadra(100L, 10L, criador))
                .isInstanceOf(ConflitoHorarioException.class)
                .hasMessageContaining("outra partida comunitária");
    }

    @Test
    @DisplayName("Deve finalizar partida quando solicitada pelo criador e impedir não-criador")
    void deveFinalizarPartidaApenasPorCriadorOuGestor() {
        when(partidaRepository.findById(100L)).thenReturn(Optional.of(partida));

        assertThatThrownBy(() -> matchmakingService.finalizarPartida(100L, jogador2))
                .isInstanceOf(ValidacaoNegocioException.class);

        when(partidaRepository.save(any(PartidaMatch.class))).thenAnswer(inv -> inv.getArgument(0));
        when(quadraRepository.findAll()).thenReturn(List.of(quadraCentro));

        PartidaResponseDTO finalizada = matchmakingService.finalizarPartida(100L, criador);

        assertThat(finalizada.status()).isEqualTo(StatusPartida.FINALIZADA);
        verify(chatPartidaService).enviarMensagemSistema(anyLong(), any());
    }
}
