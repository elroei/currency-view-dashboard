<?php
// balance.php - Returns current balance per currency for a user
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $input = $_SERVER['REQUEST_METHOD'] === 'POST' ? json_decode(file_get_contents('php://input'), true) : $_GET;
    $user_id = $input['user_id'] ?? null;
    if (!$user_id) {
        echo json_encode(['error' => 'Missing user_id']);
        exit();
    }
    // Validate user exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['error' => 'User not found']);
        exit();
    }
    // Will include ILS in balances if user has ILS transactions
    $stmt = $pdo->prepare('SELECT currency, SUM(CASE WHEN type = "deposit" THEN amount WHEN type = "transfer_in" THEN amount WHEN type = "transfer_out" THEN -amount ELSE 0 END) as balance FROM transactions WHERE user_id = ? GROUP BY currency');
    $stmt->execute([$user_id]);
    $balances = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $balances[$row['currency']] = (float)$row['balance'];
    }
    echo json_encode(['balances' => $balances]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 