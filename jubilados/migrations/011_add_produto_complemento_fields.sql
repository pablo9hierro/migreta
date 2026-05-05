-- Migration 011: adiciona campos de complemento fiscal ao cadastro de produto
-- Esses campos são preenchidos manualmente pelo lojista após importação via XML.

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS codigo_interno TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS categoria      TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS organizacao    TEXT;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS padronizacao   TEXT;
