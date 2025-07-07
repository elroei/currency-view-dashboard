<?php
// get_rates.php - Returns latest exchange rates (mocked)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Mocked rates for now
$rates = [
    'USD' => 1.0,
    'EUR' => 0.92,
    'GBP' => 0.78,
    'JPY' => 155.0
];
echo json_encode(['rates' => $rates, 'base' => 'USD']); 