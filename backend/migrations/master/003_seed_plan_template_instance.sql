-- Plan Demo, plantilla Por defecto e instancia Demo médico (solo si no existen)
INSERT INTO plans (id, name, price_monthly, price_annual)
SELECT 1, 'Demo', 0, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE id = 1);

INSERT INTO templates (id, name, type)
SELECT 1, 'Por defecto', 'library' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM templates WHERE id = 1);

INSERT INTO template_versions (id, template_id, version)
SELECT 1, 1, '1.0.0' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM template_versions WHERE id = 1);

INSERT INTO instances (name, slug, db_name, domain_type, domain_value, plan_id, template_id, template_version_id, state)
SELECT 'Demo médico', 'demo_medico', 'citas_demo_medico', 'subdomain_ours', 'demo_medico.localhost', 1, 1, 1, 'active'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM instances WHERE slug = 'demo_medico');
