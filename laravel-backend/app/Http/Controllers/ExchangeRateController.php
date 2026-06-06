<?php

namespace App\Http\Controllers;

use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    /**
     * Get the current USD to LKR exchange rate.
     * Public endpoint — no auth required.
     */
    public function index(): JsonResponse
    {
        $rate = ExchangeRateService::getUsdToLkr();

        return response()->json([
            'base'       => 'USD',
            'target'     => 'LKR',
            'rate'       => $rate,
            'source'     => 'exchangerate-api.com',
            'cached'     => true,
        ]);
    }

    /**
     * Force refresh the cached rate (Admin only).
     */
    public function refresh(): JsonResponse
    {
        $rate = ExchangeRateService::refresh();

        return response()->json([
            'base'       => 'USD',
            'target'     => 'LKR',
            'rate'       => $rate,
            'source'     => 'exchangerate-api.com',
            'cached'     => false,
            'message'    => 'Exchange rate refreshed successfully.',
        ]);
    }
}
