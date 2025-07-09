<?php
// reset_exchange_rates.php - Fetches and stores historical rates (USD, EUR, GBP to ILS) from Bank of Israel SDMX-XML API for a given date range
// Usage: php reset_exchange_rates.php [start_date] [end_date] [currency]

require_once __DIR__ . '/config.php';

function get_boi_sdmx_url($currency, $start, $end) {
    $map = [
        'USD' => 'RER_USD_ILS',
        'EUR' => 'RER_EUR_ILS',
        'GBP' => 'RER_GBP_ILS',
    ];
    if (!isset($map[$currency])) throw new Exception("Unsupported currency: $currency");
    return "https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/{$map[$currency]}?startperiod=$start&endperiod=$end";
}

function fetch_boi_sdmx_xml($url) {
    $opts = [
        'http' => [
            'timeout' => 30,
            'user_agent' => 'CurrencyWallet/1.0'
        ]
    ];
    $context = stream_context_create($opts);
    $xml = @file_get_contents($url, false, $context);
    if ($xml === false) throw new Exception("Failed to fetch $url");
    return $xml;
}

function parse_sdmx_xml_rates($xml) {
    $result = [];
    $doc = new SimpleXMLElement($xml);
    // Find all Obs nodes
    foreach ($doc->xpath('//Obs') as $obs) {
        $date = (string)$obs['TIME_PERIOD'];
        $rate = (string)$obs['OBS_VALUE'];
        if ($date && $rate) {
            $result[] = ['date' => $date, 'rate' => $rate];
        }
    }
    return $result;
}

// Parse CLI args
global $argv;
$start = $argv[1] ?? null;
$end = $argv[2] ?? null;
$currency = $argv[3] ?? null;
if (!$start || !$end || !$currency) {
    echo "Usage: php reset_exchange_rates.php [start_date] [end_date] [currency]\n";
    echo "Example: php reset_exchange_rates.php 2023-01-01 2024-01-01 USD\n";
    exit(1);
}

try {
    $url = get_boi_sdmx_url($currency, $start, $end);
    echo "Fetching: $url\n";
    $xml = fetch_boi_sdmx_xml($url);
    $rates = parse_sdmx_xml_rates($xml);
    if (empty($rates)) {
        echo "No rates found for $currency in range $start to $end\n";
        exit(0);
    }
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $inserted = 0;
    $updated = 0;
    foreach ($rates as $row) {
        $date = $row['date'];
        $rate = $row['rate'];
        // Try insert, if duplicate update
        $stmt = $pdo->prepare('INSERT INTO historical_exchange_rates (currency, date, rate_to_ils) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rate_to_ils = VALUES(rate_to_ils)');
        $stmt->execute([$currency, $date, $rate]);
        if ($stmt->rowCount() === 1) {
            $inserted++;
        } elseif ($stmt->rowCount() === 2) {
            $updated++;
        }
    }
    echo "Inserted: $inserted, Updated: $updated\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
} 