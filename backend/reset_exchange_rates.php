<?php
// reset_exchange_rates.php - Fetches and displays historical rates (USD, EUR, GBP to ILS) from CurrencyAPI.com for the last 3 days (excluding today)
// Usage: php reset_exchange_rates.php

$api_key = 'cur_live_pCAX9IrupD1vP0VNtjnnpnbx36yKyFH8KjyIkDBC';

// Function to fetch rate with retry logic
function fetchRate($url, $maxRetries = 3) {
    for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
        $context = stream_context_create([
            'http' => [
                'timeout' => 30,
                'user_agent' => 'CurrencyWallet/1.0'
            ]
        ]);
        
        $json = @file_get_contents($url, false, $context);
        
        if ($json === false) {
            $error = error_get_last();
            if (strpos($error['message'], '429') !== false) {
                echo "Rate limit hit, waiting 2 seconds before retry $attempt/$maxRetries...\n";
                sleep(2);
                continue;
            }
            throw new Exception("Failed to fetch data: " . $error['message']);
        }
        
        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response: " . json_last_error_msg());
        }
        
        return $data;
    }
    
    throw new Exception("Failed after $maxRetries attempts due to rate limiting");
}

try {
    // Date range: last 3 full days, excluding today
    $end = (new DateTime('yesterday'))->setTime(0, 0, 0);
    $start = (clone $end)->modify('-2 days'); // Only 3 days
    $currencies = ['USD', 'EUR', 'GBP'];
    $to_currency = 'ILS';
    
    $apiRequests = 0;
    $date = clone $start;
    while ($date <= $end) {
        $date_str = $date->format('Y-m-d');
        foreach ($currencies as $base) {
            try {
                $url = "https://api.currencyapi.com/v3/historical?apikey=$api_key&date=$date_str&base_currency=$base&currencies=$to_currency";
                $data = fetchRate($url);
                $rate = $data['data'][$to_currency]['value'] ?? null;
                
                if ($rate) {
                    echo "Fetched rate for $base $date_str: $rate\n";
                    $apiRequests++;
                } else {
                    echo "No rate data for $base $date_str\n";
                }
                
                // Add delay between API requests to avoid rate limiting
                usleep(200000); // 0.2 second delay
                
            } catch (Exception $e) {
                echo "Error fetching $base $date_str: " . $e->getMessage() . "\n";
                // Continue with next currency/date instead of failing completely
            }
        }
        $date->modify('+1 day');
    }
    
    echo "\n=== Summary ===\n";
    echo "API requests made: $apiRequests\n";
    echo "Exchange rates fetched for last 3 days.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
} 