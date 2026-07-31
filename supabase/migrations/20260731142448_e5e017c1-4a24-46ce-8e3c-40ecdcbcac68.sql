GRANT USAGE ON SCHEMA app TO authenticated;
GRANT SELECT ON app.platform_roles TO authenticated;
GRANT ALL ON app.platform_roles TO service_role;
ALTER TABLE app.platform_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_roles_select_own ON app.platform_roles;
CREATE POLICY platform_roles_select_own ON app.platform_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION app.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app.platform_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  );
$$;
GRANT EXECUTE ON FUNCTION app.is_platform_admin(uuid) TO authenticated, service_role;