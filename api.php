<?php
// ============================================================
// api.php v2 — Simulador de Cabeamento
// Toda a lógica de conteúdo fica aqui, protegida no servidor
// ============================================================

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Carrega configuração (credenciais fora do código)
if (!file_exists(__DIR__ . '/config.php')) {
    http_response_code(500);
    die(json_encode(['error' => 'Arquivo config.php não encontrado. Copie config.example.php para config.php e configure suas credenciais.']));
}
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: ' . (defined('ALLOWED_ORIGIN') ? ALLOWED_ORIGIN : '*'));

// Conexão
try {
    $db = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Erro de conexão com o banco']));
}

function s($v) { return htmlspecialchars(trim((string)$v), ENT_QUOTES, 'UTF-8'); }
function ok($data=[]) { echo json_encode(array_merge(['success'=>true], $data)); exit; }
function fail($msg, $code=400) { http_response_code($code); echo json_encode(['error'=>$msg]); exit; }

$action = s($_REQUEST['action'] ?? '');

// ============================================================
// GET: carregar missões (estrutura completa para o frontend)
// ============================================================
if ($action === 'get_missions') {
    // Missões básicas
    $missions = $db->query("SELECT id,sort_order,title,short_desc,intro,type,position_prefix,pin_question_text FROM missions WHERE active=1 ORDER BY sort_order")->fetchAll();

    foreach ($missions as &$m) {
        $mid = $m['id'];

        if ($m['type'] === 'pins') {
            // Carrega sides e pins
            $sides = $db->prepare("SELECT id,side_order,label,is_quiz FROM mission_sides WHERE mission_id=? ORDER BY side_order");
            $sides->execute([$mid]);
            $m['sides'] = [];
            foreach ($sides->fetchAll() as $side) {
                $pins = $db->prepare("SELECT pin_order,name,type,color_a,color_b FROM mission_pins WHERE side_id=? ORDER BY pin_order");
                $pins->execute([$side['id']]);
                $pinsData = array_map(function($p) {
                    return ['name'=>$p['name'], 'type'=>$p['type'], 'a'=>$p['color_a'], 'b'=>$p['color_b']];
                }, $pins->fetchAll());
                $m['sides'][] = ['label'=>$side['label'], 'quiz'=>(bool)$side['is_quiz'], 'pins'=>$pinsData];
            }

        } elseif ($m['type'] === 'lookup') {
            $ports = $db->prepare("SELECT port_number,room_name,cable_id FROM mission_lookup WHERE mission_id=? ORDER BY port_number");
            $ports->execute([$mid]);
            $m['refData'] = array_map(fn($r)=>['port'=>$r['port_number'],'room'=>$r['room_name'],'cableId'=>$r['cable_id']], $ports->fetchAll());

        } elseif ($m['type'] === 'mcq') {
            // Cola
            $cola = $db->prepare("SELECT note FROM mission_cola WHERE mission_id=? ORDER BY sort_order");
            $cola->execute([$mid]);
            $m['colaNotes'] = array_column($cola->fetchAll(), 'note');

            // Perguntas com opções
            $qs = $db->prepare("SELECT id,question_text,context_text FROM questions WHERE mission_id=? ORDER BY sort_order");
            $qs->execute([$mid]);
            $m['questions'] = [];
            foreach ($qs->fetchAll() as $q) {
                $opts = $db->prepare("SELECT option_text,is_correct FROM question_options WHERE question_id=?");
                $opts->execute([$q['id']]);
                $allOpts = $opts->fetchAll();
                $correctOpt = array_values(array_filter($allOpts, fn($o)=>$o['is_correct']))[0]['option_text'] ?? '';
                $m['questions'][] = [
                    'ask'     => $q['question_text'],
                    'context' => $q['context_text'],
                    'correct' => $correctOpt,
                    'options' => array_column($allOpts, 'option_text')
                ];
            }
        }

        // Limpa campos internos
        unset($m['sort_order']);
        $m['short'] = $m['short_desc'];
        unset($m['short_desc']);
        $m['positionPrefix'] = $m['position_prefix'];
        unset($m['position_prefix']);
        $m['pinQuestionText'] = $m['pin_question_text'];
        unset($m['pin_question_text']);
    }
    ok(['missions' => $missions]);
}

