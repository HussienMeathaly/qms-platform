-- TEMPORARY DEVELOPMENT CONFIGURATION
-- Scope: unblock the Organizations module during development.
-- Replace with production authorization model later.

-- 1. Schema USAGE (required for PostgREST to enter the schema)
GRANT USAGE ON SCHEMA app TO authenticated;

-- 2. Minimum CRUD table privileges on app.organizations
GRANT SELECT, INSERT, UPDATE, DELETE ON app.organizations TO authenticated;

-- 3. Ensure RLS is enabled (no structural change; safe if already enabled)
ALTER TABLE app.organizations ENABLE ROW LEVEL SECURITY;

-- 4. TEMPORARY DEVELOPMENT POLICIES (authenticated users only)
DROP POLICY IF EXISTS "dev_temp_orgs_select" ON app.organizations;
DROP POLICY IF EXISTS "dev_temp_orgs_insert" ON app.organizations;
DROP POLICY IF EXISTS "dev_temp_orgs_update" ON app.organizations;
DROP POLICY IF EXISTS "dev_temp_orgs_delete" ON app.organizations;

-- TEMPORARY DEVELOPMENT POLICY - remove before production
CREATE POLICY "dev_temp_orgs_select"
  ON app.organizations FOR SELECT
  TO authenticated
  USING (true);

-- TEMPORARY DEVELOPMENT POLICY - remove before production
CREATE POLICY "dev_temp_orgs_insert"
  ON app.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- TEMPORARY DEVELOPMENT POLICY - remove before production
CREATE POLICY "dev_temp_orgs_update"
  ON app.organizations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- TEMPORARY DEVELOPMENT POLICY - remove before production
CREATE POLICY "dev_temp_orgs_delete"
  ON app.organizations FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON POLICY "dev_temp_orgs_select" ON app.organizations IS 'TEMPORARY DEVELOPMENT POLICY - replace with production authorization model';
COMMENT ON POLICY "dev_temp_orgs_insert" ON app.organizations IS 'TEMPORARY DEVELOPMENT POLICY - replace with production authorization model';
COMMENT ON POLICY "dev_temp_orgs_update" ON app.organizations IS 'TEMPORARY DEVELOPMENT POLICY - replace with production authorization model';
COMMENT ON POLICY "dev_temp_orgs_delete" ON app.organizations IS 'TEMPORARY DEVELOPMENT POLICY - replace with production authorization model';