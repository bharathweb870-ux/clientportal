<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Services\ExchangeRateService;

class AgentController extends Controller
{
    public function index()
    {
        try {
            // Fetch from users table where role is agent
            $usersAsAgents = User::where('role', 'agent')->get()->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                    'source' => 'User Table',
                    'earned_commissions' => 0,
                    'pending_commissions' => 0
                ];
            });

            // Fetch from agents table
            $agentsFromTable = \App\Models\Agent::with('user')->get()->map(function($agent) {
                return [
                    'id' => $agent->user_id ?? $agent->id,
                    'name' => $agent->user ? $agent->user->name : 'N/A',
                    'email' => $agent->user ? $agent->user->email : 'N/A',
                    'username' => $agent->user ? $agent->user->username : 'n/a',
                    'whatsapp' => $agent->whatsapp,
                    'commission_rate' => $agent->commission_rate,
                    'target_monthly' => $agent->target_monthly,
                    'role' => 'agent',
                    'created_at' => $agent->created_at,
                    'source' => 'Agents Table',
                    'earned_commissions' => $this->getCommissionSum($agent->id, 'paid'),
                    'pending_commissions' => $this->getCommissionSum($agent->id, 'pending')
                ];
            });

            // Merge by email, prioritizing agents from the agents table
            $merged = $agentsFromTable->concat($usersAsAgents)->unique('email')->values();

            return response()->json($merged);
        } catch (\Exception $e) {
            Log::error('Agent Fetch Error: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    public function performance($id)
    {
        try {
            $user = User::findOrFail($id);
            $agent = \App\Models\Agent::where('user_id', $user->id)->first();
            
            if (!$agent) {
                return response()->json(['error' => 'Agent record not found'], 404);
            }

            // Fetch clients added by this agent (using agent_id as User ID)
            $clients = \App\Models\Client::with(['projects', 'invoices'])
                ->where('agent_id', $user->id)
                ->get()
                ->map(function($client) use ($agent) {
                    $totalInvoiced = $client->invoices->sum('amount');
                    $paidInvoiced = $client->invoices->where('status', 'paid')->sum('amount');
                    $liveRate = ExchangeRateService::getUsdToLkr();
                    
                    // Convert total_deal_value to LKR. client->total_value is in USD.
                    $firstInvoice = $client->invoices->first();
                    $rate = $firstInvoice ? (float) $firstInvoice->exchange_rate : $liveRate;
                    if ($rate <= 1) {
                        $rate = $liveRate;
                    }
                    $totalDealValueLkr = $client->total_value * $rate;

                    return [
                        'id' => $client->id,
                        'name' => $client->full_name,
                        'company' => $client->company_name,
                        'status' => $client->status,
                        'projects_count' => $client->projects->count(),
                        'total_deal_value' => $totalDealValueLkr,
                        'total_deal_value_usd' => $client->total_value,
                        'payment_status' => $totalInvoiced > 0 ? ($paidInvoiced >= $totalInvoiced ? 'Fully Paid' : 'Partial/Pending') : 'No Invoice',
                        'commissions' => \App\Models\Commission::with('invoice')->where('client_id', $client->id)
                            ->where('agent_id', $agent->id)
                            ->get()
                            ->map(function($comm) use ($liveRate) {
                                $amount = (float) $comm->amount;
                                $currency = $comm->invoice ? strtoupper($comm->invoice->currency) : 'USD';
                                $rate = $comm->invoice ? (float) $comm->invoice->exchange_rate : $liveRate;
                                if ($rate <= 1) {
                                    $rate = $liveRate;
                                }
                                $convertedLkr = $currency === 'USD' ? $amount * $rate : $amount;

                                return [
                                    'id' => $comm->id,
                                    'amount' => $convertedLkr, // Always return LKR amount as the primary amount for the page
                                    'amount_usd' => $currency === 'LKR' ? $amount / $rate : $amount,
                                    'percentage' => $comm->percentage,
                                    'status' => $comm->status,
                                    'currency' => 'LKR',
                                ];
                            })
                    ];
                });

            return response()->json([
                'agent_name' => $user->name,
                'target_monthly' => $agent->target_monthly,
                'commission_rate' => $agent->commission_rate,
                'clients' => $clients,
                'total_earnings' => $this->getCommissionSum($agent->id, 'paid'),
                'pending_earnings' => $this->getCommissionSum($agent->id, 'pending')
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function myPerformance(Request $request)
    {
        return $this->performance($request->user()->id);
    }

    public function toggleCommissionStatus(Request $request, $commissionId)
    {
        try {
            $commission = \App\Models\Commission::findOrFail($commissionId);
            $newStatus = $request->status; // 'pending', 'paid', 'cancelled'
            
            $commission->update([
                'status' => $newStatus,
                'paid_at' => $newStatus === 'paid' ? now() : null
            ]);

            return response()->json(['message' => 'Commission status updated', 'commission' => $commission]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        Log::info('Agent Onboarding Submission:', $request->all());

        try {
            $email = $request->email;
            $username = $request->username ?? strtolower(explode(' ', $request->full_name)[0] . rand(100, 999));
            $password = $request->password ?? 'agent123';

            // 1. Create/Update User
            // Note: User model has 'password' => 'hashed' cast which auto-hashes plain text.
            // Do NOT wrap with Hash::make() or the password will be double-hashed.
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $request->full_name,
                    'username' => $username,
                    'password' => $password,
                    'role' => 'agent'
                ]
            );

            // 2. Save to Agents Table using user_id
            $agent = \App\Models\Agent::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'whatsapp' => $request->whatsapp,
                    'commission_rate' => $request->commission_rate ?? 25,
                    'target_monthly' => $request->target_monthly ?? 0,
                    'status' => 'active'
                ]
            );

            return response()->json([
                'message' => 'Agent registered and account created successfully!',
                'agent' => $agent,
                'user' => $user
            ], 201);
        } catch (\Exception $e) {
            Log::error('Agent Registration Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Registration failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        $agent = \App\Models\Agent::where('user_id', $user->id)->first();
        
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'role' => $user->role,
            'commission_rate' => $agent ? $agent->commission_rate : 25,
            'target_monthly' => $agent ? $agent->target_monthly : 0,
            'whatsapp' => $agent ? $agent->whatsapp : '',
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->update($request->only(['name', 'email', 'username', 'role']));

            // Admin password override: if a new password is provided, update it.
            // The User model's 'hashed' cast handles hashing automatically.
            if ($request->filled('password')) {
                $user->password = $request->password;
                $user->save();
            }
            
            $agent = \App\Models\Agent::where('user_id', $user->id)->first();
            if ($agent) {
                $agent->update($request->only(['commission_rate', 'target_monthly', 'whatsapp']));
            }
            
            return response()->json(['message' => 'Agent updated successfully', 'user' => $user]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Update failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            // Find agent first to get user_id if it's an agent ID
            $agent = \App\Models\Agent::find($id);
            if ($agent) {
                if ($agent->user_id) {
                    User::where('id', $agent->user_id)->delete();
                }
                $agent->delete();
                return response()->json(['message' => 'Agent deleted successfully']);
            }

            // If not found in agents, try users table
            $user = User::find($id);
            if ($user && $user->role === 'agent') {
                \App\Models\Agent::where('user_id', $user->id)->delete();
                $user->delete();
                return response()->json(['message' => 'Agent user deleted successfully']);
            }

            return response()->json(['error' => 'Agent not found'], 404);
        } catch (\Exception $e) {
            Log::error('Agent Deletion Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Deletion failed due to related records',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getCommissionSum($agentId, $status)
    {
        $commissions = \App\Models\Commission::with('invoice')
            ->where('agent_id', $agentId)
            ->where('status', $status)
            ->get();

        $total = 0;
        $liveRate = ExchangeRateService::getUsdToLkr();
        foreach ($commissions as $comm) {
            $amount = (float) $comm->amount;
            $currency = $comm->invoice ? strtoupper($comm->invoice->currency) : 'USD';
            $rate = $comm->invoice ? (float) $comm->invoice->exchange_rate : $liveRate;
            if ($rate <= 1) {
                $rate = $liveRate;
            }

            if ($currency === 'USD') {
                $total += $amount * $rate;
            } else {
                $total += $amount;
            }
        }
        return $total;
    }
}