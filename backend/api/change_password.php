<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$current = isset($data['current_password']) ? $data['current_password'] : '';
$new = isset($data['new_password']) ? $data['new_password'] : '';

if (!$current || !$new) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

// Password requirements: min 6 chars, at least one letter and one digit
if (strlen($new) < 6 || !preg_match('/[A-Za-z]/', $new) || !preg_match('/\d/', $new)) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters and include a letter and a digit']);
    exit;
}

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare('SELECT password FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($current, $user['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }
    $newHash = password_hash($new, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->execute([$newHash, $_SESSION['user_id']]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
} 