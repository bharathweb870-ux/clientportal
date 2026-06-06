<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Services\PayHereService;

class PayHereController extends Controller
{
    protected $payHereService;

    public function __construct(PayHereService $payHereService)
    {
        $this->payHereService = $payHereService;
    }

    /**
     * Get payment data for an invoice to initialize PayHere.
     */
    public function initiate(Request $request, $invoiceId)
    {
        try {
            $invoice = Invoice::with('client')->findOrFail($invoiceId);
            
            // Check if user owns this invoice or is authorized
            $user = $request->user();
            if ($user->role === 'client') {
                $client = \App\Models\Client::where('user_id', $user->id)->first() ?? \App\Models\Client::where('email', $user->email)->first();
                if (!$client || $invoice->client_id !== $client->id) {
                    return response()->json(['error' => 'Unauthorized'], 403);
                }
            }

            // PayHere works best with LKR for Sri Lankan accounts
            // If the invoice is in USD, we might need to convert it based on exchange rate
            // For now, let's assume we use the amount as is, or handle currency conversion
            
            $paymentData = $this->payHereService->initPayment($invoice);

            return response()->json($paymentData);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}