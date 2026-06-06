<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Commission;
use App\Models\Client;
use App\Models\Agent;
use Illuminate\Support\Facades\Log;

class CommissionService
{
    /**
     * Calculate and record commission for a paid invoice.
     * Looks up the agent via the client's agent_id field.
     */
    public static function calculate(Invoice $invoice)
    {
        try {
            if (!$invoice->client_id) return null;

            $client = Client::find($invoice->client_id);
            if (!$client || !$client->agent_id) return null;

            $agent = Agent::where('user_id', $client->agent_id)->first();
            if (!$agent) return null;

            // Avoid duplicate commission for same invoice
            if (Commission::where('invoice_id', $invoice->id)->exists()) return null;

            $commissionRate = $agent->commission_rate ?? 25;
            $baseAmount = $invoice->amount - ($invoice->vat ?? 0) - ($invoice->tax ?? 0);
            $commissionAmount = $baseAmount * ($commissionRate / 100);

            $commission = Commission::create([
                'agent_id'   => $agent->id,
                'client_id'  => $client->id,
                'invoice_id' => $invoice->id,
                'amount'     => $commissionAmount,
                'type'       => 'online',
                'status'     => 'pending',
                'earned_at'  => now(),
            ]);

            Log::info("Commission created: Agent #{$agent->id} earns {$commissionAmount} from Invoice #{$invoice->id}");
            return $commission;
        } catch (\Exception $e) {
            Log::error('Commission calculation failed: ' . $e->getMessage());
            return null;
        }
    }
}