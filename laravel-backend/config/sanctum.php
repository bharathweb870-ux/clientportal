<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1%s',
        Sanctum::currentApplicationUrlWithPort()
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the default
    | auth guard configured for your application.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. If this value is null, personal access tokens have
    | no expiration time. This won't tweak the lifetime of session cookies.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your multi-page single page application, Sanctum
    | will need to inject some middleware into your application's middleware
    | stack. This middleware will handle cookie-based authentication.
    |
    */

    'middleware' => [
        // 'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        // 'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],

];
