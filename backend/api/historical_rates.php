<?php
// historical_rates.php - Returns historical exchange rates for a currency and date range
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

$currency = $_GET['currency'] ?? null;
$start_date = $_GET['start_date'] ?? null;
$end_date = $_GET['end_date'] ?? null;

if (!$currency || !$start_date || !$end_date) {
    echo json_encode(['error' => 'Missing currency, start_date, or end_date']);
    exit();
}

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->prepare('SELECT date, rate_to_ils FROM historical_exchange_rates WHERE currency = ? AND date BETWEEN ? AND ? ORDER BY date ASC');
    $stmt->execute([$currency, $start_date, $end_date]);
    $rates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['currency' => $currency, 'rates' => $rates]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 