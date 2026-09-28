-- Migration V7: Sistema de Bate-Papo / Mensagens no Lobby da Partida
-- Permite que os participantes confirmados e o criador alinhem detalhes práticos do jogo

CREATE TABLE tb_mensagem_partida (
    id BIGSERIAL PRIMARY KEY,
    partida_id BIGINT NOT NULL,
    usuario_id BIGINT,
    conteudo VARCHAR(500) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'USUARIO',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensagem_partida FOREIGN KEY (partida_id) REFERENCES tb_partida_match(id) ON DELETE CASCADE,
    CONSTRAINT fk_mensagem_usuario FOREIGN KEY (usuario_id) REFERENCES tb_usuario(id) ON DELETE SET NULL
);

-- Índices para carregamento rápido e ordenado do histórico do bate-papo
CREATE INDEX idx_mensagem_partida_criado_em ON tb_mensagem_partida(partida_id, criado_em);
CREATE INDEX idx_mensagem_usuario ON tb_mensagem_partida(usuario_id);
