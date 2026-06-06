<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Client;
use App\Models\Project;
use App\Models\Payment;
use App\Models\Commission;
use App\Models\Invoice;
use App\Models\ServiceSubscription;
use App\Models\HostingAccount;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Services\ExchangeRateService;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->role === 'client') {
                return $this->clientDashboard($user);
            }

            if ($user->role === 'agent') {
                return $this->agentDashboard($user);
            }

            return response()->json($this->getAdminStats());
        } catch (\Exception $e) {
            Log::error('Dashboard Error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Dashboard Data Error',
                'message' => $e->getMessage(),
                'status'  => 'error',
            ], 500);
        }
    }

    // -------------------------------------------------------------------------
    // Admin helpers
    // -------------------------------------------------------------------------

    private function getAdminStats(): array
    {
        $totalClients = Client::count() ?: User::where('role', 'client')->count();
        $activeAgents = User::where('role', 'agent')->count();

        [$websiteOrderCount, $serviceBreakdown] = $this->getServiceBreakdown();
        $revenueBreakdown = $this->getRevenueBreakdown();
        $pendingBreakdown = $this->getPendingBreakdown();

        return [
            'total_revenue'           => array_sum($revenueBreakdown),
            'total_revenue_breakdown' => $revenueBreakdown,
            'active_projects'         => Project::whereRaw('LOWER(status) = ?', ['in progress'])->count(),
            'total_clients'           => $totalClients,
            'active_agents'           => $activeAgents,
            'pending_payments'        => array_sum($pendingBreakdown),
            'pending_payments_breakdown' => $pendingBreakdown,
            'total_commissions'       => $this->getTotalCommissionsUsd(),
            'revenue_trend'           => '+12%',
            'projects_trend'          => Project::whereRaw('LOWER(status) IN (?,?)', ['in progress', 'on hold'])->count() . ' Active',
            'monthly_revenue'         => $this->getMonthlyRevenue(),
            'service_breakdown'       => $serviceBreakdown,
            'new_requests_count'      => Client::where('status', 'pending')->count(),
            'website_orders_count'    => $websiteOrderCount,
            'expired_services_count'  => HostingAccount::where('expiry_date', '<', now())->count()
                + Subscription::where('expiry_date', '<', now())->count(),
            'status'                  => 'success',
        ];
    }

    private function getMonthlyRevenue(): array
    {
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $paymentSum = Payment::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->whereIn('status', ['Success', 'Paid', 'paid'])
                ->sum('amount');
            $invoiceSum = Invoice::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->where('status', 'paid')
                ->sum('amount');
            $monthlyRevenue[] = [
                'name'    => $month->format('M'),
                'revenue' => $paymentSum + $invoiceSum,
            ];
        }
        return $monthlyRevenue;
    }

    private function getServiceBreakdown(): array
    {
        $developmentCount  = Project::where('status', 'In Progress')->count();
        $websiteOrderKeys  = [];
        Project::where('name', 'like', 'Website Order -%')
            ->where(function ($query) {
                $query->whereIn('status', ['Pending', 'pending'])
                      ->orWhere('approval_status', 'pending')
                      ->orWhereNull('approval_status');
            })
            ->get(['id'])
            ->each(function ($project) use (&$websiteOrderKeys) {
                $websiteOrderKeys['project:' . $project->id] = true;
            });

        $websiteOrderCount = count($websiteOrderKeys);
        $hostingCount      = ServiceSubscription::where('service_type', 'hosting')->where('status', 'active')->count();
        $managementCount   = ServiceSubscription::where('service_type', 'management')->where('status', 'active')->count();

        $breakdown = [
            ['name' => 'Website Development', 'count' => $developmentCount],
            ['name' => 'Website Orders',      'count' => $websiteOrderCount],
            ['name' => 'Website Hosting',     'count' => $hostingCount],
            ['name' => 'Website Management',  'count' => $managementCount],
        ];

        return [$websiteOrderCount, $breakdown];
    }

    private function getRevenueBreakdown(): array
    {
        $breakdown = [];
        Payment::whereIn('status', ['Success', 'Paid', 'paid'])->with('invoice')->get()
            ->each(function ($payment) use (&$breakdown) {
                $currency = strtoupper($payment->currency ?: ($payment->invoice->currency ?? 'USD'));
                $breakdown[$currency] = ($breakdown[$currency] ?? 0) + (float) $payment->amount;
            });
        Invoice::where('status', 'paid')->get()
            ->each(function ($invoice) use (&$breakdown) {
                $currency = strtoupper($invoice->currency ?: 'USD');
                $breakdown[$currency] = ($breakdown[$currency] ?? 0) + (float) $invoice->amount;
            });
        return $breakdown;
    }

    private function getPendingBreakdown(): array
    {
        $breakdown = [];
        Payment::whereIn('status', ['Pending', 'pending'])->with('invoice')->get()
            ->each(function ($payment) use (&$breakdown) {
                $currency = strtoupper($payment->currency ?: ($payment->invoice->currency ?? 'USD'));
                $breakdown[$currency] = ($breakdown[$currency] ?? 0) + (float) $payment->amount;
            });
        Invoice::where('status', 'pending')->get()
            ->each(function ($invoice) use (&$breakdown) {
                $currency = strtoupper($invoice->currency ?: 'USD');
                $breakdown[$currency] = ($breakdown[$currency] ?? 0) + (float) $invoice->amount;
            });
        return $breakdown;
    }

    private function getTotalCommissionsUsd(): float
    {
        $total = 0.0;
        $liveRate = ExchangeRateService::getUsdToLkr();
        Commission::with('invoice')->get()->each(function ($comm) use (&$total, $liveRate) {
            $amount   = (float) $comm->amount;
            $currency = $comm->invoice ? strtoupper($comm->invoice->currency) : 'USD';
            $rate     = $comm->invoice ? (float) $comm->invoice->exchange_rate : $liveRate;
            if ($rate <= 1) {
                $rate = $liveRate;
            }
            $total += ($currency === 'LKR') ? $amount / $rate : $amount;
        });
        return $total;
    }

    // -------------------------------------------------------------------------
    // Agent dashboard
    // -------------------------------------------------------------------------

    private function agentDashboard($user): JsonResponse
    {
        try {
            $agentRecord = \App\Models\Agent::where('user_id', $user->id)->first();
            $agentId     = $agentRecord ? $agentRecord->id : $user->id;

            return response()->json([
                'role'             => 'agent',
                'total_earnings'   => $this->getCommissionSum($agentId, 'paid'),
                'pending_payouts'  => $this->getCommissionSum($agentId, 'pending'),
                'total_clients'    => Client::where('agent_id', $user->id)->count(),
                'commission_rate'  => ($agentRecord->commission_rate ?? 25) . '%',
                'recent_clients'   => Client::where('agent_id', $user->id)->orderBy('created_at', 'desc')->limit(5)->get(),
                'monthly_earnings' => $this->getAgentMonthlyEarnings($agentId),
                'status'           => 'success',
            ]);
        } catch (\Exception $e) {
            return response()->json(['role' => 'agent', 'error' => $e->getMessage()]);
        }
    }

    private function getAgentMonthlyEarnings(int $agentId): array
    {
        $monthlyEarnings = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            
            $commissions = Commission::with('invoice')
                ->where('agent_id', $agentId)
                ->where('status', 'paid')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->get();
                
            $total = 0.0;
            $liveRate = ExchangeRateService::getUsdToLkr();
            foreach ($commissions as $comm) {
                $amount   = (float) $comm->amount;
                $currency = $comm->invoice ? strtoupper($comm->invoice->currency) : 'USD';
                $rate     = $comm->invoice ? (float) $comm->invoice->exchange_rate : $liveRate;
                if ($rate <= 1) {
                    $rate = $liveRate;
                }
                $total += ($currency === 'USD') ? $amount * $rate : $amount;
            }
            
            $monthlyEarnings[] = [
                'name'       => $month->format('M'),
                'commission' => $total,
            ];
        }
        return $monthlyEarnings;
    }

    // -------------------------------------------------------------------------
    // Client dashboard
    // -------------------------------------------------------------------------

    private function clientDashboard($user): JsonResponse
    {
        try {
            $client   = Client::where('user_id', $user->id)->first() ?? Client::where('email', $user->email)->first();
            $clientId = $client?->id;

            $allServices    = $this->getClientServices($clientId);
            $dueBreakdown   = $this->getClientDueBreakdown($user->email, $clientId);
            $nextRenewal    = $this->getNextRenewal($allServices);
            $mergedBilling  = $this->getRecentBilling($user->email, $clientId);

            return response()->json([
                'role'                => 'client',
                'active_services'     => count($allServices),
                'due_amount'          => array_sum($dueBreakdown),
                'due_amount_breakdown'=> $dueBreakdown,
                'next_renewal'        => $nextRenewal,
                'support_tickets'     => 0,
                'recent_invoices'     => $mergedBilling,
                'projects'            => $allServices,
                'status'              => 'success',
            ]);
        } catch (\Exception $e) {
            return response()->json(['role' => 'client', 'error' => $e->getMessage()]);
        }
    }

    private function getClientServices(?int $clientId): array
    {
        $devProjects = Project::where('client_id', $clientId)
            ->where(function ($q) {
                $q->whereNull('name')->orWhere('name', 'not like', 'Website Order -%');
            })
            ->get()->map(function ($p) {
                return [
                    'id'         => $p->id,
                    'service_id' => 'dev_' . $p->id,
                    'name'       => $p->name,
                    'package'    => $p->package,
                    'status'     => $p->status,
                    'progress'   => $p->progress,
                    'deadline'   => $p->deadline ?: 'N/A',
                    'type'       => 'Development',
                    'created_at' => $p->created_at?->toDateTimeString(),
                ];
            })->toArray();

        $websiteProjects = Project::where('client_id', $clientId)
            ->where('name', 'like', 'Website Order -%')
            ->where(function ($query) {
                $query->where('approval_status', 'approved')
                      ->orWhere(function ($q) {
                          $q->whereNull('approval_status')
                            ->whereNotIn('status', ['Pending', 'pending', 'Cancelled', 'cancelled']);
                      });
            })
            ->get()->map(function ($p) {
                return [
                    'id'              => $p->id,
                    'service_id'      => 'web_' . $p->id,
                    'name'            => $p->name,
                    'package'         => $p->package,
                    'status'          => $p->status,
                    'approval_status' => $p->approval_status,
                    'progress'        => $p->progress,
                    'deadline'        => $p->deadline ?: 'N/A',
                    'renewal_date'    => $p->renewal_date ?: 'N/A',
                    'type'            => 'Website',
                    'created_at'      => $p->created_at?->toDateTimeString(),
                ];
            })->toArray();

        $hostingServices = ServiceSubscription::where('client_id', $clientId)
            ->where('service_type', 'hosting')->get()->map(function ($h) {
                $account = HostingAccount::where('client_id', $h->client_id)->latest()->first();
                return [
                    'id'         => $h->id,
                    'service_id' => 'host_' . $h->id,
                    'name'       => 'Website Hosting',
                    'package'    => $h->package_name,
                    'status'     => $h->status,
                    'progress'   => 100,
                    'deadline'   => $account?->expiry_date ?? 'N/A',
                    'type'       => 'Hosting',
                    'created_at' => $h->created_at?->toDateTimeString(),
                ];
            })->toArray();

        $managementServices = ServiceSubscription::where('client_id', $clientId)
            ->where('service_type', 'management')->get()->map(function ($m) {
                $sub = Subscription::where('client_id', $m->client_id)->latest()->first();
                return [
                    'id'         => $m->id,
                    'service_id' => 'mgmt_' . $m->id,
                    'name'       => 'Website Management',
                    'package'    => $m->package_name,
                    'status'     => $m->status,
                    'progress'   => 100,
                    'deadline'   => $sub?->expiry_date ?? 'N/A',
                    'type'       => 'Management',
                    'created_at' => $m->created_at?->toDateTimeString(),
                ];
            })->toArray();

        return array_merge($devProjects, $websiteProjects, $hostingServices, $managementServices);
    }

    private function getClientDueBreakdown(string $email, ?int $clientId): array
    {
        $breakdown = [];

        Payment::where('email', $email)->whereIn('status', ['Pending', 'pending'])->get()
            ->each(function ($payment) use (&$breakdown) {
                $currency = strtoupper($payment->currency ?: 'USD');
                $breakdown[$currency] = ($breakdown[$currency] ?? 0) + (float) $payment->amount;
            });

        Invoice::where('client_id', $clientId)->where('status', 'pending')->get()
            ->each(function ($invoice) use (&$breakdown) {
                $currency = strtoupper($invoice->currency ?: 'USD');
                $breakdown[$currency] = ($breakdown[$currency] ?? 0) + (float) $invoice->amount;
            });

        return $breakdown;
    }

    private function getNextRenewal(array $allServices): string
    {
        $deadlines = [];
        foreach ($allServices as $s) {
            $d = $s['renewal_date'] ?? $s['deadline'] ?? 'N/A';
            if ($d && $d !== 'N/A' && $d !== 'None') {
                $deadlines[] = $d;
            }
        }
        if (!empty($deadlines)) {
            sort($deadlines);
            return $deadlines[0];
        }
        return 'N/A';
    }

    private function getRecentBilling(string $email, ?int $clientId): array
    {
        $recentPayments = Payment::where('email', $email)->orderBy('created_at', 'desc')->limit(5)->get()->toArray();
        $recentInvoices = Invoice::where('client_id', $clientId)->orderBy('created_at', 'desc')->limit(5)->get()->toArray();

        $merged = array_merge($recentPayments, $recentInvoices);
        usort($merged, fn($a, $b) => strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''));
        return array_slice($merged, 0, 5);
    }

    // -------------------------------------------------------------------------
    // Shared helpers
    // -------------------------------------------------------------------------

    private function getCommissionSum(int $agentId, string $status): float
    {
        $total = 0.0;
        $liveRate = ExchangeRateService::getUsdToLkr();
        Commission::with('invoice')
            ->where('agent_id', $agentId)
            ->where('status', $status)
            ->get()
            ->each(function ($comm) use (&$total, $liveRate) {
                $amount   = (float) $comm->amount;
                $currency = $comm->invoice ? strtoupper($comm->invoice->currency) : 'USD';
                $rate     = $comm->invoice ? (float) $comm->invoice->exchange_rate : $liveRate;
                if ($rate <= 1) {
                    $rate = $liveRate;
                }
                $total += ($currency === 'USD') ? $amount * $rate : $amount;
            });
        return $total;
    }
}
