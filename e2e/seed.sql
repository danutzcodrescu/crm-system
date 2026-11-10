-- Synthetic data only. Applied AFTER the real db/*.sql migrations on a fresh container.
-- smoke_user / smoke-password (Argon2id, same settings as the application).
INSERT INTO authentication.users (id, username, password) VALUES
  (1, 'smoke_user', '$argon2id$v=19$m=19456,t=2,p=1$nHl7wX6xH8QL6V/72c2iPA$WPJjqgWOhq7PY+1U6q3H4fW4nxpdVmBDqUCID57s1+g');
SELECT setval(pg_get_serial_sequence('authentication.users', 'id'), 1);

INSERT INTO statuses (id, name) VALUES (1, 'Smoke active'), (2, 'Smoke pending');
SELECT setval(pg_get_serial_sequence('statuses', 'id'), 2);

-- Relative to today so default-year loaders and the municipality detail never go stale.
INSERT INTO years (name)
SELECT generate_series(2022, EXTRACT(YEAR FROM CURRENT_DATE)::integer + 7);

INSERT INTO companies (id, name, code, email, status_id, responsible_id, consultations, wave, working_category) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Smoke Åby', '9901', 'aby@example.invalid', 1, 1,
    ARRAY[EXTRACT(YEAR FROM CURRENT_DATE)::smallint, (EXTRACT(YEAR FROM CURRENT_DATE) + 2)::smallint], '1', 'wave 1'),
  ('10000000-0000-4000-8000-000000000002', 'Smoke Örebro', '9902', 'orebro@example.invalid', 2, NULL,
    ARRAY[EXTRACT(YEAR FROM CURRENT_DATE)::smallint], '2', 'wave 2'),
  ('10000000-0000-4000-8000-000000000003', 'Smoke Empty', '9903', 'empty@example.invalid', 2, NULL,
    ARRAY[]::smallint[], NULL, NULL);

INSERT INTO initial_consultations (id, company_id, document_date_sent, date_signed, date_shared, link)
SELECT ('20000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, id,
  '2023-01-02T12:00:00Z', '2023-02-03T12:00:00Z', '2023-03-04T12:00:00Z', 'https://example.invalid/consultation'
FROM (SELECT id, row_number() OVER (ORDER BY code) n FROM companies) c;

INSERT INTO agreements (id, company_id, type_of_agreement, old_agreement_date_signed, new_agreement_date_signed)
SELECT ('30000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, id,
  CASE WHEN n = 2 THEN 'old'::agreement_type ELSE 'new'::agreement_type END,
  CASE WHEN n = 2 THEN '2023-02-03T12:00:00Z'::timestamptz END,
  CASE WHEN n = 1 THEN '2023-02-03T12:00:00Z'::timestamptz END
FROM (SELECT id, row_number() OVER (ORDER BY code) n FROM companies) c;

INSERT INTO general_information (company_id, year, inhabitants, land_surface, cleaning_cost, cleaned_kg, epa_litter_measurement)
SELECT c.id, y.name, 12000, 250.50, 100000, 250, true FROM companies c CROSS JOIN years y;
INSERT INTO reporting (company_id, year, reporting_date, cigarette_butts, motivation)
SELECT c.id, y.name, make_timestamptz(y.name, 4, 5, 12, 0, 0, 'UTC'), 123.45, 'Synthetic baseline'
FROM companies c CROSS JOIN years y;
INSERT INTO recurring_consultations (company_id, year, sent_date, meeting_date, consultation_form_completed, meeting_held)
SELECT c.id, y.name, make_timestamptz(y.name, 1, 2, 12, 0, 0, 'UTC'), CURRENT_TIMESTAMP + interval '7 days', true, false
FROM companies c CROSS JOIN years y;
INSERT INTO invoicing (company_id, year, invoice_amount, vat, invoice_date, date_paid)
SELECT c.id, y.name, 15000.50, 3750.12, make_timestamptz(y.name, 5, 6, 12, 0, 0, 'UTC'),
  CASE WHEN c.code = '9901' THEN make_timestamptz(y.name, 6, 7, 12, 0, 0, 'UTC') END
FROM companies c CROSS JOIN years y;

INSERT INTO responsibles (id, company_id, name, email, phone_number, mobile_number, title) VALUES
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Smoke Contact', 'contact@example.invalid', '010123456', '070123456', 'Coordinator');
INSERT INTO reminders (id, company_id, description, due_date) VALUES
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Smoke reminder', CURRENT_TIMESTAMP + interval '1 day');
INSERT INTO logs (id, company_id, description, date, reminder_id) VALUES
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Smoke seeded log', CURRENT_TIMESTAMP, '50000000-0000-4000-8000-000000000001');

REFRESH MATERIALIZED VIEW compensation_view;
