<?php
require_once '../config.php';
header('Content-Type: application/json');

function send_verification_email($to, $token) {
    $frontend_url = getenv('FRONTEND_URL') ?: 'http://localhost:3000';
    $verify_link = $frontend_url . '/verify-email?token=' . urlencode($token);
    $subject = 'Verify Your Email Address';
    $headers = "To: $to\r\n";
    $message = $headers .
        "Subject: $subject\r\n" .
        "\r\n" .
        "Please verify your email address by clicking the link below:\n$verify_link\n\nIf you did not register, please ignore this email.";
    mail($to, '', $message);
}

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email.']);
    exit;
}

try {
    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT id, is_verified, verification_token FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        echo json_encode(['success' => true]); // Privacy: don't reveal if user exists
        exit;
    }
    if ($user['is_verified']) {
        echo json_encode(['success' => true]); // Already verified
        exit;
    }
    $token = $user['verification_token'] ?: bin2hex(random_bytes(32));
    if (!$user['verification_token']) {
        $stmt = $pdo->prepare('UPDATE users SET verification_token = ? WHERE id = ?');
        $stmt->execute([$token, $user['id']]);
    }
    send_verification_email($email, $token);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Could not resend verification email.']);
} 