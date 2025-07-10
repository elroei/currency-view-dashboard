<?php
require_once '../config.php';
header('Content-Type: application/json');

function send_reset_email($to, $token) {
    $frontend_url = getenv('FRONTEND_URL') ?: 'http://localhost:3000';
    $reset_link = $frontend_url . '/reset-password?token=' . urlencode($token);
    $subject = 'Password Reset Request';
    $headers = "To: $to\r\n";
    $message = $headers .
        "Subject: $subject\r\n" .
        "\r\n" .
        "Click the following link to reset your password: $reset_link\nIf you did not request this, ignore this email.";
    mail($to, '', $message);
}

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

// Always return success for privacy
$response = ['success' => true];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode($response);
    exit;
}

try {
    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if ($user) {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour
        $stmt = $pdo->prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$user['id'], $token, $expires]);
        send_reset_email($email, $token);
    }
    // If user does not exist, do nothing (no email sent)
} catch (Exception $e) {
    // Do nothing, always return success
}
echo json_encode($response); 