// ============================================================
// POST: login / criar jogador
// ============================================================
elseif ($action === 'login') {
    $username = s($_POST['username'] ?? '');
    $level    = s($_POST['level'] ?? 'junior');
    if (strlen($username) < 2) fail('Nome muito curto');
    if (!in_array($level, ['junior','pleno','senior'])) fail('Nível inválido');
    $db->prepare('INSERT IGNORE INTO players (username,level) VALUES (?,?)')->execute([$username,$level]);
    $player = $db->prepare('SELECT id,username,level,score FROM players WHERE username=?');
    $player->execute([$username]);
    ok(['player' => $player->fetch()]);
}

// ============================================================
// POST: carregar progresso
// ============================================================
elseif ($action === 'load_progress') {
    $pid = (int)($_POST['player_id'] ?? 0);
    if ($pid <= 0) fail('ID inválido');
    $rows = $db->prepare('SELECT mission_id,stars,mistakes,completed FROM progress WHERE player_id=?');
    $rows->execute([$pid]);
    $progress = [];
    foreach ($rows->fetchAll() as $r) {
        $progress[$r['mission_id']] = ['stars'=>(int)$r['stars'],'mistakes'=>(int)$r['mistakes'],'completed'=>(bool)$r['completed']];
    }
    ok(['progress' => $progress]);
}

// ============================================================
// POST: salvar fase concluída
// ============================================================
elseif ($action === 'save_mission') {
    $pid     = (int)($_POST['player_id'] ?? 0);
    $mid     = s($_POST['mission_id'] ?? '');
    $stars   = min(3, max(0, (int)($_POST['stars'] ?? 0)));
    $mistakes= max(0, (int)($_POST['mistakes'] ?? 0));
    if ($pid <= 0 || empty($mid)) fail('Dados inválidos');
    $db->prepare('INSERT INTO progress (player_id,mission_id,stars,mistakes,completed) VALUES (?,?,?,?,1)
        ON DUPLICATE KEY UPDATE stars=GREATEST(stars,VALUES(stars)),mistakes=VALUES(mistakes),completed=1,updated_at=NOW()')
       ->execute([$pid,$mid,$stars,$mistakes]);
    ok();
}

// ============================================================
// POST: finalizar jogo (grava no ranking)
// ============================================================
elseif ($action === 'finish_game') {
    $pid      = (int)($_POST['player_id'] ?? 0);
    $score    = max(0, (int)($_POST['score'] ?? 0));
    $allStars = $_POST['all_stars'] ?? '[]';
    if ($pid <= 0) fail('Dados inválidos');
    $player = $db->prepare('SELECT username,level FROM players WHERE id=?');
    $player->execute([$pid]);
    $p = $player->fetch();
    if (!$p) fail('Jogador não encontrado', 404);
    $db->prepare('UPDATE players SET score=? WHERE id=?')->execute([$score,$pid]);
    $db->prepare('INSERT INTO rankings (player_id,username,level,score,all_stars) VALUES (?,?,?,?,?)')
       ->execute([$pid,$p['username'],$p['level'],$score,$allStars]);
    ok(['ranking_id' => $db->lastInsertId()]);
}

// ============================================================
// GET: ranking
// ============================================================
elseif ($action === 'get_ranking') {
    $level = s($_GET['level'] ?? '');
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 10)));
    if (!empty($level) && !in_array($level,['junior','pleno','senior'])) fail('Nível inválido');
    if (empty($level)) {
        $st = $db->prepare('SELECT username,level,score,all_stars FROM rankings ORDER BY score DESC LIMIT ?');
        $st->execute([$limit]);
    } else {
        $st = $db->prepare('SELECT username,level,score,all_stars FROM rankings WHERE level=? ORDER BY score DESC LIMIT ?');
        $st->execute([$level,$limit]);
    }
    $rows = $st->fetchAll();
    foreach ($rows as &$r) {
        $r['all_stars'] = json_decode($r['all_stars'] ?? '[]', true) ?? [];
        $r['total_stars'] = array_sum($r['all_stars']);
    }
    ok(['rankings' => $rows]);
}

// ============================================================
// Ação desconhecida
// ============================================================
else {
    fail("Ação desconhecida: $action");
}
?>
