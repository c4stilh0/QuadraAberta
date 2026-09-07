-- Adiciona coordenadas geográficas e modalidades esportivas suportadas na tabela de quadras
ALTER TABLE tb_quadra ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE tb_quadra ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE tb_quadra ADD COLUMN IF NOT EXISTS modalidades VARCHAR(250);
