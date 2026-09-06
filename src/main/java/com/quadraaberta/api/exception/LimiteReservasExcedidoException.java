package com.quadraaberta.api.exception;

public class LimiteReservasExcedidoException extends RuntimeException {
    public LimiteReservasExcedidoException(String mensagem) {
        super(mensagem);
    }
}
