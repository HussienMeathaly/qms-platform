GRANT SELECT, INSERT, UPDATE, DELETE ON app.process_clauses TO authenticated;

CREATE POLICY dev_temp_process_clauses_select ON app.process_clauses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY dev_temp_process_clauses_insert ON app.process_clauses
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY dev_temp_process_clauses_update ON app.process_clauses
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY dev_temp_process_clauses_delete ON app.process_clauses
  FOR DELETE TO authenticated USING (true);