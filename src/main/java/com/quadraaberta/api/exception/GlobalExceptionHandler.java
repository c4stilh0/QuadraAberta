package com.quadraaberta.api.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntidadeNaoEncontradaException.class)
    public ProblemDetail handleEntidadeNaoEncontrada(EntidadeNaoEncontradaException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Recurso Não Encontrado");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/recurso-nao-encontrado"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(ConflitoHorarioException.class)
    public ProblemDetail handleConflitoHorario(ConflitoHorarioException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Conflito de Horário");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/conflito-horario"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(LimiteReservasExcedidoException.class)
    public ProblemDetail handleLimiteReservas(LimiteReservasExcedidoException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Limite de Reservas Atingido");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/limite-reservas"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(ValidacaoNegocioException.class)
    public ProblemDetail handleValidacaoNegocio(ValidacaoNegocioException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Regra de Negócio Violada");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/validacao-negocio"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Um ou mais campos contêm valores inválidos."
        );
        problem.setTitle("Erro de Validação de Dados");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/validacao-campos"));
        problem.setProperty("timestamp", Instant.now());

        Map<String, String> erros = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            erros.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        problem.setProperty("erros", erros);
        return problem;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "Credenciais inválidas. Verifique seu e-mail e senha."
        );
        problem.setTitle("Credenciais Inválidas");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/credenciais-invalidas"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                "Acesso negado. Você não tem permissão para realizar esta operação."
        );
        problem.setTitle("Acesso Negado");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/acesso-negado"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "Violação de integridade de dados. O registro já existe ou houve sobreposição de horário no banco."
        );
        problem.setTitle("Conflito de Integridade");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/conflito-integridade"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro interno inesperado no servidor."
        );
        problem.setTitle("Erro Interno do Servidor");
        problem.setType(URI.create("https://quadraaberta.com.br/erros/erro-interno"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
