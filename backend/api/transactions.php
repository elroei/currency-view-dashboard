<?php
// transactions.php - Returns transaction history for a user
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
    $stmt = $pdo->prepare('SELECT id, type, amount, currency, description, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$user_id]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['transactions' => $transactions]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 