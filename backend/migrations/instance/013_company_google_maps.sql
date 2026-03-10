-- Ficha de Google y iframe de Maps para la empresa

ALTER TABLE company
  ADD COLUMN google_business_url VARCHAR(512) DEFAULT NULL,
  ADD COLUMN google_maps_embed_src VARCHAR(1024) DEFAULT NULL;
