<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Invoice;
use App\Models\Client;
use App\Models\HostingAccount;
use App\Models\Subscription;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    /**
     * Fetch all events for the calendar (Renewals, Deadlines, Payments).
     * Each section is wrapped in try/catch so a missing table never kills the whole response.
     */
    public function events(Request $request)
    {
        $events = [];
        $user   = $request->user();

        $isClient = $user && $user->role === 'client';
        $isAgent  = $user && $user->role === 'agent';
        $clientId  = null;
        $clientIds = [];

        if ($isClient) {
            $client   = Client::where('user_id', $user->id)->first()
                     ?? Client::where('email', $user->email)->first();
            $clientId = $client ? $client->id : -1;
        }

        if ($isAgent) {
            $clientIds = Client::where('agent_id', $user->id)->pluck('id')->toArray();
        }

        // ── 1. Project Deadlines ──────────────────────────────────────────────
        try {
            $q = Project::with('client')->whereNotNull('deadline');
            if ($isClient) $q->where('client_id', $clientId);
            if ($isAgent)  $q->whereIn('client_id', $clientIds);

            foreach ($q->get() as $project) {
                // Skip pending/cancelled website orders
                if (
                    str_starts_with($project->name ?? '', 'Website Order -') &&
                    in_array(strtolower($project->status ?? ''), ['pending', 'cancelled'], true)
                ) continue;

                $client = $project->client?->full_name ?? 'N/A';
                $events[] = [
                    'id'    => 'project-' . $project->id,
                    'title' => ($isClient ? '' : $client . ': ') . 'Deadline: ' . $project->name,
                    'start' => $project->deadline,
                    'color' => '#ff6b00',
                    'extendedProps' => ['type' => 'project', 'client' => $client],
                ];
            }
        } catch (\Throwable $e) {
            \Log::error('CalendarController projects error: ' . $e->getMessage());
        }

        // ── 2. Website Order Renewals ─────────────────────────────────────────
        try {
            $q = Project::with('client')
                ->where('name', 'like', 'Website Order -%')
                ->whereRaw('LOWER(status) NOT IN (?,?)', ['pending', 'cancelled'])
                ->whereNotNull('renewal_date');
            if ($isClient) $q->where('client_id', $clientId);
            if ($isAgent)  $q->whereIn('client_id', $clientIds);

            foreach ($q->get() as $project) {
                $client = $project->client?->full_name ?? 'N/A';
                $events[] = [
                    'id'    => 'renewal-website-' . $project->id,
                    'title' => ($isClient ? '' : $client . ': ') . 'Renewal: ' . ($project->package ?: $project->name),
                    'start' => $project->renewal_date,
                    'color' => '#22c55e',
                    'extendedProps' => ['type' => 'renewal', 'client' => $client],
                ];
            }
        } catch (\Throwable $e) {
            \Log::error('CalendarController website renewals error: ' . $e->getMessage());
        }

        // ── 3. Pending Invoices ───────────────────────────────────────────────
        try {
            $q = Invoice::with('client')->where('status', 'pending')->whereNotNull('due_date');
            if ($isClient) $q->where('client_id', $clientId);
            if ($isAgent)  $q->whereIn('client_id', $clientIds);

            foreach ($q->get() as $invoice) {
                $client = $invoice->client?->full_name ?? 'N/A';
                $events[] = [
                    'id'    => 'invoice-' . $invoice->id,
                    'title' => ($isClient ? '' : $client . ': ') . 'Payment: ' . $invoice->invoice_number,
                    'start' => $invoice->due_date,
                    'color' => '#0d1b6f',
                    'extendedProps' => [
                        'type'   => 'payment',
                        'client' => $client,
                        'amount' => 'USD ' . $invoice->amount,
                    ],
                ];
            }
        } catch (\Throwable $e) {
            \Log::error('CalendarController invoices error: ' . $e->getMessage());
        }

        // ── 4. Hosting Account Renewals ───────────────────────────────────────
        try {
            $q = HostingAccount::with('client')->whereNotNull('expiry_date');
            if ($isClient) $q->where('client_id', $clientId);
            if ($isAgent)  $q->whereIn('client_id', $clientIds);

            foreach ($q->get() as $hosting) {
                $client = $hosting->client?->full_name ?? 'N/A';
                $events[] = [
                    'id'    => 'renewal-hosting-' . $hosting->id,
                    'title' => ($isClient ? '' : $client . ': ') . 'Renewal: ' . $hosting->domain_name,
                    'start' => $hosting->expiry_date,
                    'color' => '#10b981',
                    'extendedProps' => ['type' => 'renewal', 'client' => $client],
                ];
            }
        } catch (\Throwable $e) {
            \Log::error('CalendarController hosting error: ' . $e->getMessage());
        }

        // ── 5. Subscription / Website Management ─────────────────────────────
        try {
            $q = Subscription::with('client')->whereNotNull('expiry_date');
            if ($isClient) $q->where('client_id', $clientId);
            if ($isAgent)  $q->whereIn('client_id', $clientIds);

            foreach ($q->get() as $sub) {
                $client = $sub->client?->full_name ?? 'N/A';
                $events[] = [
                    'id'    => 'renewal-sub-' . $sub->id,
                    'title' => ($isClient ? '' : $client . ': ') . 'Service: ' . $sub->package,
                    'start' => $sub->expiry_date,
                    'color' => '#8b5cf6',
                    'extendedProps' => ['type' => 'service', 'client' => $client],
                ];
            }
        } catch (\Throwable $e) {
            \Log::error('CalendarController subscriptions error: ' . $e->getMessage());
        }

        return response()->json($events);
    }
}
