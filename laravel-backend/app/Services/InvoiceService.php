<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Project;
use App\Models\Client;
use App\Models\Agent;
use App\Models\Commission;
use Illuminate\Support\Str;

class InvoiceService
{
    /**
     * Generate a new automated invoice for a project.
     */
    public function generateForProject(Project $project, array $data = [])
    {
        $year = date('Y');
        $lastInvoice = Invoice::whereYear('created_at', $year)->latest()->first();
        $nextId = $lastInvoice ? (int) substr($lastInvoice->invoice_number, -4) + 1 : 1;
        
        $invoiceNumber = 'WEB-' . $year . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

        return Invoice::create([
            'invoice_number' => $invoiceNumber,
            'client_id'      => $project->client_id,
            'amount'         => $data['amount'] ?? $project->total_value,
            'currency'       => $data['currency'] ?? 'LKR',
            'status'         => 'pending',
            'due_date'       => $data['due_date'] ?? now()->addDays(7),
            'service_breakdown' => $data['description'] ?? "Payment for Project: {$project->name}",
        ]);
    }

    /**
     * Calculate agent commission (Fixed at 25%).
     */
    public function calculateCommission(Invoice $invoice)
    {
        $client = Client::find($invoice->client_id);
        if (!$client || !$client->agent_id) return 0;

        $agent = Agent::where('user_id', $client->agent_id)->first();
        if (!$agent) return 0;

        if (Commission::where('invoice_id', $invoice->id)->exists()) return 0;

        $commissionRate = $agent->commission_rate ?? 25;
        $baseAmount = floatval($invoice->amount) - floatval($invoice->vat ?? 0) - floatval($invoice->tax ?? 0);
        $commissionAmount = $baseAmount * ($commissionRate / 100);

        return Commission::create([
            'agent_id'   => $agent->id,
            'client_id'  => $client->id,
            'invoice_id' => $invoice->id,
            'amount'     => $commissionAmount,
            'percentage' => $commissionRate,
            'status'     => 'pending',
        ]);
    }

    /**
     * Generate PayHere direct payment link parameters.
     */
    public function getPaymentParams(Invoice $invoice)
    {
        $payHereService = new PayHereService();
        return $payHereService->initPayment($invoice);
    }
}