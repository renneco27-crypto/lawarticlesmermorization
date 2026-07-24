CREATE TABLE IF NOT EXISTS lex_admin (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash text NOT NULL,
  salt text NOT NULL
);

INSERT INTO lex_admin (id, password_hash, salt) VALUES
  (1, '40e8372d1f6d752f25914463d04fc1a3f95adfbb2bf82c3eaae7b2842cf3c8dfaf01303a71de82b52b670d20288a45ee3e3bdbcecb2377f35a749aaaeb44217c', 'd6e7d06e24f90c64ca8acdcb164183df')
ON CONFLICT (id) DO NOTHING;
