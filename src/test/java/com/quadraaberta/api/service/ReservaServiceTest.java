package com.quadraaberta.api.service;

import com.quadraaberta.api.dto.ReservaRequestDTO;
import com.quadraaberta.api.dto.ReservaResponseDTO;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.Reserva;
import com.quadraaberta.api.entity.TurmaSocial;
import com.quadraaberta.api.entity.Usuario;
import com.quadraaberta.api.entity.enums.*;
import com.quadraaberta.api.exception.ConflitoHorarioException;
import com.quadraaberta.api.exception.LimiteReservasExcedidoException;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
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

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservaServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private QuadraRepository quadraRepository;

    @Mock
    private TurmaSocialRepository turmaSocialRepository;

    @InjectMocks
    private ReservaService reservaService;

    private Usuario usuarioComunidade;
    private Quadra quadra;

    @BeforeEach
    void setUp() {
        usuarioComunidade = Usuario.builder()
                .id(1L)
                .nome("Carlos Morador")
                .email("carlos@comunidade.com")
                .cpf("12345678900")
                .role(Role.ROLE_COMUNIDADE)
                .ativo(true)
                .build();

        quadra = Quadra.builder()
                .id(10L)
                .nome("Quadra Central - Bairro Progresso")
                .bairro("Progresso")
                .logradouro("Rua das Palmeiras, 100")
                .tipoPiso(TipoPiso.CIMENTO)
                .possuiIluminacao(true)
                .status(StatusQuadra.DISPONIVEL)
                .build();
    }

    @Test
    @DisplayName("Regra 1: Deve rejeitar reserva avulsa que ultrapasse o teto de 2 horas consecutivas")
    void deveRejeitarReservaAcimaDeDuasHoras() {
        // Horário de 3 horas de duração
        LocalDateTime inicio = LocalDateTime.now().plusDays(1).withHour(14).withMinute(0);
        LocalDateTime fim = inicio.plusHours(3);

        ReservaRequestDTO dto = new ReservaRequestDTO(
                quadra.getId(),
                inicio,
                fim,
                TipoReserva.PARTIDA_AVULSA
        );

        assertThatThrownBy(() -> reservaService.criar(dto, usuarioComunidade))
                .isInstanceOf(ValidacaoNegocioException.class)
                .hasMessageContaining("não podem ultrapassar 2 horas consecutivas");

        verifyNoInteractions(quadraRepository, reservaRepository);
    }

    @Test
    @DisplayName("Regra 2: Deve rejeitar reserva quando usuário comum já atingiu o limite de 2 reservas ativas futuras")
    void deveRejeitarQuandoAtingirLimiteAntimonopolio() {
        LocalDateTime inicio = LocalDateTime.now().plusDays(1).withHour(18).withMinute(0);
        LocalDateTime fim = inicio.plusHours(1);

        ReservaRequestDTO dto = new ReservaRequestDTO(
                quadra.getId(),
                inicio,
                fim,
                TipoReserva.PARTIDA_AVULSA
        );

        // Mock: usuário já possui 2 reservas ativas futuras
        when(reservaRepository.countReservasFuturasAtivas(eq(usuarioComunidade.getId()), eq(StatusReserva.CONFIRMADA), any()))
                .thenReturn(2L);

        assertThatThrownBy(() -> reservaService.criar(dto, usuarioComunidade))
                .isInstanceOf(LimiteReservasExcedidoException.class)
                .hasMessageContaining("Limite de antimonopólio atingido");

        verify(reservaRepository, times(1)).countReservasFuturasAtivas(any(), any(), any());
        verifyNoInteractions(quadraRepository);
    }

    @Test
    @DisplayName("Regra 3: Deve impedir double booking quando houver reserva confirmada sobreposta")
    void deveImpedirDoubleBookingQuandoHouverConflito() {
        LocalDateTime inicio = LocalDateTime.now().plusDays(2).withHour(19).withMinute(0);
        LocalDateTime fim = inicio.plusHours(2);

        ReservaRequestDTO dto = new ReservaRequestDTO(
                quadra.getId(),
                inicio,
                fim,
                TipoReserva.PARTIDA_AVULSA
        );

        when(reservaRepository.countReservasFuturasAtivas(any(), any(), any())).thenReturn(0L);
        when(quadraRepository.findByIdWithLock(quadra.getId())).thenReturn(Optional.of(quadra));

        // Mock: já existe uma reserva confirmada para este horário
        Reserva reservaExistente = Reserva.builder()
                .id(99L)
                .quadra(quadra)
                .usuario(Usuario.builder().id(2L).nome("Outro Morador").build())
                .dataInicio(inicio)
                .dataFim(fim)
                .tipoReserva(TipoReserva.PARTIDA_AVULSA)
                .status(StatusReserva.CONFIRMADA)
                .build();

        when(reservaRepository.findSobreposicoes(eq(quadra.getId()), eq(inicio), eq(fim), eq(StatusReserva.CONFIRMADA)))
                .thenReturn(List.of(reservaExistente));

        assertThatThrownBy(() -> reservaService.criar(dto, usuarioComunidade))
                .isInstanceOf(ConflitoHorarioException.class)
                .hasMessageContaining("já possui uma reserva confirmada");

        verify(quadraRepository, times(1)).findByIdWithLock(quadra.getId());
        verify(reservaRepository, times(1)).findSobreposicoes(any(), any(), any(), any());
        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Regra de Prioridade: Deve rejeitar partida avulsa que conflite com horário de Turma Social")
    void deveRejeitarPartidaAvulsaEmConflitoComTurmaSocial() {
        LocalDateTime inicio = LocalDateTime.now().plusDays(3).withHour(10).withMinute(0);
        LocalDateTime fim = inicio.plusHours(1);

        ReservaRequestDTO dto = new ReservaRequestDTO(
                quadra.getId(),
                inicio,
                fim,
                TipoReserva.PARTIDA_AVULSA
        );

        when(reservaRepository.countReservasFuturasAtivas(any(), any(), any())).thenReturn(0L);
        when(quadraRepository.findByIdWithLock(quadra.getId())).thenReturn(Optional.of(quadra));
        when(reservaRepository.findSobreposicoes(any(), any(), any(), any())).thenReturn(Collections.emptyList());

        // Mock: turma social contínua agendada
        TurmaSocial turma = TurmaSocial.builder()
                .id(5L)
                .quadra(quadra)
                .modalidade("Treino Funcional Comunitário")
                .horarioInicio(LocalTime.of(9, 30))
                .horarioFim(LocalTime.of(11, 0))
                .ativo(true)
                .build();

        when(turmaSocialRepository.findConflitosTurma(eq(quadra.getId()), any(), any(), any()))
                .thenReturn(List.of(turma));

        assertThatThrownBy(() -> reservaService.criar(dto, usuarioComunidade))
                .isInstanceOf(ConflitoHorarioException.class)
                .hasMessageContaining("Horário bloqueado prioritariamente para a turma social contínua");

        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sucesso: Deve criar reserva com sucesso respeitando todas as regras")
    void deveCriarReservaComSucesso() {
        LocalDateTime inicio = LocalDateTime.now().plusDays(2).withHour(16).withMinute(0);
        LocalDateTime fim = inicio.plusHours(2); // Exatamente 2h

        ReservaRequestDTO dto = new ReservaRequestDTO(
                quadra.getId(),
                inicio,
                fim,
                TipoReserva.PARTIDA_AVULSA
        );

        when(reservaRepository.countReservasFuturasAtivas(any(), any(), any())).thenReturn(1L); // 1 reserva ativa (abaixo do teto 2)
        when(quadraRepository.findByIdWithLock(quadra.getId())).thenReturn(Optional.of(quadra));
        when(reservaRepository.findSobreposicoes(any(), any(), any(), any())).thenReturn(Collections.emptyList());
        when(turmaSocialRepository.findConflitosTurma(any(), any(), any(), any())).thenReturn(Collections.emptyList());

        Reserva reservaPersistida = Reserva.builder()
                .id(100L)
                .quadra(quadra)
                .usuario(usuarioComunidade)
                .dataInicio(inicio)
                .dataFim(fim)
                .tipoReserva(TipoReserva.PARTIDA_AVULSA)
                .status(StatusReserva.CONFIRMADA)
                .criadoEm(LocalDateTime.now())
                .build();

        when(reservaRepository.save(any(Reserva.class))).thenReturn(reservaPersistida);

        ReservaResponseDTO response = reservaService.criar(dto, usuarioComunidade);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(100L);
        assertThat(response.quadraNome()).isEqualTo(quadra.getNome());
        assertThat(response.status()).isEqualTo(StatusReserva.CONFIRMADA);

        verify(reservaRepository, times(1)).save(any(Reserva.class));
    }
}
