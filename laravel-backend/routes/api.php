<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PayHereController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RenewalController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\WebsiteOrderController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\SupportTicketController;

Route::get('/', function () {
    return response()->json(['message' => 'WebBuilders API is running!']);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/verify-email/{token}', [ClientController::class, 'verifyEmail']);
Route::post('/payhere/notify', [WebhookController::class, 'handleNotify']);

// Live USD→LKR exchange rate (public)
Route::get('/exchange-rate', [ExchangeRateController::class, 'index']);
Route::post('/exchange-rate/refresh', [ExchangeRateController::class, 'refresh'])->middleware('auth:sanctum');
Route::get('/packages', function () {
    return response()->json(\App\Models\Package::where('is_active', true)->get());
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/calendar', [CalendarController::class, 'events']);
    Route::get('/renewals', [RenewalController::class, 'upcoming']);

    Route::apiResource('clients', ClientController::class)->only(['index']);
    Route::apiResource('projects', ProjectController::class)->only(['index', 'show']);
    Route::apiResource('payments', PaymentController::class)->only(['index']);
    Route::apiResource('invoices', InvoiceController::class)->only(['index']);

    Route::middleware('role:admin,agent')->group(function () {
        Route::apiResource('clients', ClientController::class)->only(['store']);
        Route::get('/commissions', [CommissionController::class, 'index']);
        Route::get('/settings/defaults', [SettingController::class, 'getDefaults']);
    });

    Route::middleware('role:agent')->group(function () {
        Route::get('/agent/my-performance', [AgentController::class, 'myPerformance']);
    });

    Route::middleware('role:client')->group(function () {
        Route::get('/website-packages', [WebsiteOrderController::class, 'packages']);
        Route::post('/website-orders', [WebsiteOrderController::class, 'store']);
        Route::post('/renewals/pay', [RenewalController::class, 'renew']);
        Route::post('/payhere/init/{invoiceId}', [PayHereController::class, 'initiate']);
        Route::post('/projects/{id}/upgrade', [ProjectController::class, 'upgrade']);
        // Support Tickets
        Route::get('/support-tickets', [SupportTicketController::class, 'index']);
        Route::post('/support-tickets', [SupportTicketController::class, 'store']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('clients', ClientController::class)->only(['show', 'update', 'destroy']);
        Route::post('/clients/{id}/approve', [ClientController::class, 'approve']);
        Route::post('/clients/{id}/force-verify', [ClientController::class, 'forceVerify']);
        Route::post('/clients/{id}/change-password', [ClientController::class, 'changePassword']);

        Route::apiResource('projects', ProjectController::class)->only(['store', 'update', 'destroy']);
        Route::post('/projects/{id}/approve', [ProjectController::class, 'approveUpgrade']);
        Route::post('/projects/{id}/approve-website-order', [ProjectController::class, 'approveWebsiteOrder']);

        Route::apiResource('payments', PaymentController::class)->only(['store', 'show', 'update', 'destroy']);
        Route::apiResource('invoices', InvoiceController::class)->only(['store', 'show', 'update', 'destroy']);
        Route::apiResource('agents', AgentController::class);
        Route::get('/agents/{id}/performance', [AgentController::class, 'performance']);
        Route::post('/commissions/{id}/toggle', [AgentController::class, 'toggleCommissionStatus']);
        Route::apiResource('commissions', CommissionController::class)->except(['index']);

        Route::get('/activity-logs', [\App\Http\Controllers\ActivityLogController::class, 'index']);
        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings', [SettingController::class, 'store']);
        // Support Tickets admin management
        Route::get('/support-tickets', [SupportTicketController::class, 'index']);
        Route::put('/support-tickets/{id}', [SupportTicketController::class, 'update']);
    });
});
