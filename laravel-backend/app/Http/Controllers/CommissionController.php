<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Commission;
use App\Models\Agent;
use App\Models\Client;
use Illuminate\Support\Facades\Log;

class CommissionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if ($user && $user->role === 'agent') {
                // Find the agent record - clients store agent_id as USER id, not Agent table id
                $agentRecord = Agent::where('user_id', $user->id)->first();
                $agentId     = $agentRecord ? $agentRecord->id : null;

                if (!$agentId) {
                    return response()->json([
                        'commissions'     => [],
                        'total_earned'    => 0,
                        'pending_amount'  => 0,
                        'commission_rate' => '0%',
                    ]);
                }

                // Fetch commissions from Commission table (created when invoices are paid)
                $commissions = Commission::with(['client', 'invoice'])
                    ->where('agent_id', $agentId)
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(function ($c) use ($agentRecord) {
                        return [
                            'id'          => $c->id,
                            'client_name' => $c->client ? $c->client->full_name : 'N/A',
                            'invoice_ref' => $c->invoice ? $c->invoice->invoice_number : 'N/A',
                            'amount'      => $c->amount,
                            'percentage'  => $c->percentage ?? ($agentRecord->commission_rate ?? 25),
                            'status'      => $c->status ?? 'pending',
                            'type'        => $c->type ?? 'direct',
                            'earned_at'   => $c->earned_at ?? $c->created_at,
                        ];
                    });

                $totalEarned   = $commissions->where('status', 'paid')->sum('amount');
                $pendingAmount = $commissions->whereIn('status', ['pending'])->sum('amount');
                $rate          = $agentRecord->commission_rate ?? 25;

                return response()->json([
                    'commissions'     => $commissions->values(),
                    'total_earned'    => $totalEarned,
                    'pending_amount'  => $pendingAmount,
                    'commission_rate' => $rate . '%',
                ]);
            }

            // Admin: return all commissions with full detail
            $commissions = Commission::with(['agent.user', 'client', 'invoice'])
                ->orderByDesc('created_at')
                ->get()
                ->map(function ($c) {
                    return [
                        'id'           => $c->id,
                        'agent_name'   => $c->agent && $c->agent->user ? $c->agent->user->name : 'N/A',
                        'client_name'  => $c->client ? $c->client->full_name : 'N/A',
                        'invoice_ref'  => $c->invoice ? $c->invoice->invoice_number : 'N/A',
                        'amount'       => $c->amount,
                        'percentage'   => $c->percentage ?? 25,
                        'status'       => $c->status ?? 'pending',
                        'type'         => $c->type ?? 'direct',
                        'earned_at'    => $c->earned_at ?? $c->created_at,
                    ];
                });

            return response()->json([
                'commissions'    => $commissions->values(),
                'total_earned'   => $commissions->where('status', 'paid')->sum('amount'),
                'pending_amount' => $commissions->where('status', 'pending')->sum('amount'),
                'commission_rate'=> 'Variable',
            ]);
        } catch (\Exception $e) {
            Log::error('Commission fetch error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage(), 'commissions' => []], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $commission = Commission::create($request->all());
            return response()->json($commission, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Creation failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $commission = Commission::with(['agent.user', 'client', 'invoice'])->find($id);
        if (!$commission) return response()->json(['error' => 'Commission not found'], 404);
        return response()->json($commission);
    }

    public function update(Request $request, $id)
    {
        try {
            $commission = Commission::find($id);
            if (!$commission) return response()->json(['error' => 'Commission not found'], 404);
            $commission->update($request->all());
            return response()->json($commission);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Update failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $commission = Commission::find($id);
            if (!$commission) return response()->json(['error' => 'Commission not found'], 404);
            $commission->delete();
            return response()->json(['message' => 'Commission deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Deletion failed', 'message' => $e->getMessage()], 500);
        }
    }
}