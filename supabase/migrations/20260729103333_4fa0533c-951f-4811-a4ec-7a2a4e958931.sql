GRANT INSERT, UPDATE, DELETE ON app.principles TO authenticated;

CREATE POLICY dev_temp_principles_insert
ON app.principles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY dev_temp_principles_update
ON app.principles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY dev_temp_principles_delete
ON app.principles
FOR DELETE
TO authenticated
USING (true);