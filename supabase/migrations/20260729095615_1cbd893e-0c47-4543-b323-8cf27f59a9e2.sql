
GRANT SELECT, INSERT, UPDATE, DELETE ON app.levels TO authenticated;

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_levels_select ON app.levels FOR SELECT TO authenticated USING (true);
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_levels_insert ON app.levels FOR INSERT TO authenticated WITH CHECK (true);
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_levels_update ON app.levels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_levels_delete ON app.levels FOR DELETE TO authenticated USING (true);

GRANT SELECT ON app.principles TO authenticated;
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY dev_temp_principles_select ON app.principles FOR SELECT TO authenticated USING (true);
