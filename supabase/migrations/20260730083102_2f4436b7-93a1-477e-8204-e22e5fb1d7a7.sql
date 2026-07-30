GRANT INSERT, UPDATE, DELETE ON app.assessment_criteria TO authenticated;

CREATE POLICY dev_temp_assessment_criteria_insert
ON app.assessment_criteria
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY dev_temp_assessment_criteria_update
ON app.assessment_criteria
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY dev_temp_assessment_criteria_delete
ON app.assessment_criteria
FOR DELETE
TO authenticated
USING (true);