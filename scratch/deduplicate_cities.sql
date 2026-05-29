DELETE FROM cities a USING cities b WHERE a.id < b.id AND a.name = b.name;
