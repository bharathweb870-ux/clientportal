<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // $middleware->statefulApi();
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'payhere/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->booting(function ($app) {
        // Register all core services manually
        $providers = [
            \Illuminate\Cookie\CookieServiceProvider::class,
            \Illuminate\Session\SessionServiceProvider::class,
            \Illuminate\Encryption\EncryptionServiceProvider::class,
            \Illuminate\Validation\ValidationServiceProvider::class,
            \Illuminate\Hashing\HashServiceProvider::class,
            \Illuminate\Translation\TranslationServiceProvider::class,
            \Illuminate\View\ViewServiceProvider::class,
            \Illuminate\Filesystem\FilesystemServiceProvider::class,
            \Illuminate\Queue\QueueServiceProvider::class,
            \Illuminate\Notifications\NotificationServiceProvider::class,
            \App\Providers\Filament\AdminPanelProvider::class, // THE MISSING PIECE
        ];

        foreach ($providers as $provider) {
            if (class_exists($provider) && !$app->getProvider($provider)) {
                $app->register($provider);
            }
        }

        $app->singleton(
            \Illuminate\Contracts\Foundation\MaintenanceMode::class,
            \Illuminate\Foundation\FileBasedMaintenanceMode::class
        );
    })->create();
