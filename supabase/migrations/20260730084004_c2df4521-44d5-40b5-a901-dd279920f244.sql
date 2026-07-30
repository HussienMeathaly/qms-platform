GRANT SELECT ON TABLE app.assessment_responses TO authenticated;

CREATE POLICY dev_temp_assessment_responses_select
ON app.assessment_responses
FOR SELECT
TO authenticated
USING (true);