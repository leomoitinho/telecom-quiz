-- ============================================================
-- Cria usuário dedicado pro simulador (mais seguro que root)
-- Execute como root no MySQL:
--   mysql -u root -p < create-mysql-user.sql
-- ============================================================

-- Troque 'senha_forte_aqui' por uma senha real antes de executar!
CREATE USER IF NOT EXISTS 'flutelecom'@'localhost' IDENTIFIED BY 'senha_forte_aqui';

-- Concede apenas o necessário no banco do simulador (sem acesso a outros bancos)
GRANT SELECT, INSERT, UPDATE, DELETE ON simulador_cabeamento.* TO 'flutelecom'@'localhost';

-- Aplica imediatamente
FLUSH PRIVILEGES;

-- Confirma
SELECT user, host FROM mysql.user WHERE user = 'flutelecom';
SHOW GRANTS FOR 'flutelecom'@'localhost';
