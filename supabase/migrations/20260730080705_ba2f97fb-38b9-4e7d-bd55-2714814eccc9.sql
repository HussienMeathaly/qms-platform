-- TEMPORARY DEVELOPMENT ACCESS (Task_009)

-- 1. app.requirements: write access
GRANT INSERT, UPDATE, DELETE ON app.requirements TO authenticated;

-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY "dev_temp_requirements_insert" ON app.requirements
  FOR INSERT TO authenticated WITH CHECK (true);
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY "dev_temp_requirements_update" ON app.requirements
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY "dev_temp_requirements_delete" ON app.requirements
  FOR DELETE TO authenticated USING (true);

-- 2. Read-only dependency access
GRANT SELECT ON app.assessment_criteria TO authenticated;
ALTER TABLE app.assessment_criteria ENABLE ROW LEVEL SECURITY;
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY "dev_temp_assessment_criteria_select" ON app.assessment_criteria
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON app.requirement_process_clauses TO authenticated;
ALTER TABLE app.requirement_process_clauses ENABLE ROW LEVEL SECURITY;
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY "dev_temp_requirement_process_clauses_select" ON app.requirement_process_clauses
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON app.review_comments TO authenticated;
ALTER TABLE app.review_comments ENABLE ROW LEVEL SECURITY;
-- TEMPORARY DEVELOPMENT POLICY
CREATE POLICY "dev_temp_review_comments_select" ON app.review_comments
  FOR SELECT TO authenticated USING (true);