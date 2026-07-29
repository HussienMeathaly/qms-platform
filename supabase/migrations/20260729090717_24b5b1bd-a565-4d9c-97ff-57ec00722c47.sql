GRANT SELECT, INSERT, UPDATE, DELETE ON app.framework_versions TO authenticated;

ALTER TABLE app.framework_versions ENABLE ROW LEVEL SECURITY;

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_framework_versions_select
  ON app.framework_versions FOR SELECT TO authenticated USING (true);

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_framework_versions_insert
  ON app.framework_versions FOR INSERT TO authenticated WITH CHECK (true);

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_framework_versions_update
  ON app.framework_versions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_framework_versions_delete
  ON app.framework_versions FOR DELETE TO authenticated USING (true);