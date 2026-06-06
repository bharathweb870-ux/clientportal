<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class InvoiceController extends Controller
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

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        try {
            $data = $request->all();

            // Get Default Tax/VAT if not provided
            $defaultVat = \App\Models\Setting::get('default_vat_percentage', 0);
            $defaultTax = \App\Models\Setting::get('default_tax_percentage', 0);
            
            $baseAmount = floatval($request->amount ?: 0);
            
            if (!$request->has('vat')) {
                $data['vat'] = ($baseAmount * $defaultVat) / 100;
            }
            if (!$request->has('tax')) {
                $data['tax'] = ($baseAmount * $defaultTax) / 100;
            }

            // Recalculate total amount to include tax/vat if they were added
            $data['amount'] = $baseAmount + floatval($data['vat'] ?? 0) + floatval($data['tax'] ?? 0);

            $validFields = ['client_id', 'invoice_number', 'amount', 'vat', 'tax', 'currency', 'due_date', 'status', 'service_breakdown'];
            $invoice = \App\Models\Invoice::create(collect($data)->only($validFields)->toArray());
            return response()->json($invoice, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Creation failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $invoice = \App\Models\Invoice::with('client')->find($id);
        if (!$invoice) return response()->json(['error' => 'Invoice not found'], 404);
        return response()->json($invoice);
    }

    public function update(Request $request, $id)
    {
        try {
            $invoice = \App\Models\Invoice::find($id);
            if (!$invoice) return response()->json(['error' => 'Invoice not found'], 404);

            $validFields = ['client_id', 'invoice_number', 'amount', 'vat', 'tax', 'currency', 'due_date', 'status', 'service_breakdown'];
            $invoice->update($request->only($validFields));
            $this->syncWebsiteOrderProjectPricing($invoice);
            $this->syncCommission($invoice);
            return response()->json($invoice);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Update failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $invoice = \App\Models\Invoice::find($id);
            if (!$invoice) return response()->json(['error' => 'Invoice not found'], 404);

            $invoice->delete();
            return response()->json(['message' => 'Invoice deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Deletion failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function syncCommission(\App\Models\Invoice $invoice): void
    {
        $commission = \App\Models\Commission::where('invoice_id', $invoice->id)
            ->whereIn('status', ['pending', 'cancelled'])
            ->first();

        if (!$commission) return;

        $newAmount = $invoice->amount * ($commission->percentage / 100);
        $commission->update(['amount' => $newAmount]);
    }

    private function syncWebsiteOrderProjectPricing(\App\Models\Invoice $invoice): void
    {
        if (!$invoice->service_breakdown) {
            return;
        }

        $breakdown = json_decode($invoice->service_breakdown, true);
        if (!is_array($breakdown)) {
            return;
        }

        $item = array_is_list($breakdown) ? ($breakdown[0] ?? []) : $breakdown;
        if (($item['type'] ?? '') !== 'Website Purchase' || empty($item['project_id'])) {
            return;
        }

        $project = \App\Models\Project::find($item['project_id']);
        if (!$project) {
            return;
        }

        $original = (float) ($project->original_price ?? $project->total_value ?? $invoice->amount);
        $final = (float) $invoice->amount;

        $project->update([
            'negotiated_price' => $final,
            'final_price' => $final,
            'discount_amount' => max(0, $original - $final),
            'total_value' => $final,
        ]);
    }
}
