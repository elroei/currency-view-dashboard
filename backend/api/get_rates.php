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

$currencies = ['USD', 'EUR', 'GBP'];
$rates = [];
foreach ($currencies as $currency) {
    $today = date('Y-m-d');
    $start = date('Y-m-d', strtotime('-30 days'));
    $map = [
        'USD' => 'RER_USD_ILS',
        'EUR' => 'RER_EUR_ILS',
        'GBP' => 'RER_GBP_ILS',
    ];
    $url = "https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/{$map[$currency]}?startperiod=$start&endperiod=$today";
    $opts = [
        'http' => [
            'timeout' => 30,
            'user_agent' => 'CurrencyWallet/1.0'
        ]
    ];
    $context = stream_context_create($opts);
    $xml = @file_get_contents($url, false, $context);
    if ($xml !== false) {
        $doc = @simplexml_load_string($xml);
        if ($doc !== false) {
            $latest = null;
            foreach ($doc->xpath('//Obs') as $obs) {
                $date = (string)$obs['TIME_PERIOD'];
                $rate = (string)$obs['OBS_VALUE'];
                if ($date && $rate) {
                    if (!$latest || $date > $latest['date']) {
                        $latest = ['date' => $date, 'rate' => (float)$rate];
                    }
                }
            }
            if ($latest) {
                $rates[$currency] = $latest['rate'];
            }
        }
    }
}
$rates['ILS'] = 1.0; // ILS to ILS
echo json_encode(['rates' => $rates, 'base' => 'ILS']); 