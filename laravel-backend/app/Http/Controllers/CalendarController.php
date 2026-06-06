<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Invoice;
use App\Models\Client; // Assuming domains might be linked here or in a separate model
use Illuminate\Http\Request;
use Carbon\Carbon;

class CalendarController extends Controller
{
    /**
     * Fetch all events for the calendar (Renewals, Deadlines, Payments).
     */
    public function events(Request $request)
    {
        $events = [];
        $user = $request->user();
        $isClient = $user && $user->role === 'client';
        $isAgent = $user && $user->role === 'agent';
        $clientId = null;
        $clientIds = [];

        if ($isClient) {
            $client = Client::where('user_id', $user->id)->first() ?? Client::where('email', $user->email)->first();
            $clientId = $client ? $client->id : -1;
        }

            if ($isAgent) {
            $clientIds = Client::where('agent_id', $user->id)->pluck('id')->toArray();
        }

        // 1b. Website Order Renewals
        $websiteRenewalsQuery = Project::with('client')
            ->where('name', 'like', 'Website Order -%')
            ->whereRaw('LOWER(status) NOT IN (?,?)', ['pending', 'cancelled'])
            ->whereNotNull('renewal_date');
        if ($isClient) $websiteRenewalsQuery->where('client_id', $clientId);
        if ($isAgent) $websiteRenewalsQuery->whereIn('client_id', $clientIds);
        $websiteRenewals = $websiteRenewalsQuery->get();

        foreach ($websiteRenewals as $project) {
            $clientName = $project->client ? $project->client->full_name : 'N/A';
            $events[] = [
                'id' => 'renewal-website-' . $project->id,
                'title' => ($isClient ? '' : $clientName . ': ') . 'Renewal: ' . ($project->package ?: $project->name),
                'start' => $project->renewal_date,
                'color' => '#22c55e',
                'extendedProps' => [
                    'type' => 'renewal',
                    'client' => $clientName
                ]
            ];
        }

        // 1. Project Deadlines
        $projectsQuery = Project::with('client')->whereNotNull('deadline');
        if ($isClient) $projectsQuery->where('client_id', $clientId);
        if ($isAgent) $projectsQuery->whereIn('client_id', $clientIds);
        $projects = $projectsQuery->get();

        foreach ($projects as $project) {
            if (str_starts_with($project->name ?? '', 'Website Order -') && in_array(strtolower($project->status ?? ''), ['pending', 'cancelled'], true)) {
                continue;
            }

            $clientName = $project->client ? $project->client->full_name : 'N/A';
            $events[] = [
                'id' => 'project-' . $project->id,
                'title' => ($isClient ? '' : $clientName . ': ') . 'Deadline: ' . $project->name,
                'start' => $project->deadline,
                'color' => '#ff6b00',
                'extendedProps' => [
                    'type' => 'project',
                    'client' => $clientName
                ]
            ];
        }

        // 2. Pending Invoices
        $invoicesQuery = Invoice::with('client')->where('status', 'pending')->whereNotNull('due_date');
        if ($isClient) $invoicesQuery->where('client_id', $clientId);
        if ($isAgent) $invoicesQuery->whereIn('client_id', $clientIds);
        $invoices = $invoicesQuery->get();

        foreach ($invoices as $invoice) {
            $clientName = $invoice->client ? $invoice->client->full_name : 'N/A';
            $events[] = [
                'id' => 'invoice-' . $invoice->id,
                'title' => ($isClient ? '' : $clientName . ': ') . 'Payment: ' . $invoice->invoice_number,
                'start' => $invoice->due_date,
                'color' => '#0d1b6f',
                'extendedProps' => [
                    'type' => 'payment',
                    'client' => $clientName,
                    'amount' => 'USD ' . $invoice->amount
                ]
            ];
        }

        // 3. Domain/Hosting Renewals
        $hostingsQuery = \App\Models\HostingAccount::with('client')->whereNotNull('expiry_date');
        if ($isClient) $hostingsQuery->where('client_id', $clientId);
        if ($isAgent) $hostingsQuery->whereIn('client_id', $clientIds);
        $hostings = $hostingsQuery->get();

        foreach ($hostings as $hosting) {
            $clientName = $hosting->client ? $hosting->client->full_name : 'N/A';
            $events[] = [
                'id' => 'renewal-hosting-' . $hosting->id,
                'title' => ($isClient ? '' : $clientName . ': ') . 'Renewal: ' . $hosting->domain_name,
                'start' => $hosting->expiry_date,
                'color' => '#10b981',
                'extendedProps' => [
                    'type' => 'renewal',
                    'client' => $clientName
                ]
            ];
        }

        // 4. Website Management
        $subscriptionsQuery = \App\Models\Subscription::with('client')->whereNotNull('expiry_date');
        if ($isClient) $subscriptionsQuery->where('client_id', $clientId);
        if ($isAgent) $subscriptionsQuery->whereIn('client_id', $clientIds);
        $subscriptions = $subscriptionsQuery->get();

        foreach ($subscriptions as $sub) {
            $clientName = $sub->client ? $sub->client->full_name : 'N/A';
            $events[] = [
                'id' => 'renewal-sub-' . $sub->id,
                'title' => ($isClient ? '' : $clientName . ': ') . 'Service: ' . $sub->package,
                'start' => $sub->expiry_date,
                'color' => '#8b5cf6',
                'extendedProps' => [
                    'type' => 'service',
                    'client' => $clientName
                ]
            ];
        }

        return response()->json($events);
    }
}
