<?php
require_once '../config.php';
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$token = trim($data['token'] ?? '');
$new_password = $data['new_password'] ?? '';

$response = ['success' => false, 'error' => 'Invalid request'];

if (!$token || !$new_password || strlen($new_password) < 6) {
    $response['error'] = 'Invalid token or password';
    echo json_encode($response);
    exit;
}

try {
    $pdo = get_pdo();
    // Find token, join user
    $stmt = $pdo->prepare('SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id WHERE prt.token = ?');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    if (!$row) {
        $response['error'] = 'Invalid or expired token';
        echo json_encode($response);
        exit;
    }
    if ($row['used']) {
        $response['error'] = 'Token already used';
        echo json_encode($response);
        exit;
    }
    if (strtotime($row['expires_at']) < time()) {
        $response['error'] = 'Token expired';
        echo json_encode($response);
        exit;
    }
    // Hash new password
    $hash = password_hash($new_password, PASSWORD_DEFAULT);
    // Update user password
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->execute([$hash, $row['user_id']]);
    // Mark token as used
    $stmt = $pdo->prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?');
    $stmt->execute([$row['id']]);
    $response = ['success' => true];
} catch (Exception $e) {
    $response['error'] = 'Server error';
}
echo json_encode($response); 