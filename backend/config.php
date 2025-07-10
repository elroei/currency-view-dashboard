<?php
// config.php - Database and app configuration
// Load from environment variables or .env file

env_load();

define('DB_DSN', 'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4');
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));
define('DEFAULT_DISPLAY_CURRENCY', getenv('DEFAULT_DISPLAY_CURRENCY') ?: 'USD');

// Simple .env loader for local dev
function env_load($file = __DIR__ . '/.env') {
    if (!file_exists($file)) return;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = array_map('trim', explode('=', $line, 2));
        if (!getenv($name)) putenv("$name=$value");
    }
}

// Provide a shared PDO connection
function get_pdo() {
    static $pdo;
    if (!$pdo) {
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
} 