-- Migration V6: Ajustar colunas de reputação e habilidade para DOUBLE PRECISION compatível com JPA Double
ALTER TABLE tb_usuario 
    ALTER COLUMN reputacao TYPE DOUBLE PRECISION,
    ALTER COLUMN habilidade_validada TYPE DOUBLE PRECISION;
