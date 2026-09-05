-- ============================================================
-- Simulador de Cabeamento — Schema v2
-- Perguntas e missões no banco de dados
-- ============================================================

CREATE DATABASE IF NOT EXISTS simulador_cabeamento CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE simulador_cabeamento;

-- Jogadores
CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  level ENUM('junior','pleno','senior') NOT NULL DEFAULT 'junior',
  score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX(level), INDEX(score)
);

-- Progresso por fase
CREATE TABLE IF NOT EXISTS progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  mission_id VARCHAR(10) NOT NULL,
  stars TINYINT DEFAULT 0,
  mistakes SMALLINT DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE KEY uq_player_mission (player_id, mission_id),
  INDEX(player_id)
);

-- Rankings (quando completa todas as fases)
CREATE TABLE IF NOT EXISTS rankings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  level ENUM('junior','pleno','senior') NOT NULL,
  score INT NOT NULL,
  all_stars JSON,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  INDEX(level), INDEX(score)
);

-- Missões (fases do jogo)
CREATE TABLE IF NOT EXISTS missions (
  id VARCHAR(10) PRIMARY KEY,         -- m1, m2, ... m14
  sort_order TINYINT NOT NULL,        -- ordem de exibição
  title VARCHAR(200) NOT NULL,
  short_desc VARCHAR(300),
  intro TEXT,
  type ENUM('pins','lookup','mcq') NOT NULL DEFAULT 'pins',
  position_prefix CHAR(2) DEFAULT 'P', -- P para pino, F para fibra
  pin_question_text VARCHAR(200) DEFAULT 'Qual fio vai no pino {n}?',
  active BOOLEAN DEFAULT 1,
  INDEX(sort_order)
);

-- Cola de referência de pinos (usada em missions do tipo pins)
-- Cada linha é um pino/fibra numa "side" da missão
CREATE TABLE IF NOT EXISTS mission_sides (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id VARCHAR(10) NOT NULL,
  side_order TINYINT NOT NULL,         -- 0 = ponta A, 1 = ponta B
  label VARCHAR(200) NOT NULL,
  is_quiz BOOLEAN DEFAULT 1,           -- 0 = só referência, 1 = o jogador responde
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  INDEX(mission_id)
);

-- Pinos de cada side (cores dos fios/fibras)
CREATE TABLE IF NOT EXISTS mission_pins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  side_id INT NOT NULL,
  pin_order TINYINT NOT NULL,
  name VARCHAR(100) NOT NULL,          -- ex: "Branco/Laranja"
  type ENUM('solid','striped') DEFAULT 'solid',
  color_a VARCHAR(10) NOT NULL,        -- hex primário
  color_b VARCHAR(10),                 -- hex secundário (só striped)
  FOREIGN KEY (side_id) REFERENCES mission_sides(id) ON DELETE CASCADE,
  INDEX(side_id)
);

-- Portas do patch panel (missões tipo lookup)
CREATE TABLE IF NOT EXISTS mission_lookup (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id VARCHAR(10) NOT NULL,
  port_number TINYINT NOT NULL,
  room_name VARCHAR(200) NOT NULL,
  cable_id VARCHAR(50) NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  INDEX(mission_id)
);

-- Notas da cola (missões tipo mcq)
CREATE TABLE IF NOT EXISTS mission_cola (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id VARCHAR(10) NOT NULL,
  sort_order TINYINT NOT NULL,
  note TEXT NOT NULL,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  INDEX(mission_id)
);

-- Perguntas (missões tipo mcq e lookup)
CREATE TABLE IF NOT EXISTS questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_id VARCHAR(10) NOT NULL,
  sort_order TINYINT NOT NULL,
  question_text TEXT NOT NULL,
  context_text VARCHAR(300),
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  INDEX(mission_id)
);

-- Opções de resposta
CREATE TABLE IF NOT EXISTS question_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question_id INT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX(question_id)
);
