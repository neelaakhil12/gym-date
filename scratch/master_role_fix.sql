-- This script ensures all required roles exist in the database to prevent foreign key errors.
DO $$
BEGIN
    -- Check if 'roles' table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roles') THEN
        INSERT INTO roles (id, name) VALUES ('operation_admin', 'Operations Admin') ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Check if 'user_roles' table exists (some systems use this name)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        INSERT INTO user_roles (id, name) VALUES ('operation_admin', 'Operations Admin') ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
