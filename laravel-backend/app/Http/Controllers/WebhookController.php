<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\WebhookLog;
use App\Models\Invoice;
use App\Models\Transaction;
use App\Services\PayHereService;
use App\Services\CommissionService;

class WebhookController extends Controller
{
    protected $payHereService;

    public function __construct(PayHereService $payHereService)
    {
        $this->payHereService = $payHereService;
    }

    public function handleNotify(Request $request)
    {
        Log::info('PayHere Webhook', $request->all());
        
        // Store payload as JSON
        WebhookLog::create([
            'payload' => $request->all(), 
            'source' => 'payhere'
        ]);

        if (!$this->payHereService->verifyCallback($request)) {
            Log::warning('PayHere: Invalid hash received', $request->all());
            return response('Invalid hash', 400);
        }

        $invoice = Invoice::with(['client'])->find($request->input('order_id'));
        if (!$invoice) {
            Log::error("PayHere Webhook: Invoice #{$request->input('order_id')} not found");
            return response('Invoice not found', 404);
        }

        if ($request->input('status_code') == 2) {
            // ✅ PAYMENT SUCCESS
            $invoice->update(['status' => 'paid', 'paid_at' => now()]);

            Transaction::create([
                'invoice_id'       => $invoice->id,
                'txn_id'           => $request->input('payment_id'),
                'amount'           => $request->input('payhere_amount'),
                'currency'         => $request->input('payhere_currency'),
                'method'           => $request->input('method'),
                'status'           => 'paid',
                'gateway_response' => $request->all(),
            ]);

            // Auto-activate service after payment
            $this->activateServiceAfterPayment($invoice);

            // Calculate commission
            CommissionService::calculate($invoice);

            Log::info("PayHere: Payment success for Invoice #{$invoice->id}");

        } elseif ($request->input('status_code') == 0) {
            $invoice->update(['status' => 'pending']);
        } elseif ($request->input('status_code') == -1) {
            $invoice->update(['status' => 'cancelled']);
        } elseif ($request->input('status_code') == -2) {
            $invoice->update(['status' => 'failed']);
        }

        return response('OK', 200);
    }

    /**
     * After payment, auto-activate the service upgrade or renewal.
     */
    private function activateServiceAfterPayment(Invoice $invoice)
    {
        $breakdown = $invoice->service_breakdown ?? '';
        $metadata = json_decode($breakdown, true);
        $metadata = is_array($metadata) && array_is_list($metadata) ? ($metadata[0] ?? []) : $metadata;

        // Handle Upgrade: "Upgrade 'Website Hosting' to Pro Hosting"
        if (str_starts_with($breakdown, 'Upgrade')) {
            preg_match("/Upgrade '(.+)' to (.+)/", $breakdown, $matches);
            $serviceName = $matches[1] ?? null;
            $newPackage  = $matches[2] ?? null;

            if ($serviceName && $newPackage && $invoice->client_id) {
                if (str_contains(strtolower($serviceName), 'hosting')) {
                    \App\Models\ServiceSubscription::where('client_id', $invoice->client_id)
                        ->where('service_type', 'hosting')
                        ->update(['package_name' => $newPackage]);
                } elseif (str_contains(strtolower($serviceName), 'management')) {
                    \App\Models\ServiceSubscription::where('client_id', $invoice->client_id)
                        ->where('service_type', 'management')
                        ->update(['package_name' => $newPackage]);
                } else {
                    // Development project
                    \App\Models\Project::where('client_id', $invoice->client_id)
                        ->where('status', '!=', 'Completed')
                        ->update(['package' => $newPackage, 'pending_package' => null]);
                }
                Log::info("PayHere: Auto-upgraded service to '{$newPackage}' for client #{$invoice->client_id}");
            }
        }

        if (is_array($metadata) && ($metadata['type'] ?? '') === 'Renewal') {
            $serviceType = $metadata['service_type'] ?? null;
            $serviceId = $metadata['service_id'] ?? null;

            if ($serviceType === 'Hosting') {
                $account = \App\Models\HostingAccount::where('client_id', $invoice->client_id)->find($serviceId);
                if ($account) {
                    $current = $account->expiry_date ? \Carbon\Carbon::parse($account->expiry_date) : now();
                    $account->update(['expiry_date' => $current->addYear()->toDateString()]);
                }
            } elseif ($serviceType === 'Management') {
                $sub = \App\Models\Subscription::where('client_id', $invoice->client_id)->find($serviceId);
                if ($sub) {
                    $current = $sub->expiry_date ? \Carbon\Carbon::parse($sub->expiry_date) : now();
                    $sub->update(['expiry_date' => $current->addMonth()->toDateString()]);
                }
            } elseif ($serviceType === 'Website') {
                $project = \App\Models\Project::where('client_id', $invoice->client_id)->find($serviceId);
                if ($project) {
                    $current = $project->renewal_date ? \Carbon\Carbon::parse($project->renewal_date) : now();
                    $cycle = $metadata['cycle'] ?? 'monthly';
                    $project->update([
                        'renewal_date' => $cycle === 'yearly'
                            ? $current->addYear()->toDateString()
                            : $current->addMonth()->toDateString()
                    ]);
                }
            }

            Log::info("PayHere: Auto-renewed {$serviceType} service #{$serviceId} for client #{$invoice->client_id}");
            return;
        }

        // Legacy renewal text support
        if (str_starts_with($breakdown, 'Renewal')) {
            if ($invoice->client_id) {
                // Extend hosting by 1 year
                \App\Models\HostingAccount::where('client_id', $invoice->client_id)
                    ->orderByDesc('created_at')
                    ->take(1)
                    ->each(function ($account) {
                        $current = $account->expiry_date ? \Carbon\Carbon::parse($account->expiry_date) : now();
                        $account->update(['expiry_date' => $current->addYear()->toDateString()]);
                    });

                // Extend management subscription by 1 month
                \App\Models\Subscription::where('client_id', $invoice->client_id)
                    ->orderByDesc('created_at')
                    ->take(1)
                    ->each(function ($sub) {
                        $current = $sub->expiry_date ? \Carbon\Carbon::parse($sub->expiry_date) : now();
                        $sub->update(['expiry_date' => $current->addMonth()->toDateString()]);
                    });

                Log::info("PayHere: Auto-renewed services for client #{$invoice->client_id}");
            }
        }
    }
}
