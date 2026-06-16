-- Migration 012: campos IBS/CBS obrigatorios no cadastro de produtos
-- Baseado na Classificacao Tributaria oficial do Portal da Conformidade Facil (SVRS)

ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cst_ibs_cbs            VARCHAR(3);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cclass_trib            VARCHAR(6);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS reducao_ibs            NUMERIC(5,2);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS reducao_cbs            NUMERIC(5,2);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tipo_aliquota_ibs_cbs  VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_produtos_cclass_trib ON produtos(cclass_trib);
