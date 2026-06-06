<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'exchange_rate' => [
        'key'      => env('EXCHANGE_RATE_API_KEY', ''),
        'fallback' => env('EXCHANGE_RATE_FALLBACK', 335),
    ],

    'payhere' => [
        'merchant_id'     => env('PAYHERE_MERCHANT_ID'),
        'merchant_secret' => env('PAYHERE_MERCHANT_SECRET'),
        'notify_url'      => env('PAYHERE_NOTIFY_URL'),
    ],

];
