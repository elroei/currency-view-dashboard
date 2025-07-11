<?php
require_once '../config.php';
header('Content-Type: application/json');

function is_valid_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function is_strong_password($password) {
    return strlen($password) >= 4;
}

function send_verification_email($to, $token) {
    $frontend_url = getenv('FRONTEND_URL') ?: 'http://localhost:3000';
    $verify_link = $frontend_url . '/verify-email?token=' . urlencode($token);
    $subject = 'Verify Your Email Address';
    $headers = "To: $to\r\n";
    $message = $headers .
        "Subject: $subject\r\n" .
        "\r\n" .
        "Welcome! Please verify your email address by clicking the link below:\n$verify_link\n\nIf you did not register, please ignore this email.";
    mail($to, '', $message);
}

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$first_name = trim($data['first_name'] ?? '');
$last_name = trim($data['last_name'] ?? '');

if (!is_valid_email($email)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email format.']);
    exit;
}
if (!is_strong_password($password)) {
    echo json_encode(['success' => false, 'error' => 'Password must be at least 4 characters.']);
    exit;
}
if (!$first_name) {
    echo json_encode(['success' => false, 'error' => 'First name is required.']);
    exit;
}
if (!$last_name) {
    echo json_encode(['success' => false, 'error' => 'Last name is required.']);
    exit;
}

try {
    $pdo = get_pdo();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Email already registered.']);
        exit;
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $token = bin2hex(random_bytes(32));
    $stmt = $pdo->prepare('INSERT INTO users (email, first_name, last_name, password, is_verified, verification_token) VALUES (?, ?, ?, ?, 0, ?)');
    $stmt->execute([$email, $first_name, $last_name, $hash, $token]);
    send_verification_email($email, $token);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Registration failed.']);
} 