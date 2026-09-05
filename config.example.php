<?php
// ============================================================
// config.example.php
// Copie para config.php e preencha com seus dados:
//   cp config.example.php config.php
//
// IMPORTANTE: config.php está no .gitignore
// Nunca faça commit das suas credenciais reais!
// ============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'simulador_cabeamento');
define('DB_USER', 'flutelecom');          // Usuário dedicado — NÃO use root
define('DB_PASS', 'senha_forte_aqui');    // Troque por uma senha real e forte
define('DB_PORT', '3306');

// Restrição de origem (CORS)
// Troque pelo seu domínio em produção:
// define('ALLOWED_ORIGIN', 'https://seu-dominio.com.br');
define('ALLOWED_ORIGIN', '*');
