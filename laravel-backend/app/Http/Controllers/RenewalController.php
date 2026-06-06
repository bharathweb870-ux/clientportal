<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RenewalController extends Controller
{
    public function upcoming()
    {
        $renewals = [];

        $websiteOrders = \App\Models\Project::with('client')
            ->where('name', 'like', 'Website Order -%')
            ->whereRaw('LOWER(status) NOT IN (?,?)', ['pending', 'cancelled'])
            ->whereNotNull('renewal_date')
            ->where('renewal_date', '>=', now())
            ->where('renewal_date', '<=', now()->addMonths(2))
            ->get();

        foreach ($websiteOrders as $project) {
            $renewals[] = [
                'id' => $project->id,
                'type' => 'Website',
                'name' => $project->package ?: $project->name,
                'client' => $project->client ? $project->client->full_name : 'N/A',
                'expiry_date' => $project->renewal_date,
                'amount' => $project->total_value ?: 0,
                'status' => $project->status
            ];
        }

        // Fetch Hosting Renewals
        $hostings = \App\Models\HostingAccount::with('client')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '>=', now())
            ->where('expiry_date', '<=', now()->addMonths(2))
            ->get();

        foreach ($hostings as $hosting) {
            $package = \App\Models\Package::where('name', $hosting->package)->where('type', 'hosting')->first();
            $renewals[] = [
                'id' => $hosting->id,
                'type' => 'Hosting',
                'name' => $hosting->domain_name,
                'client' => $hosting->client ? $hosting->client->full_name : 'N/A',
                'expiry_date' => $hosting->expiry_date,
                'amount' => $package ? $package->price : 0,
                'status' => $hosting->status
            ];
        }

        // Fetch Subscription Renewals
        $subscriptions = \App\Models\Subscription::with('client')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '>=', now())
            ->where('expiry_date', '<=', now()->addMonths(2))
            ->get();

        foreach ($subscriptions as $sub) {
            $package = \App\Models\Package::where('name', $sub->package)->where('type', 'management')->first();
            // Fall back to ServiceSubscription price if no package row matches
            $sub_price = $package ? $package->price : 0;
            if (!$sub_price) {
                $svcSub = \App\Models\ServiceSubscription::where('client_id', $sub->client_id)
                    ->where('service_type', 'management')->latest()->first();
                $sub_price = $svcSub ? ($svcSub->final_price ?? $svcSub->negotiated_price ?? 0) : 0;
            }
            $renewals[] = [
                'id' => $sub->id,
                'type' => 'Management',
                'name' => $sub->package,
                'client' => $sub->client ? $sub->client->full_name : 'N/A',
                'expiry_date' => $sub->expiry_date,
                'amount' => $sub_price,
                'status' => $sub->status
            ];
        }

        return response()->json($renewals);
    }

    public function renew(Request $request)
    {
        $id = $request->id;
        $type = $request->type;
        $user = $request->user();
        $client = \App\Models\Client::where('user_id', $user->id)->first()
            ?? \App\Models\Client::where('email', $user->email)->first();

        if (!$client) {
            return response()->json(['error' => 'Client profile not found'], 404);
        }

        if ($type === 'Hosting') {
            $service = \App\Models\HostingAccount::findOrFail($id);
            $serviceName = $service->domain_name;
            $cycle = 'yearly';
        } elseif ($type === 'Website') {
            $service = \App\Models\Project::where('name', 'like', 'Website Order -%')->findOrFail($id);
            $serviceName = $service->package ?: $service->name;
            $cycle = str_contains(strtolower($service->package ?? ''), 'yearly') ? 'yearly' : 'monthly';
        } else {
            $service = \App\Models\Subscription::findOrFail($id);
            $serviceName = $service->package;
            $cycle = 'monthly';
        }

        if ((int) $service->client_id !== (int) $client->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $package = \App\Models\Package::where('name', $service->package ?? $service->package_name ?? null)
            ->where('type', $type === 'Hosting' ? 'hosting' : ($type === 'Management' ? 'management' : null))
            ->first();
        $price = $package ? $package->price : 0;
        if ($type === 'Website') {
            $price = (float) ($service->final_price ?? $service->total_value ?? 0);
        }
        // Fallback for Hosting/Management: use stored service price
        if (!$price && $type !== 'Website') {
            $price = (float) ($service->final_price ?? $service->negotiated_price ?? 0);
        }

        $breakdown = [
            'type' => 'Renewal',
            'service_type' => $type,
            'service_id' => $service->id,
            'name' => $serviceName,
            'cycle' => $cycle,
        ];

        $invoice = \App\Models\Invoice::create([
            'client_id' => $service->client_id,
            'invoice_number' => 'REN-' . strtoupper(substr(uniqid(), -6)),
            'amount' => $price,
            'currency' => 'USD',
            'status' => 'pending',
            'due_date' => now()->addDays(7)->toDateString(),
            'service_breakdown' => json_encode($breakdown)
        ]);

        return response()->json([
            'message' => 'Renewal invoice generated.',
            'invoice_id' => $invoice->id,
            'requires_payment' => true
        ]);
    }
}
