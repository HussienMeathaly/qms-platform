GRANT SELECT ON TABLE app.requirements TO authenticated;

CREATE POLICY dev_temp_requirements_select
ON app.requirements
FOR SELECT
TO authenticated
USING (true);