<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    /**
     * The fallback rate used when API is unavailable.
     */
    const FALLBACK_RATE = 335.0;

    /**
     * Cache key for the exchange rate.
     */
    const CACHE_KEY = 'usd_lkr_exchange_rate';

    /**
     * Cache duration in minutes (1 hour).
     */
    const CACHE_MINUTES = 60;

    /**
     * Get the current USD to LKR exchange rate.
     * Uses cache to avoid excessive API calls.
     * Falls back to the configured default rate if API fails.
     */
    public static function getUsdToLkr(): float
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_MINUTES * 60, function () {
            return self::fetchFromApi();
        });
    }

    /**
     * Force-refresh the cached exchange rate from the API.
     */
    public static function refresh(): float
    {
        Cache::forget(self::CACHE_KEY);
        return self::getUsdToLkr();
    }

    /**
     * Fetch the live rate from ExchangeRate-API.
     */
    private static function fetchFromApi(): float
    {
        $apiKey = config('services.exchange_rate.key');

        if (empty($apiKey) || $apiKey === 'your_api_key_here') {
            Log::warning('ExchangeRateService: No API key configured. Using fallback rate.');
            return (float) config('services.exchange_rate.fallback', self::FALLBACK_RATE);
        }

        try {
            $response = Http::timeout(5)->get(
                "https://v6.exchangerate-api.com/v6/{$apiKey}/pair/USD/LKR"
            );

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['result']) && $data['result'] === 'success' && isset($data['conversion_rate'])) {
                    $rate = (float) $data['conversion_rate'];
                    Log::info("ExchangeRateService: Fetched live rate USD→LKR = {$rate}");
                    return $rate;
                }
            }

            Log::warning('ExchangeRateService: API response invalid. Using fallback rate.', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
        } catch (\Exception $e) {
            Log::error('ExchangeRateService: HTTP request failed. Using fallback rate.', [
                'error' => $e->getMessage(),
            ]);
        }

        return (float) config('services.exchange_rate.fallback', self::FALLBACK_RATE);
    }
}
