# 📡 Simulador de Certificação — Cabeamento Estruturado

> Jogo educativo interativo para treinamento de técnicos em cabeamento estruturado e fibra óptica.  
> Desenvolvido com HTML5, PHP e MySQL — sem frameworks, sem dependências, pronto pra hospedar em qualquer servidor LAMP/LEMP.

---

## 🎮 O que é

Um simulador de quiz progressivo com **14 fases** cobrindo toda a trilha técnica de um técnico de redes, do crimpar um RJ45 até calcular o orçamento de perda de um link de fibra óptica.

```
┌─────────────────────────────────────────────────────────────────┐
│   SIMULADOR DE CERTIFICAÇÃO — Técnico de Cabeamento             │
│   pontuação: 140                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Cabo direto T568B          ★★★  ✓                          │
│  2. Cabo direto T568A          ★★☆  ✓                          │
│  3. Cabo crossover             ★★★  ✓                          │
│  4. Console/rollover Cisco     ★★★  ✓                          │
│  5. Patch panel                ★★★  ✓                          │
│  6. PoE                        ★★☆  ✓                          │
│  7. Categorias de cabo         ★★★  ✓                          │
│  8. Diagnóstico com testador   ★★★  ✓                          │
│  9. Switch e rack              ★★★  ✓                          │
│ 10. 🔒 Fibra — código de cores                                  │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Trilha de conteúdo

### 🔌 Cobre (Fases 1–9)
| # | Fase | Mecânica |
|---|------|----------|
| 1 | Cabo direto T568B | Identificar cor por pino |
| 2 | Cabo direto T568A | Identificar cor por pino |
| 3 | Cabo crossover | Montar ponta B a partir da referência A |
| 4 | Console/rollover Cisco | Pinos espelhados |
| 5 | Patch panel | Leitura de documentação (lookup) |
| 6 | PoE | Quiz conceitual com cola |
| 7 | Categorias de cabo | Quiz conceitual com cola |
| 8 | Diagnóstico com testador | Leitura de wiremap |
| 9 | Switch e rack | Trunk, uplink, cascateamento |

### 💡 Fibra óptica (Fases 10–14)
| # | Fase | Mecânica |
|---|------|----------|
| 10 | Código de cores (TIA-598-C) | 12 fibras, 12 cores |
| 11 | Tipos de conector | SC, LC, ST, FC, APC, UPC |
| 12 | Emenda de fibra | Fusão vs mecânica |
| 13 | Monomodo vs multimodo | Escolha por cenário |
| 14 | Atenuação e perda de sinal | dB, orçamento, OTDR |

---

## 🏆 Sistema de jogo

- **3 níveis:** 👶 Junior (com dicas, 4 opções) · 💼 Pleno (sem dicas, 5 opções) · 🔥 Senior (sem dicas, 6 opções)
- **Progressão bloqueada:** cada fase destrava a próxima
- **Estrelas:** 3 estrelas = zero erros · 2 = até 2 erros · 1 = 3+ erros
- **Ranking por nível:** top 10 persistido no MySQL, visível a todos
- **Pontuação:** 10 pontos por pergunta correta (máx 140 pts por jogo)

---

## 🗂️ Estrutura do projeto

```
simulador-cabeamento/
├── index.html          # Frontend (sem conteúdo hardcoded)
├── api.php             # Backend — todos os endpoints
├── config.php          # Credenciais do banco (não versionar!)
├── config.example.php  # Modelo de configuração
├── sql/
│   ├── db-schema-v2.sql  # Cria as tabelas
│   └── db-seed-v2.sql    # Popula missões, perguntas e opções
├── .gitignore
├── LICENSE
├── CHANGELOG.md
└── README.md
```

---

## ⚙️ Instalação

### Pré-requisitos
- Servidor web com PHP 7.4+ (Apache ou Nginx)
- MySQL 5.7+ ou MariaDB 10.3+

### Passo a passo

**1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/simulador-cabeamento.git
cd simulador-cabeamento
```

