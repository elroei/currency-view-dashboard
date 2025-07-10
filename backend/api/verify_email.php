<?php
require_once '../config.php';
header('Content-Type: application/json');

// Accept token from GET or POST
$token = $_GET['token'] ?? ($_POST['token'] ?? '');
$token = trim($token);
$response = ['success' => false, 'error' => 'Invalid or expired token.'];

if (!$token) {
    echo json_encode($response);
    exit;
}

try {
    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT id, is_verified FROM users WHERE verification_token = ?');
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) {
        echo json_encode($response);
        exit;
    }
    if ($user['is_verified']) {
        echo json_encode(['success' => true, 'already_verified' => true]);
        exit;
    }
    $stmt = $pdo->prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?');
    $stmt->execute([$user['id']]);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Server error.']);
} 