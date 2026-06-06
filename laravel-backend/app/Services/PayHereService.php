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
        $localHash = $this->generateHash(
            $request->order_id,
            $request->payhere_amount,
            $request->payhere_currency
        );
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
            'return_url'    => url('/client/invoices?payment=success'),
            'cancel_url'    => url('/client/invoices?payment=cancelled'),
            'notify_url'    => $notifyUrl,
            'order_id'      => (string) $invoice->id,
            'items'         => $invoice->service_breakdown ?? 'Service Payment',
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