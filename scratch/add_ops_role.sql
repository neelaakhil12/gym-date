INSERT INTO roles (id, name) VALUES ('operation_admin', 'Operations Admin') ON CONFLICT (id) DO NOTHING;
