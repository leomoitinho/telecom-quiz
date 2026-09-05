# Changelog

Todas as mudanças relevantes deste projeto estão documentadas aqui.

---

## [2.0.0] — 2026

### Arquitetura
- Migração completa para backend PHP + MySQL
- Todo o conteúdo do quiz movido para o banco de dados
- HTML sem nenhum conteúdo hardcoded — apenas interface
- API REST com 6 endpoints: `get_missions`, `login`, `load_progress`, `save_mission`, `finish_game`, `get_ranking`
- Configuração separada em `config.php` (fora do controle de versão)

### Banco de dados
- 10 tabelas relacionadas com chaves estrangeiras e índices
- 14 missões catalogadas
- 64 perguntas e 256 opções de resposta
- Sistema de cola por fase (mission_cola)
- Suporte a 3 tipos de missão: `pins`, `lookup`, `mcq`

### Segurança
- Inputs sanitizados com `htmlspecialchars` + PDO prepared statements
- Headers de segurança HTTP
- Credenciais fora do repositório (config.php no .gitignore)
- Conteúdo das questões nunca exposto no HTML

### Jogo
- Sistema de níveis: 👶 Junior · 💼 Pleno · 🔥 Senior
- Número de alternativas varia por nível (4 / 5 / 6)
- Cola visível apenas para Junior
- Ranking centralizado no MySQL por nível
- Fases destravadas progressivamente

---

## [1.5.0] — 2026

### Adicionado
- Fase 14: Atenuação e perda de sinal (dB, orçamento de link, OTDR)
- Fase 13: Monomodo vs Multimodo
- Fase 12: Emenda de fibra (fusão vs mecânica)
- Fase 11: Tipos de conector de fibra (SC, LC, ST, FC, APC, UPC)
- Fase 10: Código de cores de fibra óptica (TIA/EIA-598-C, 12 fibras)
- Início da trilha de fibra óptica

---

## [1.4.0] — 2026

### Adicionado
- Fase 9: Switch e rack (acesso, trunk, uplink, cascateamento, STP)
- Fase 8: Diagnóstico com testador (wiremap, open, short, split pair)
- Fase 7: Categorias de cabo (Cat5e/Cat6/Cat6a/Cat7/Cat8)
- Fase 6: PoE — Power over Ethernet (Modo A/B, padrões, PSE/PD)

---

## [1.3.0] — 2026

### Adicionado
- Fase 5: Patch panel com mecânica de lookup (painel de referência fixo)
- Cola visual durante o quiz (desafios 3 e 4)
- Suporte a múltiplos tipos de missão: `pins`, `lookup`, `mcq`
- Painel de referência fixo durante o quiz

---

## [1.2.0] — 2026

### Adicionado
- Fase 4: Cabo console/rollover Cisco (pinos espelhados)
- Fase 3: Cabo crossover (T568B → T568A, com cola da ponta A)
- Cola de referência na tela do desafio (ponta fixa visível durante o quiz)

---

## [1.1.0] — 2026

### Adicionado
- Fase 2: Cabo direto T568A
- Sistema de progressão (fases desbloqueadas em sequência)
- Estrelas por fase (3 = sem erros · 2 = até 2 · 1 = 3+)
- Pontuação: 10 pts por pergunta correta

---

## [1.0.0] — 2026

### Lançamento inicial
- Fase 1: Crimpar conector RJ45 — padrão T568B
- Interface de drag-and-drop para posicionar fios nos pinos
- Visual escuro inspirado em equipamentos de rack
- Motor de quiz com múltipla escolha e feedback por cor
- Progresso salvo localmente (localStorage)
- Ranking local (SQLite via sql.js)

---

## Autores

**Wanderley** — Especialista em telecom, idealizador e curador do conteúdo técnico  
**Claude (Anthropic)** — Co-desenvolvedor, arquitetura, código e documentação