**2. Cria o usuário dedicado (edite a senha antes!)**
```bash
nano sql/create-mysql-user.sql   # troque 'senha_forte_aqui'
mysql -u root -p < sql/create-mysql-user.sql
```

**3. Configure o banco de dados**
```bash
# Cria as tabelas
mysql -u root -p < sql/db-schema-v2.sql

# Popula com todas as 14 missões, 64 perguntas e 256 opções
mysql -u root -p simulador_cabeamento < sql/db-seed-v2.sql
```

**4. Configure as credenciais**
```bash
cp config.example.php config.php
nano config.php   # Edite com seus dados
```

**5. Copie os arquivos para o servidor web**
```bash
sudo cp -r . /var/www/html/simulador/
sudo chown -R www-data:www-data /var/www/html/simulador/
```

**6. Acesse no navegador**
```
http://seu-servidor/simulador/
```

---

## 🔒 Segurança

- Todo o conteúdo do quiz (perguntas, respostas, missões) fica **no banco de dados**, nunca exposto no HTML
- O `index.html` contém apenas a interface — quem inspecionar o código fonte não encontra nenhuma resposta
- O `config.php` está no `.gitignore` — credenciais nunca entram no repositório
- Inputs sanitizados com `htmlspecialchars` + PDO com prepared statements
- Headers de segurança HTTP no `api.php`

---

## 🛠️ Customização

### Adicionar uma nova pergunta
```sql
-- Insere a pergunta
INSERT INTO questions (mission_id, sort_order, question_text, context_text)
VALUES ('m6', 9, 'Qual é a potência máxima entregue por PoE++ a 30 m?', '802.3bt avançado');

-- Insere as opções (marque is_correct=1 para a correta)
INSERT INTO question_options (question_id, option_text, is_correct) VALUES
(LAST_INSERT_ID(), '90 W',  1),
(LAST_INSERT_ID(), '30 W',  0),
(LAST_INSERT_ID(), '15 W',  0),
(LAST_INSERT_ID(), '100 W', 0);
```

### Adicionar uma nova fase (missão MCQ)
```sql
INSERT INTO missions (id, sort_order, title, short_desc, intro, type)
VALUES ('m15', 15, 'VoIP — Qualidade de voz', 'QoS, jitter e codec', 'Conteúdo da intro...', 'mcq');

-- Adicione cola e perguntas conforme o padrão acima
```

### Adicionar nota à cola de uma fase
```sql
INSERT INTO mission_cola (mission_id, sort_order, note)
VALUES ('m6', 7, 'PoE passivo — não negocia potência, cuidado com equipamentos incompatíveis');
```

---

## 📊 Estrutura do banco

```
players          — Jogadores registrados
progress         — Progresso por fase (estrelas, erros)
rankings         — Ranking final (quando completa as 14 fases)
missions         — As 14 fases do jogo
mission_sides    — Lados de um cabo (ponta A / ponta B)
mission_pins     — Cores dos pinos/fibras por lado
mission_lookup   — Portas do patch panel (fase 5)
mission_cola     — Notas da cola por fase
questions        — Perguntas das fases MCQ/lookup
question_options — Opções de resposta (is_correct marca a certa)
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feat/nova-fase-voip`
3. Commit: `git commit -m 'feat: adiciona fase 15 — VoIP e QoS'`
4. Push: `git push origin feat/nova-fase-voip`
5. Abra um Pull Request

---

## 👨‍💻 Autores

Desenvolvido com dedicação por:

**Leonardo Moitinho** — Especialista em telecom, idealizador do projeto  
**Claude (Anthropic)** — Co-desenvolvedor, arquitetura e implementação

---

## 📄 Licença

MIT License — veja [LICENSE](LICENSE) para detalhes.

Livre pra usar, modificar e distribuir. Se usar em treinamentos, um crédito é sempre bem-vindo. 🙏

---

> *"Não adianta saber a teoria se não sabe o pino certo."*
