-- Adiciona foto de perfil e objetivo comunitário na tabela de usuários
ALTER TABLE tb_usuario ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255);
ALTER TABLE tb_usuario ADD COLUMN IF NOT EXISTS objetivo VARCHAR(50) DEFAULT 'PRATICAR_ESPORTES';
