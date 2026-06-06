<?php

return [
    'merchant_id' => env('PAYHERE_MERCHANT_ID'),
    'merchant_secret' => env('PAYHERE_MERCHANT_SECRET'),
    'mode' => env('PAYHERE_MODE', 'sandbox'),
    'notify_url' => env('PAYHERE_NOTIFY_URL'),
];
