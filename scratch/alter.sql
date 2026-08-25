ALTER TABLE platform_config ALTER COLUMN value TYPE TEXT;
ALTER TABLE platform_config ALTER COLUMN description TYPE TEXT;
ALTER TABLE platform_config OWNER TO gymdate_user;
GRANT ALL PRIVILEGES ON TABLE platform_config TO gymdate_user;
