-- Dedicated schema. The existing app/public tables are not changed.
CREATE SCHEMA operacao;
REVOKE ALL ON SCHEMA operacao FROM PUBLIC, anon, authenticated;

CREATE TABLE operacao.records (
  id text PRIMARY KEY, kind text NOT NULL, body text NOT NULL,
  updated text NOT NULL, CHECK (jsonb_typeof(body::jsonb) = 'object')
);
CREATE TABLE operacao.users (
  id text PRIMARY KEY, email text NOT NULL UNIQUE,
  name text NOT NULL, role text NOT NULL, access_level text,
  units text NOT NULL CHECK (jsonb_typeof(units::jsonb) = 'array'),
  password_hash text, salt text,
  must_change text NOT NULL DEFAULT '1' CHECK (must_change IN ('0','1')),
  active text NOT NULL DEFAULT '1' CHECK (active IN ('0','1'))
);
CREATE TABLE operacao.sessions (
  token text PRIMARY KEY, user_id text NOT NULL REFERENCES operacao.users(id),
  expires text NOT NULL
);
CREATE TABLE operacao.login_limits (
  key text PRIMARY KEY, attempts text NOT NULL, until text NOT NULL
);
CREATE TABLE operacao.blobs (
  key text PRIMARY KEY, content_type text NOT NULL,
  custom_metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX records_kind ON operacao.records(kind);
CREATE INDEX records_task_unit_date ON operacao.records
  ((body::jsonb ->> 'unit'), (body::jsonb ->> 'date')) WHERE kind='task';
CREATE INDEX sessions_user ON operacao.sessions(user_id);
CREATE INDEX sessions_expiry ON operacao.sessions(expires);
ALTER TABLE operacao.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacao.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacao.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacao.login_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE operacao.blobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA operacao FROM PUBLIC, anon, authenticated;
-- Only the trusted backend uses this schema. The browser receives no SQL credential.
GRANT USAGE ON SCHEMA operacao TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA operacao TO service_role;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('operacao-evidencias','operacao-evidencias',false,8388608,
  ARRAY['image/jpeg','image/png','image/webp','application/json']);
-- Existing permissive Storage policies must not expose this bucket.
CREATE POLICY operacao_server_only ON storage.objects AS RESTRICTIVE
FOR ALL TO anon, authenticated
USING (bucket_id <> 'operacao-evidencias')
WITH CHECK (bucket_id <> 'operacao-evidencias');
