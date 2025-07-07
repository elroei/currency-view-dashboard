<?php
// transfer.php - Handles currency transfer between users
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
    $sender_user_id = $input['sender_user_id'] ?? null;
    $recipient_email = $input['recipient_email'] ?? null;
    $amount = $input['amount'] ?? null;
    $currency = $input['currency'] ?? null;
    $rate = $input['rate'] ?? null;
    if (!$sender_user_id || !$recipient_email || !$amount || !$currency || !$rate) {
        echo json_encode(['error' => 'Missing parameters']);
        exit();
    }
    // Look up sender email
    $stmt = $pdo->prepare('SELECT email FROM users WHERE id = ?');
    $stmt->execute([$sender_user_id]);
    $sender = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$sender) {
        echo json_encode(['error' => 'Sender not found']);
        exit();
    }
    if (strtolower($recipient_email) === strtolower($sender['email'])) {
        echo json_encode(['error' => 'Cannot transfer to self']);
        exit();
    }
    // Look up recipient
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$recipient_email]);
    $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$recipient) {
        echo json_encode(['error' => 'Recipient not found']);
        exit();
    }
    $recipient_user_id = $recipient['id'];
    // Check sender balance
    $stmt = $pdo->prepare('SELECT SUM(CASE WHEN type = "deposit" THEN amount WHEN type = "transfer_in" THEN amount WHEN type = "transfer_out" THEN -amount ELSE 0 END) as balance FROM transactions WHERE user_id = ? AND currency = ?');
    $stmt->execute([$sender_user_id, $currency]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $sender_balance = (float)($row['balance'] ?? 0);
    if ($sender_balance < $amount) {
        echo json_encode(['error' => 'Insufficient funds']);
        exit();
    }
    // Deduct from sender, add to recipient
    $pdo->beginTransaction();
    // Sender: transfer_out
    $stmt = $pdo->prepare('INSERT INTO transactions (user_id, type, amount, currency, description, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $stmt->execute([$sender_user_id, 'transfer_out', $amount, $currency, "Transfer to $recipient_email"]);
    // Recipient: transfer_in (converted amount)
    $converted = $amount * $rate;
    $stmt->execute([$recipient_user_id, 'transfer_in', $converted, $currency, "Transfer from user $sender_user_id"]);
    $pdo->commit();
    echo json_encode(['success' => true, 'converted_amount' => $converted]);
} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 