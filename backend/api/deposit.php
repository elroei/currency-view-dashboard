<?php
// deposit.php - Handles deposit requests for a specific user
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $input = json_decode(file_get_contents('php://input'), true);
    $user_id = $input['user_id'] ?? null;
    $amount = $input['amount'] ?? null;
    $currency = $input['currency'] ?? null;
    if (!$user_id || !$amount || !$currency) {
        echo json_encode(['error' => 'Missing user_id, amount, or currency']);
        exit();
    }
    // Validate user exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['error' => 'User not found']);
        exit();
    }
    // Insert deposit transaction
    $stmt = $pdo->prepare('INSERT INTO transactions (user_id, type, amount, currency, description, created_at) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())');
    $stmt->execute([$user_id, 'deposit', $amount, $currency, 'Deposit']);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 