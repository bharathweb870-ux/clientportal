<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use App\Services\ExchangeRateService;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = \App\Models\Invoice::with('client');

        if ($user && $user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if ($client) {
                $query->where('client_id', $client->id);
            } else {
                return response()->json([]);
            }
        } elseif ($user && $user->role === 'agent') {
            $clientIds = \App\Models\Client::where('agent_id', $user->id)->pluck('id');
            $query->whereIn('client_id', $clientIds);
        }

        // Return invoices with client info as the payment ledger
        return response()->json(
            $query->get()->map(fn($inv) => [
                'id'             => $inv->id,
                'transaction_id' => $inv->invoice_number,
                'client_name'    => $inv->client ? $inv->client->full_name : 'N/A',
                'amount'         => $inv->amount,
                'vat'            => $inv->vat,
                'tax'            => $inv->tax,
                'currency'       => strtoupper($inv->currency ?? 'USD'),
                'exchange_rate'  => $inv->exchange_rate ?? ExchangeRateService::getUsdToLkr(),
                'payment_method' => 'Invoice',
                'status'         => ucfirst($inv->status),
                'due_date'       => $inv->due_date,
                'service_breakdown' => $inv->service_breakdown,
                'created_at'     => $inv->created_at,
            ])
        );
    }

    public function store(Request $request)
    {
        $validFields = ['invoice_id', 'amount', 'payment_method', 'transaction_id', 'status'];
        $payment = Payment::create($request->only($validFields));
        return response()->json($payment, 201);
    }

    public function show($id)
    {
        $payment = Payment::find($id);
        if (!$payment) return response()->json(['error' => 'Payment not found'], 404);
        return response()->json($payment);
    }

    public function update(Request $request, $id)
    {
        try {
            $payment = Payment::find($id);
            if (!$payment) return response()->json(['error' => 'Payment not found'], 404);
            
            $validFields = ['invoice_id', 'amount', 'payment_method', 'transaction_id', 'status'];
            $payment->update($request->only($validFields));
            return response()->json($payment);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Update failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $payment = Payment::find($id);
            if (!$payment) return response()->json(['error' => 'Payment not found'], 404);

            $payment->delete();
            return response()->json(['message' => 'Payment deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Deletion failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
