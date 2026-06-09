ALTER TABLE solicitacoes_snow_itens
  DROP CONSTRAINT IF EXISTS solicitacoes_snow_itens_maquina_id_fkey;

ALTER TABLE solicitacoes_snow_itens
  ADD CONSTRAINT solicitacoes_snow_itens_maquina_id_fkey
  FOREIGN KEY (maquina_id)
  REFERENCES maquinas(id)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;
