<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class WebsiteOrderController extends Controller
{
    private function renewalDateForCycle(string $cycle): string
    {
        return $cycle === 'yearly'
            ? now()->addYear()->toDateString()
            : now()->addMonth()->toDateString();
    }

    private function packageCatalog(): array
    {
        return [
            [
                'id' => 'monthly-startup',
                'name' => 'Monthly Startup Website',
                'cycle' => 'monthly',
                'price' => 10000,
                'renewal_amount' => 950,
                'currency' => 'LKR',
                'delivery_days' => 14,
                'features' => [
                    'Ready-made business website',
                    'Up to 5 pages',
                    'Mobile responsive setup',
                    'Basic contact form',
                ],
            ],
            [
                'id' => 'monthly-pro',
                'name' => 'Monthly Pro Website',
                'cycle' => 'monthly',
                'price' => 25000,
                'renewal_amount' => 1500,
                'currency' => 'LKR',
                'delivery_days' => 21,
                'features' => [
                    'Premium ready-made website',
                    'Up to 10 pages',
                    'Booking or enquiry flow',
                    'Basic SEO setup',
                ],
            ],
            [
                'id' => 'yearly-startup',
                'name' => 'Yearly Startup Website',
                'cycle' => 'yearly',
                'price' => 9500,
                'renewal_amount' => 9500,
                'currency' => 'LKR',
                'delivery_days' => 14,
                'features' => [
                    'Ready-made business website',
                    'Annual maintenance included',
                    'Up to 5 pages',
                    'Priority launch support',
                ],
            ],
            [
                'id' => 'yearly-pro',
                'name' => 'Yearly Pro Website',
                'cycle' => 'yearly',
                'price' => 15000,
                'renewal_amount' => 15000,
                'currency' => 'LKR',
                'delivery_days' => 21,
                'features' => [
                    'Premium ready-made website',
                    'Annual updates included',
                    'Up to 10 pages',
                    'SEO and conversion setup',
                ],
            ],
        ];
    }

    public function packages()
    {
        return response()->json($this->packageCatalog());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'client') {
            return response()->json(['error' => 'Only client accounts can order websites.'], 403);
        }

        $client = Client::where('user_id', $user->id)->first()
            ?? Client::where('email', $user->email)->first();

        if (!$client) {
            return response()->json(['error' => 'Client profile not found.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'package_id' => ['required', 'string'],
            'business_name' => ['nullable', 'string', 'max:120'],
            'preferred_domain' => ['nullable', 'string', 'max:180'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $package = collect($this->packageCatalog())->firstWhere('id', $request->package_id);

        if (!$package) {
            return response()->json(['error' => 'Selected website package is not available.'], 422);
        }

        $result = DB::transaction(function () use ($request, $client, $package) {
            $project = Project::create([
                'client_id' => $client->id,
                'agent_id' => null,
                'name' => 'Website Order - ' . ($request->business_name ?: $package['name']),
                'description' => trim(implode("\n", array_filter([
                    'WEBbuilder website purchase from client portal.',
                    $request->business_name ? 'Business: ' . $request->business_name : null,
                    $request->preferred_domain ? 'Preferred domain/subdomain: ' . $request->preferred_domain : null,
                    $request->notes ? 'Notes: ' . $request->notes : null,
                ]))),
                'package' => $package['name'],
                'total_value' => $package['price'],
                'advance_payment' => 0,
                'original_price' => $package['price'],
                'negotiated_price' => $package['price'],
                'discount_amount' => 0,
                'final_price' => $package['price'],
                'currency' => $package['currency'],
                'status' => 'Pending',
                'approval_status' => 'pending',
                'approval_notes' => 'Ordered by client from website-selling portal.',
                'progress' => 0,
                'deadline' => now()->addDays($package['delivery_days'])->toDateString(),
                'renewal_date' => $this->renewalDateForCycle($package['cycle']),
            ]);

            $breakdown = [
                [
                    'type' => 'Website Purchase',
                    'name' => $package['name'],
                    'cycle' => $package['cycle'],
                    'renewal_date' => $this->renewalDateForCycle($package['cycle']),
                    'renewal_amount' => $package['renewal_amount'],
                    'package_id' => $package['id'],
                    'project_id' => $project->id,
                    'business_name' => $request->business_name,
                    'preferred_domain' => $request->preferred_domain,
                    'notes' => $request->notes,
                    'admin_note' => 'Price can be negotiated by editing this invoice amount.',
                ],
            ];

            $invoice = Invoice::create([
                'client_id' => $client->id,
                'invoice_number' => 'WEBBUY-' . strtoupper(substr(uniqid(), -8)),
                'amount' => $package['price'],
                'vat' => 0,
                'tax' => 0,
                'currency' => $package['currency'],
                'status' => 'pending',
                'service_breakdown' => json_encode($breakdown),
                'due_date' => now()->addDays(7)->toDateString(),
            ]);

            return ['project' => $project, 'invoice' => $invoice];
        });

        \App\Models\ActivityLog::log(
            $request,
            'WEBSITE_ORDER_CREATED',
            "Client {$client->full_name} ordered {$package['name']} from the website-selling portal."
        );

        return response()->json([
            'message' => 'Website order created. Invoice is ready for payment.',
            'project' => $result['project'],
            'invoice' => $result['invoice'],
        ], 201);
    }
}
