<?php
// convert.php - Handles currency conversion within a user's wallet
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

try {
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $input = json_decode(file_get_contents('php://input'), true);
    $user_id = $_SESSION['user_id'];
    $source_currency = $input['source_currency'] ?? null;
    $target_currency = $input['target_currency'] ?? null;
    $amount = $input['amount'] ?? null;
    if (!$source_currency || !$target_currency || !$amount) {
        echo json_encode(['error' => 'Missing parameters']);
        exit();
    }
    if ($source_currency === $target_currency) {
        echo json_encode(['error' => 'Source and target currencies must differ']);
        exit();
    }
    // Check source balance
    $stmt = $pdo->prepare('SELECT SUM(CASE WHEN type = "deposit" THEN amount WHEN type = "transfer_in" THEN amount WHEN type = "transfer_out" THEN -amount WHEN type = "conversion_in" THEN amount WHEN type = "conversion_out" THEN -amount ELSE 0 END) as balance FROM transactions WHERE user_id = ? AND currency = ?');
    $stmt->execute([$user_id, $source_currency]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $source_balance = (float)($row['balance'] ?? 0);
    if ($source_balance < $amount) {
        echo json_encode(['error' => 'Insufficient funds']);
        exit();
    }
    // Fetch latest available rate from Bank of Israel API (like proxy_boi.php)
    $supported = ['USD', 'EUR', 'GBP', 'ILS'];
    $boi_map = [
        'USD' => 'RER_USD_ILS',
        'EUR' => 'RER_EUR_ILS',
        'GBP' => 'RER_GBP_ILS',
    ];
    if (!in_array($source_currency, $supported) || !in_array($target_currency, $supported)) {
        echo json_encode(['error' => 'Unsupported currency']);
        exit();
    }
    function fetch_recent_boi_rate($currency) {
        if ($currency === 'ILS') return ['rate' => 1.0, 'date' => date('Y-m-d')];
        $map = [
            'USD' => 'RER_USD_ILS',
            'EUR' => 'RER_EUR_ILS',
            'GBP' => 'RER_GBP_ILS',
        ];
        if (!isset($map[$currency])) throw new Exception('Unsupported currency for BOI');
        $today = date('Y-m-d');
        $start = date('Y-m-d', strtotime('-4 days', strtotime($today)));
        $url = "https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/{$map[$currency]}?startperiod=$start&endperiod=$today";
        $opts = [
            'http' => [
                'timeout' => 30,
                'user_agent' => 'CurrencyWallet/1.0'
            ]
        ];
        $context = stream_context_create($opts);
        $xml = @file_get_contents($url, false, $context);
        if ($xml === false) throw new Exception('Failed to fetch from Bank of Israel API');
        $doc = @simplexml_load_string($xml);
        if ($doc === false) throw new Exception('Failed to parse XML');
        $rates = [];
        foreach ($doc->xpath('//Obs') as $obs) {
            $date = (string)$obs['TIME_PERIOD'];
            $rate = (string)$obs['OBS_VALUE'];
            if ($date && $rate) {
                $rates[$date] = (float)$rate;
            }
        }
        // Loop from today backwards up to 5 days
        for ($i = 0; $i < 5; $i++) {
            $check_date = date('Y-m-d', strtotime("-$i days", strtotime($today)));
            if (isset($rates[$check_date])) {
                return ['rate' => $rates[$check_date], 'date' => $check_date];
            }
        }
        throw new Exception('No exchange rate available for the last 5 days');
    }
    $rate = null;
    $rate_date = null;
    if ($source_currency === 'ILS') {
        $target = fetch_recent_boi_rate($target_currency);
        $rate = 1.0 / $target['rate'];
        $rate_date = $target['date'];
    } elseif ($target_currency === 'ILS') {
        $source = fetch_recent_boi_rate($source_currency);
        $rate = $source['rate'];
        $rate_date = $source['date'];
    } else {
        $source = fetch_recent_boi_rate($source_currency);
        $target = fetch_recent_boi_rate($target_currency);
        $rate = $source['rate'] / $target['rate'];
        $rate_date = $source['date']; // Both should be the same
    }
    if (!$rate || $rate <= 0) {
        echo json_encode(['error' => 'Invalid or missing exchange rate for the last 5 days']);
        exit();
    }
    $converted_amount = round($amount * $rate, 2);
    // Log as two transactions: conversion_out (source), conversion_in (target)
    $pdo->beginTransaction();
    $desc_out = "Converted $amount $source_currency to $converted_amount $target_currency";
    $desc_in = "Converted from $amount $source_currency to $converted_amount $target_currency";
    $stmt = $pdo->prepare('INSERT INTO transactions (user_id, type, amount, currency, description, created_at) VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())');
    $stmt->execute([$user_id, 'conversion_out', $amount, $source_currency, $desc_out]);
    $stmt->execute([$user_id, 'conversion_in', $converted_amount, $target_currency, $desc_in]);
    $pdo->commit();
    echo json_encode([
        'success' => true,
        'source_currency' => $source_currency,
        'target_currency' => $target_currency,
        'amount' => $amount,
        'converted_amount' => $converted_amount,
        'rate' => $rate,
        'rate_date' => $rate_date,
        'summary' => "You are converting $amount $source_currency to $converted_amount $target_currency using the exchange rate from $rate_date: 1 $source_currency = $rate $target_currency"
    ]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} 