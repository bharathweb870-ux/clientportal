<?php

namespace App\Services;

use Illuminate\Http\Request;
use App\Models\Invoice;

class PayHereService {
    public function generateHash($orderId, $amount, $currency): string {
        $merchantId  = config('payhere.merchant_id');
        $secret      = strtoupper(md5(config('payhere.merchant_secret')));
        $amountFormatted = number_format((float)$amount, 2, '.', '');
        return strtoupper(md5(
            $merchantId . $orderId . $amountFormatted . $currency . $secret
        ));
    }

    public function verifyCallback(Request $request): bool {
        $merchantId  = config('payhere.merchant_id');
        $secret      = strtoupper(md5(config('payhere.merchant_secret')));
        
        $localHash = strtoupper(md5(
            $merchantId . 
            $request->order_id . 
            $request->payhere_amount . 
            $request->payhere_currency . 
            $request->status_code . 
            $secret
        ));
        return $localHash === strtoupper($request->md5sig);
    }

    public function initPayment(Invoice $invoice): array {
        $amount   = $invoice->amount ?? 0;
        $currency = $invoice->currency ?? 'USD';
        $client   = $invoice->client;

        // Safely get client info with fallbacks
        $firstName = 'Client';
        $email     = '';
        $phone     = '';
        $address   = 'N/A';
        $city      = 'Colombo';
        $country   = 'Sri Lanka';

        if ($client) {
            $nameParts = explode(' ', $client->full_name ?? 'Client');
            $firstName = $nameParts[0] ?? 'Client';
            $email     = $client->email ?? '';
            $phone     = $client->phone ?? '0771234567';
            $address   = $client->address ?? 'N/A';
            $city      = $client->city ?? 'Colombo';
            $country   = $client->country ?? 'Sri Lanka';
        }

        $mode       = config('payhere.mode', 'sandbox');
        $baseUrl    = ($mode === 'live') 
            ? 'https://www.payhere.lk/pay/checkout' 
            : 'https://sandbox.payhere.lk/pay/checkout';
        $notifyUrl  = config('payhere.notify_url') ?: url('/api/payhere/notify');

        return [
            'sandbox'       => ($mode !== 'live'),
            'merchant_id'   => config('payhere.merchant_id'),
            'return_url'    => (env('FRONTEND_URL', 'https://portal.crm.webbuilders.lk') . '/client/invoices?payment=success'),
            'cancel_url'    => (env('FRONTEND_URL', 'https://portal.crm.webbuilders.lk') . '/client/invoices?payment=cancelled'),
            'notify_url'    => $notifyUrl,
            'order_id'      => (string) $invoice->id,
            'items'         => (function() use ($invoice) {
                $raw = $invoice->service_breakdown ?? '';
                if (!$raw) return 'Service Payment';
                $decoded = json_decode($raw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $first = is_array($decoded[0] ?? null) ? ($decoded[0]) : $decoded;
                    $name = $first['name'] ?? $first['order']['websiteName'] ?? $first['package'] ?? null;
                    $type = $first['type'] ?? null;
                    return trim(($type ? $type . ' - ' : '') . ($name ?? 'Service Payment'));
                }
                return strlen($raw) > 100 ? 'Service Payment' : $raw;
            })(),
            'currency'      => $currency,
            'amount'        => number_format((float)$amount, 2, '.', ''),
            'hash'          => $this->generateHash($invoice->id, $amount, $currency),
            'first_name'    => $firstName,
            'last_name'     => '',
            'email'         => $email,
            'phone'         => $phone,
            'address'       => $address,
            'city'          => $city,
            'country'       => $country,
        ];
    }
}