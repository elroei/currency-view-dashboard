<?php
// proxy_boi.php - Proxy for Bank of Israel historical exchange rates (CORS-safe)
// Usage: /api/proxy_boi.php?currency=USD&start_date=2023-01-01&end_date=2023-12-31

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$currency = $_GET['currency'] ?? null;
$start = $_GET['start_date'] ?? null;
$end = $_GET['end_date'] ?? null;

$map = [
    'USD' => 'RER_USD_ILS',
    'EUR' => 'RER_EUR_ILS',
    'GBP' => 'RER_GBP_ILS',
];

if (!$currency || !$start || !$end || !isset($map[$currency])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid parameters']);
    exit;
}

$url = "https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/{$map[$currency]}?startperiod=$start&endperiod=$end";

$opts = [
    'http' => [
        'timeout' => 30,
        'user_agent' => 'CurrencyWallet/1.0'
    ]
];
$context = stream_context_create($opts);
$xml = @file_get_contents($url, false, $context);
if ($xml === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch from Bank of Israel API']);
    exit;
}

// Parse XML
$doc = @simplexml_load_string($xml);
if ($doc === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse XML']);
    exit;
}

$rates = [];
foreach ($doc->xpath('//Obs') as $obs) {
    $date = (string)$obs['TIME_PERIOD'];
    $rate = (string)$obs['OBS_VALUE'];
    if ($date && $rate) {
        $rates[] = ['date' => $date, 'rate' => (float)$rate];
    }
}
echo json_encode($rates); 