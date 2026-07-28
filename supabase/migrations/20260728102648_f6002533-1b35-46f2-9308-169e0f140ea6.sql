-- TEMPORARY DEVELOPMENT ACCESS for app.frameworks
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app.frameworks TO authenticated;

ALTER TABLE app.frameworks ENABLE ROW LEVEL SECURITY;

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_frameworks_select ON app.frameworks
  FOR SELECT TO authenticated USING (true);

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_frameworks_insert ON app.frameworks
  FOR INSERT TO authenticated WITH CHECK (true);

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_frameworks_update ON app.frameworks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_frameworks_delete ON app.frameworks
  FOR DELETE TO authenticated USING (true);
