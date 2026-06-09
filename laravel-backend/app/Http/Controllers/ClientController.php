<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Client;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use App\Services\ExchangeRateService;
use Illuminate\Support\Facades\Mail;
use App\Mail\ClientVerificationMail;
use App\Mail\ClientApprovedMail;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $isAgent = $user && $user->role === 'agent';

            if ($user && $user->role === 'client') {
                $clients = Client::with(['invoices', 'serviceSubscriptions'])
                    ->where(function ($query) use ($user) {
                        $query->where('user_id', $user->id)
                            ->orWhere('email', $user->email);
                    })
                    ->get()
                    ->map(function ($client) {
                        $paymentStatus = 'pending';
                        if ($client->invoices && $client->invoices->count() > 0) {
                            $paymentStatus = $client->invoices->last()->status;
                        }

                        return [
                            'id'           => $client->id,
                            'full_name'    => $client->full_name,
                            'email'        => $client->email,
                            'phone'        => $client->phone,
                            'company_name' => $client->company_name,
                            'payment_status' => $paymentStatus,
                            'status'       => $client->status ?? 'active',
                            'is_verified'  => !is_null($client->email_verified_at),
                            'agent_name'   => null,
                            'created_at'   => $client->created_at,
                            'services'     => $client->serviceSubscriptions,
                        ];
                    });

                return response()->json($clients->values());
            }

            if ($isAgent) {
                // STRICT: Return ONLY clients where agent_id = this user's ID
                $agentId = $user->id;

                $clients = Client::with(['invoices', 'serviceSubscriptions'])->where('agent_id', $agentId)
                    ->get()
                    ->map(function($client) {
                        $paymentStatus = 'pending';
                        if ($client->invoices && $client->invoices->count() > 0) {
                            $paymentStatus = $client->invoices->last()->status;
                        }
                        return [
                            'id'           => $client->id,
                            'full_name'    => $client->full_name,
                            'email'        => $client->email,
                            'phone'        => $client->phone,
                            'company_name' => $client->company_name,
                            'payment_status' => $paymentStatus,
                            'status'       => $client->status ?? 'active',
                            'is_verified'  => !is_null($client->email_verified_at),
                            'agent_name'   => null,
                            'created_at'   => $client->created_at,
                            'services'     => $client->serviceSubscriptions,
                        ];
                    });

                return response()->json($clients->values());
            }

            // ADMIN: Return ALL clients from the clients table with agent info
            $status = $request->query('status');
            $query = Client::with(['agent', 'invoices', 'serviceSubscriptions']);

            if ($status) {
                $query->where('status', $status);
            }

            $clients = $query->get()->map(function($client) {
                $agentName = $client->agent ? $client->agent->name : 'Admin';
                
                $paymentStatus = 'pending';
                if ($client->invoices && $client->invoices->count() > 0) {
                    $paymentStatus = $client->invoices->last()->status;
                }

                $pData = is_string($client->pending_data) ? json_decode($client->pending_data, true) : $client->pending_data;
                $suggestedValue = floatval($pData['total_value'] ?? 0);

                if ($suggestedValue == 0 && isset($pData['services'])) {
                    $totalUSD = 0;
                    if (!empty($pData['services']['hosting']['selected'])) {
                        $totalUSD += floatval($pData['services']['hosting']['negotiated_price'] ?? 0);
                    }
                    if (!empty($pData['services']['management']['selected'])) {
                        $totalUSD += floatval($pData['services']['management']['negotiated_price'] ?? 0);
                    }
                    if (!empty($pData['services']['development']['selected'])) {
                        $totalUSD += floatval($pData['services']['development']['negotiated_price'] ?? 0);
                    }
                    
                    $vatRate = floatval($pData['vat'] ?? 0);
                    $taxRate = floatval($pData['tax'] ?? 0);
                    $grandTotalUSD = $totalUSD + ($totalUSD * $vatRate / 100) + ($totalUSD * $taxRate / 100);
                    
                    $exchangeRate = floatval($pData['exchange_rate'] ?? ExchangeRateService::getUsdToLkr());
                    $suggestedValue = $grandTotalUSD * $exchangeRate;
                }

                return [
                    'id'             => $client->id,
                    'full_name'      => $client->full_name,
                    'email'          => $client->email,
                    'phone'          => $client->phone,
                    'company_name'   => $client->company_name,
                    'payment_status' => $paymentStatus,
                    'status'         => $client->status ?: 'active',
                    'is_verified'    => !is_null($client->email_verified_at),
                    'agent_name'     => $agentName,
                    'created_at'     => $client->created_at,
                    'pending_data'   => $client->pending_data,
                    'suggested_value'=> $suggestedValue,
                    'services'       => $client->serviceSubscriptions

                ];
            });

            return response()->json($clients->values());

        } catch (\Exception $e) {
            Log::error('Client fetch error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $data = $request->all();
        Log::info('Admin/Agent Client Submission:', $data);

        try {
            // Validate required fields
            if (!$request->has('full_name') || !$request->has('email') || empty($request->full_name) || empty($request->email)) {
                return response()->json([
                    'error' => 'Validation failed',
                    'message' => 'Full Name and Email are required fields.'
                ], 400);
            }

            // Check if email already belongs to an Admin or Agent
            $existingUser = User::where('email', $request->email)->first();
            if ($existingUser && $existingUser->role !== 'client') {
                return response()->json([
                    'error' => 'Email already in use',
                    'message' => "This email belongs to an existing {$existingUser->role} account. Please use a different email for the client."
                ], 400);
            }

            // Determine if the creator is an agent
            $creator = $request->user();
            $isAgent = $creator && $creator->role === 'agent';
            
            // Get Default Tax/VAT from global Settings
            $defaultVat = \App\Models\Setting::get('default_vat_percentage', 0);
            $defaultTax = \App\Models\Setting::get('default_tax_percentage', 0);
            
            // Agent: ALWAYS use admin-defined defaults (cannot override)
            // Admin: Use provided values, or fall back to defaults
            if ($isAgent) {
                $vatPercentage = $defaultVat;
                $taxPercentage = $defaultTax;
            } else {
                $vatPercentage = $request->filled('vat') ? floatval($request->vat) : $defaultVat;
                $taxPercentage = $request->filled('tax') ? floatval($request->tax) : $defaultTax;
            }

            $agentId = $request->agent_id ?: ($isAgent ? $creator->id : null);
            $status = $isAgent ? 'pending' : 'active'; 

            if (!$isAgent && !$request->filled('password')) {
                return response()->json([
                    'error' => 'Password is required',
                    'message' => 'Please enter a client portal password before creating this client.'
                ], 422);
            }

            // 1. Create/Update User (Always create to avoid DB errors)
            $email = $request->email;
            $username = $request->username ?? strtolower(explode(' ', $request->full_name)[0] . rand(100, 999));
            $password = $request->filled('password') ? $request->password : 'client123';

            // Note: The User model has 'password' => 'hashed' cast,
            // so it auto-hashes plain-text passwords. Do NOT pass Hash::make()
            // here as that would be double-hashed (though Laravel's cast checks
            // isHashed() first, keeping it plain is cleaner & unambiguous).
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $request->full_name,
                    'username' => $username,
                    'password' => $password,
                    'role' => 'client'
                ]
            );

            // 2. Save to Clients Table
            $verificationToken = \Illuminate\Support\Str::random(64);
            
            $client = Client::updateOrCreate(
                ['email' => $request->email],
                [
                    'user_id' => $user->id,
                    'agent_id' => $agentId,
                    'full_name' => $request->full_name,
                    'phone' => $request->phone,
                    'whatsapp' => $request->whatsapp,
                    'company_name' => $request->company_name,
                    'address' => $request->address,
                    'nic' => $request->nic,
                    'status' => $status,
                    'verification_token' => $verificationToken,
                    'pending_data' => $isAgent ? json_encode($request->all()) : null
                ]
            );

            // 3. Admin-Only: Auto-creation of records
            if (!$isAgent) {
                $currency = $request->currency ?? 'USD';
                $exchangeRate = floatval($request->exchange_rate ?? ExchangeRateService::getUsdToLkr());
                $isLkr = $currency === 'LKR';

                $totalUsd = 0;
                $serviceBreakdown = [];

                if ($request->has('services') && is_array($request->services)) {
                    $services = $request->services;

                    // Development Project
                    if (!empty($services['development']['selected'])) {
                        $dev = $services['development'];
                        $orig = floatval($dev['original_price'] ?? 0);
                        $neg = floatval($dev['negotiated_price'] ?? $orig);
                        $totalUsd += $neg;

                        $serviceBreakdown[] = [
                            'type' => 'Development',
                            'name' => $dev['project_name'] ?? 'Custom Project',
                            'original_usd' => $orig,
                            'negotiated_usd' => $neg
                        ];

                        \App\Models\Project::create([
                            'client_id' => $client->id,
                            'agent_id' => $agentId,
                            'name' => $dev['project_name'] ?? 'Custom Project',
                            'description' => $dev['project_description'] ?? '',
                            'package' => 'Custom',
                            'total_value' => $orig,
                            'original_price' => $orig,
                            'negotiated_price' => $neg,
                            'final_price' => $neg,
                            'currency' => 'USD',
                            'advance_payment' => $dev['advance_payment'] ?? 0,
                            'status' => 'In Progress',
                            'progress' => 0,
                            'approval_status' => 'approved',
                            'approved_by' => $creator->id ?? null
                        ]);
                    }

                    // Hosting Service
                    if (!empty($services['hosting']['selected'])) {
                        $host = $services['hosting'];
                        $orig = floatval($host['original_price'] ?? 0);
                        $neg = floatval($host['negotiated_price'] ?? $orig);
                        $totalUsd += $neg;

                        $serviceBreakdown[] = [
                            'type' => 'Hosting',
                            'name' => $host['package_name'] ?? 'Starter Hosting',
                            'original_usd' => $orig,
                            'negotiated_usd' => $neg
                        ];

                        \App\Models\HostingAccount::create([
                            'client_id' => $client->id,
                            'domain_name' => $host['domain_name'] ?? 'N/A',
                            'package' => $host['package_name'] ?? 'Custom',
                            'expiry_date' => now()->addYear()->toDateString(),
                            'status' => 'active'
                        ]);

                        \App\Models\ServiceSubscription::create([
                            'client_id' => $client->id,
                            'service_type' => 'hosting',
                            'package_name' => $host['package_name'] ?? 'Custom',
                            'original_price' => $orig,
                            'negotiated_price' => $neg,
                            'final_price' => $neg,
                            'currency' => 'USD',
                            'billing_cycle' => 'yearly',
                            'status' => 'active',
                            'approved_by' => $creator->id ?? null
                        ]);
                    }

                    // Management Service
                    if (!empty($services['management']['selected'])) {
                        $mgmt = $services['management'];
                        $orig = floatval($mgmt['original_price'] ?? 0);
                        $neg = floatval($mgmt['negotiated_price'] ?? $orig);
                        $totalUsd += $neg;

                        $serviceBreakdown[] = [
                            'type' => 'Management',
                            'name' => $mgmt['package_name'] ?? 'Starter Management',
                            'original_usd' => $orig,
                            'negotiated_usd' => $neg
                        ];

                        \App\Models\Subscription::create([
                            'client_id' => $client->id,
                            'service_name' => 'Website Management',
                            'package' => $mgmt['package_name'] ?? 'Custom',
                            'expiry_date' => now()->addMonth()->toDateString(),
                            'status' => 'active'
                        ]);

                        \App\Models\ServiceSubscription::create([
                            'client_id' => $client->id,
                            'service_type' => 'management',
                            'package_name' => $mgmt['package_name'] ?? 'Custom',
                            'original_price' => $orig,
                            'negotiated_price' => $neg,
                            'final_price' => $neg,
                            'currency' => 'USD',
                            'billing_cycle' => 'monthly',
                            'status' => 'active',
                            'approved_by' => $creator->id ?? null
                        ]);
                    }

                    // Multi-Currency Invoice Generation
                    $vatUsd = ($totalUsd * $vatPercentage) / 100;
                    $taxUsd = ($totalUsd * $taxPercentage) / 100;
                    $grandTotalUsd = $totalUsd + $vatUsd + $taxUsd;

                    $finalInvoiceAmount = $isLkr ? ($grandTotalUsd * $exchangeRate) : $grandTotalUsd;
                    $finalVatAmount = $isLkr ? ($vatUsd * $exchangeRate) : $vatUsd;
                    $finalTaxAmount = $isLkr ? ($taxUsd * $exchangeRate) : $taxUsd;

                    $invoice = \App\Models\Invoice::create([
                        'client_id' => $client->id,
                        'invoice_number' => 'INV-' . strtoupper(uniqid()),
                        'amount' => $finalInvoiceAmount,
                        'vat' => $finalVatAmount,
                        'tax' => $finalTaxAmount,
                        'currency' => $currency,
                        'exchange_rate' => $isLkr ? $exchangeRate : 1,
                        'original_amount_usd' => $grandTotalUsd,
                        'converted_amount_lkr' => $isLkr ? $finalInvoiceAmount : null,
                        'service_breakdown' => json_encode($serviceBreakdown),
                        'due_date' => now()->addDays(7)->toDateString(),
                        'status' => $request->payment_status ?? 'pending'
                    ]);

                    $totalAmount = $totalUsd; // For commission calculation
                } else {
                    // Legacy Support
                    $totalAmount = floatval($request->total_value ?: 0);
                    // Create Project
                    if ($request->filled('project_name')) {
                        \App\Models\Project::create([
                            'client_id' => $client->id,
                            'agent_id' => $agentId,
                            'name' => $request->project_name,
                            'description' => $request->project_description ?? $request->expected_features,
                            'package' => $request->package_name,
                            'total_value' => $request->total_value,
                            'advance_payment' => $request->advance_payment,
                            'deadline' => $request->project_deadline,
                            'status' => 'In Progress',
                            'progress' => 0
                        ]);
                    }

                    // Create Hosting
                    $package = $request->package_name;
                    $expiryDate = $request->domain_expiry_date;
                    if ($package && !$expiryDate) $expiryDate = now()->addYear()->toDateString();
                    if ($package || $expiryDate) {
                        \App\Models\HostingAccount::create([
                            'client_id' => $client->id,
                            'domain_name' => $request->domain_name ?? 'N/A',
                            'package' => $package ?? 'Custom',
                            'expiry_date' => $expiryDate,
                            'status' => 'active'
                        ]);
                    }

                    // Create Invoice
                    $vatAmount = ($totalAmount * $vatPercentage) / 100;
                    $taxAmount = ($totalAmount * $taxPercentage) / 100;
                    $finalAmount = $totalAmount + $vatAmount + $taxAmount;

                    $invoice = null;
                    if ($finalAmount > 0) {
                        $invoice = \App\Models\Invoice::create([
                            'client_id' => $client->id,
                            'invoice_number' => 'INV-' . strtoupper(uniqid()),
                            'amount' => $finalAmount,
                            'vat' => $vatAmount,
                            'tax' => $taxAmount,
                            'currency' => 'LKR',
                            'due_date' => now()->addDays(7)->toDateString(),
                            'status' => $request->payment_status ?? 'pending'
                        ]);
                    }
                }

                // Create Commission Record if Agent is assigned
                if ($agentId) {
                    $agent = \App\Models\Agent::where('user_id', $agentId)->first();
                    if ($agent) {
                        $commissionPercentage = $agent->commission_rate ?: 25;
                        $commissionAmount = ($totalAmount * $commissionPercentage) / 100;

                        if ($commissionAmount > 0) {
                            \App\Models\Commission::create([
                                'agent_id' => $agent->id,
                                'client_id' => $client->id,
                                'invoice_id' => isset($invoice) ? $invoice->id : null,
                                'amount' => $commissionAmount,
                                'percentage' => $commissionPercentage,
                                'status' => 'pending',
                                'type' => 'direct'
                            ]);
                        }
                    }
                }
            }


            ActivityLog::log($request, $isAgent ? 'CLIENT_PENDING' : 'CLIENT_REGISTERED',
                "New client {$client->full_name} submitted by {$creator->role} ({$creator->name}). Verification link sent.");

            $verificationUrl = url("/api/verify-email/{$verificationToken}");

            // Send Email Notification to Client
            try {
                Mail::to($client->email)->send(new ClientVerificationMail($client, $verificationUrl));
            } catch (\Exception $e) {
                Log::error("Failed to send onboarding verification email: " . $e->getMessage());
            }

            return response()->json([
                'message' => $isAgent ? 'Verification link sent to client!' : 'Client registered successfully!',
                'client' => $client,
                'status' => $status,
                'verification_url' => $verificationUrl
            ], 201);
        } catch (\Exception $e) {
            Log::error('Admin Client Registration Error: ' . $e->getMessage());

            return response()->json([
                'error' => 'Registration failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function verifyEmail($token)
    {
        $client = Client::where('verification_token', $token)->first();

        if (!$client) {
            return response()->json(['message' => 'Invalid or expired verification token.'], 404);
        }

        $client->update([
            'email_verified_at' => now(),
            'verification_token' => null
        ]);

        return response()->json([
            'message' => 'Email verified successfully! Your account is now waiting for admin approval.'
        ]);
    }

    public function forceVerify(Request $request, $id)
    {
        try {
            $client = Client::findOrFail($id);

            $client->update([
                'email_verified_at' => now(),
                'verification_token' => null
            ]);

            ActivityLog::log($request, 'CLIENT_FORCE_VERIFIED',
                "Admin manually verified client {$client->full_name}");

            return response()->json(['message' => 'Client verified successfully by admin.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function approve(Request $request, $id)
    {
        Log::info("Attempting to approve client ID: {$id}");
        DB::beginTransaction();
        try {
            $client = Client::findOrFail($id);
            
            if ($client->status !== 'pending') {
                return response()->json(['message' => 'Client is already active.'], 400);
            }

            $password = $request->password;
            if (!$password) {
                return response()->json(['message' => 'Password is required for approval.'], 400);
            }

            $pData = is_string($client->pending_data) ? json_decode($client->pending_data, true) : ($client->pending_data ?? []);
            if (!is_array($pData)) $pData = [];

            // 1. Finalize Pricing/Value
            $baseAmount = $request->filled('base_amount') ? floatval($request->base_amount) : 0;
            
            // If base_amount not provided by admin, try to get from pending_data
            if ($baseAmount <= 0) {
                $baseAmount = floatval($pData['total_value'] ?? 0);
            }

            // 2. Find existing user or create one
            // Note: User model's 'hashed' cast handles hashing automatically.
            $user = User::where('email', $client->email)->first();
            if ($user) {
                $user->update(['password' => $password]);
            } else {
                $username = strtolower(explode(' ', $client->full_name)[0] . rand(100, 999));
                $user = User::create([
                    'name' => $client->full_name,
                    'email' => $client->email,
                    'username' => $username,
                    'password' => $password,
                    'role' => 'client'
                ]);
            }
            
            // 3. Update Client Record (Set to Active)
            $client->update([
                'user_id' => $user->id,
                'status' => 'active',
                'total_value' => $baseAmount,
                'email_verified_at' => $client->email_verified_at ?: now(),
                'verification_token' => null
            ]);

            // 4. Create Deferred Records
            // 4. Create Deferred Records and Calculate Totals
            if ($client->pending_data) {
                $pData = is_string($client->pending_data) ? json_decode($client->pending_data, true) : $client->pending_data;
                
                $currency = $pData['currency'] ?? 'USD';
                $exchangeRate = floatval($pData['exchange_rate'] ?? ExchangeRateService::getUsdToLkr());
                $isLkr = $currency === 'LKR';

                $totalUsd = 0;
                $serviceBreakdown = [];

                // Parse New Multi-Service Structure
                if (isset($pData['services']) && is_array($pData['services'])) {
                    $services = $pData['services'];
                    
                    // Override with admin negotiated services if provided
                    if ($request->has('services') && is_array($request->services)) {
                        $adminServices = $request->services;
                        if (isset($adminServices['development'])) {
                            $services['development']['negotiated_price'] = floatval($adminServices['development']['negotiated_price'] ?? 0);
                        }
                        if (isset($adminServices['hosting'])) {
                            $services['hosting']['negotiated_price'] = floatval($adminServices['hosting']['negotiated_price'] ?? 0);
                        }
                        if (isset($adminServices['management'])) {
                            $services['management']['negotiated_price'] = floatval($adminServices['management']['negotiated_price'] ?? 0);
                        }
                    }

                    // Development Project
                    if (!empty($services['development']['selected'])) {
                        $dev = $services['development'];
                        $orig = floatval($dev['original_price'] ?? 0);
                        $neg = floatval($dev['negotiated_price'] ?? $orig);
                        $totalUsd += $neg;
                        
                        $serviceBreakdown[] = [
                            'type' => 'Development',
                            'name' => $dev['project_name'] ?? 'Custom Project',
                            'original_usd' => $orig,
                            'negotiated_usd' => $neg
                        ];

                        \App\Models\Project::create([
                            'client_id' => $client->id,
                            'agent_id' => $client->agent_id,
                            'name' => $dev['project_name'] ?? 'Custom Project',
                            'description' => $dev['project_description'] ?? '',
                            'package' => 'Custom',
                            'total_value' => $orig,
                            'original_price' => $orig,
                            'negotiated_price' => $neg,
                            'final_price' => $neg,
                            'currency' => 'USD',
                            'advance_payment' => $dev['advance_payment'] ?? 0,
                            'status' => 'In Progress',
                            'progress' => 0,
                            'approval_status' => 'approved',
                            'approved_by' => $request->user()->id ?? null
                        ]);
                    }

                    // Hosting Service
                    if (!empty($services['hosting']['selected'])) {
                        $host = $services['hosting'];
                        $orig = floatval($host['original_price'] ?? 0);
                        $neg = floatval($host['negotiated_price'] ?? $orig);
                        $totalUsd += $neg;

                        $serviceBreakdown[] = [
                            'type' => 'Hosting',
                            'name' => $host['package_name'] ?? 'Starter Hosting',
                            'original_usd' => $orig,
                            'negotiated_usd' => $neg
                        ];

                        \App\Models\HostingAccount::create([
                            'client_id' => $client->id,
                            'domain_name' => $host['domain_name'] ?? 'N/A',
                            'package' => $host['package_name'] ?? 'Custom',
                            'expiry_date' => now()->addYear()->toDateString(),
                            'status' => 'active'
                        ]);

                        \App\Models\ServiceSubscription::create([
                            'client_id' => $client->id,
                            'service_type' => 'hosting',
                            'package_name' => $host['package_name'] ?? 'Custom',
                            'original_price' => $orig,
                            'negotiated_price' => $neg,
                            'final_price' => $neg,
                            'currency' => 'USD',
                            'billing_cycle' => 'yearly',
                            'status' => 'active',
                            'approved_by' => $request->user()->id ?? null
                        ]);
                    }

                    // Management Service
                    if (!empty($services['management']['selected'])) {
                        $mgmt = $services['management'];
                        $orig = floatval($mgmt['original_price'] ?? 0);
                        $neg = floatval($mgmt['negotiated_price'] ?? $orig);
                        $totalUsd += $neg;

                        $serviceBreakdown[] = [
                            'type' => 'Management',
                            'name' => $mgmt['package_name'] ?? 'Starter Management',
                            'original_usd' => $orig,
                            'negotiated_usd' => $neg
                        ];

                        \App\Models\Subscription::create([
                            'client_id' => $client->id,
                            'service_name' => 'Website Management',
                            'package' => $mgmt['package_name'] ?? 'Custom',
                            'expiry_date' => now()->addMonth()->toDateString(),
                            'status' => 'active'
                        ]);

                        \App\Models\ServiceSubscription::create([
                            'client_id' => $client->id,
                            'service_type' => 'management',
                            'package_name' => $mgmt['package_name'] ?? 'Custom',
                            'original_price' => $orig,
                            'negotiated_price' => $neg,
                            'final_price' => $neg,
                            'currency' => 'USD',
                            'billing_cycle' => 'monthly',
                            'status' => 'active',
                            'approved_by' => $request->user()->id ?? null
                        ]);
                    }
                } else {
                    // Legacy Fallback
                    $totalUsd = $baseAmount; 
                    if (!empty($pData['project_name'])) {
                        \App\Models\Project::create([
                            'client_id' => $client->id,
                            'agent_id' => $client->agent_id,
                            'name' => $pData['project_name'],
                            'package' => $pData['package_name'] ?? '',
                            'total_value' => $baseAmount,
                            'status' => 'In Progress'
                        ]);
                    }
                }

                // 5. Final Invoice Generation with Multi-Currency
                // IMPORTANT: Use the VAT/Tax rates locked in at deal submission time.
                // If the admin changes global rates later, held deals must not be re-priced.
                $vatPercentage = isset($pData['vat']) && $pData['vat'] !== '' && $pData['vat'] !== null
                    ? floatval($pData['vat'])
                    : floatval(\App\Models\Setting::get('default_vat_percentage', 0));
                $taxPercentage = isset($pData['tax']) && $pData['tax'] !== '' && $pData['tax'] !== null
                    ? floatval($pData['tax'])
                    : floatval(\App\Models\Setting::get('default_tax_percentage', 0));
                
                $vatUsd = ($totalUsd * $vatPercentage) / 100;
                $taxUsd = ($totalUsd * $taxPercentage) / 100;
                $grandTotalUsd = $totalUsd + $vatUsd + $taxUsd;

                $finalInvoiceAmount = $isLkr ? ($grandTotalUsd * $exchangeRate) : $grandTotalUsd;
                $finalVatAmount = $isLkr ? ($vatUsd * $exchangeRate) : $vatUsd;
                $finalTaxAmount = $isLkr ? ($taxUsd * $exchangeRate) : $taxUsd;

                $invoice = \App\Models\Invoice::create([
                    'client_id' => $client->id,
                    'invoice_number' => 'INV-' . strtoupper(uniqid()),
                    'amount' => $finalInvoiceAmount,
                    'vat' => $finalVatAmount,
                    'tax' => $finalTaxAmount,
                    'currency' => $currency,
                    'exchange_rate' => $isLkr ? $exchangeRate : 1,
                    'original_amount_usd' => $grandTotalUsd,
                    'converted_amount_lkr' => $isLkr ? $finalInvoiceAmount : null,
                    'service_breakdown' => json_encode($serviceBreakdown),
                    'due_date' => now()->addDays(7)->toDateString(),
                    'status' => $pData['payment_status'] ?? 'pending'
                ]);

                $baseAmount = $totalUsd; // Sync baseAmount with negotiated total for accurate commission
                
                // Update Client Total Value (Use USD Base)
                $client->update([
                    'total_value' => $totalUsd,
                    'pending_data' => null
                ]);
            }

            // 5. Commission recording
            $agent = \App\Models\Agent::where('user_id', $client->agent_id)->first();
            if ($agent) {
                $commissionPercentage = $agent->commission_rate ?: 25;
                $commissionAmount = ($baseAmount * $commissionPercentage) / 100;

                if ($commissionAmount > 0) {
                    // Standardize commission amount to match the invoice currency
                    $invoiceCurrency = isset($invoice) ? strtoupper($invoice->currency) : 'USD';
                    $invoiceRate = isset($invoice) ? floatval($invoice->exchange_rate) : ExchangeRateService::getUsdToLkr();
                    if ($invoiceRate <= 1) {
                        $invoiceRate = ExchangeRateService::getUsdToLkr();
                    }

                    if ($invoiceCurrency === 'LKR') {
                        $commissionAmount = $commissionAmount * $invoiceRate;
                    }

                    \App\Models\Commission::create([
                        'agent_id' => $agent->id,
                        'client_id' => $client->id,
                        'invoice_id' => $invoice->id ?? null,
                        'amount' => $commissionAmount,
                        'percentage' => $commissionPercentage,
                        'status' => 'pending',
                        'type' => 'direct'
                    ]);
                }
            }

            ActivityLog::log($request, 'CLIENT_APPROVED', "Admin approved client {$client->full_name}");

            // Send Approval Email to Client
            try {
                $username = isset($user) ? $user->username : $client->email;
                Mail::to($client->email)->send(new ClientApprovedMail($client, $username, $password));
            } catch (\Exception $e) {
                Log::error("Failed to send client approval email: " . $e->getMessage());
            }

            DB::commit();
            return response()->json([
                'message' => 'Client approved successfully!',
                'client' => $client
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Approval Error for client {$id}: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Admin: Reset a client's portal password.
     * POST /api/clients/{id}/change-password
     */
    public function changePassword(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        try {
            $client = Client::findOrFail($id);

            $user = User::where('email', $client->email)->first();
            if (!$user) {
                return response()->json(['error' => 'No user account linked to this client.'], 404);
            }

            // The User model's 'hashed' cast automatically hashes the plain-text password.
            $user->update(['password' => $request->password]);

            ActivityLog::log($request, 'CLIENT_PASSWORD_RESET',
                "Admin reset password for client {$client->full_name}");

            return response()->json(['message' => 'Client password updated successfully.']);
        } catch (\Exception $e) {
            Log::error('Client password change error: ' . $e->getMessage());
            return response()->json(['error' => 'Password update failed: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $client = Client::with('hostingAccounts')->find($id);
        if (!$client) return response()->json(['error' => 'Client not found'], 404);
        
        // Append domain_name to the response for the frontend
        $data = $client->toArray();
        $data['domain_name'] = $client->hostingAccounts->first() ? $client->hostingAccounts->first()->domain_name : 'N/A';
        
        return response()->json($data);
    }

    public function update(Request $request, $id)
    {
        try {
            $client = Client::find($id);
            if (!$client) return response()->json(['error' => 'Client not found'], 404);
            
            // Only update fields that exist in the clients table
            $validFields = [
                'full_name', 'email', 'phone', 'whatsapp', 
                'company_name', 'address', 'nic', 'status'
            ];
            
            $client->update($request->only($validFields));

            // Admin password override: if a new password is provided, update the linked user.
            // The User model's 'hashed' cast handles bcrypt hashing automatically.
            if ($request->filled('password')) {
                $user = User::where('email', $client->email)->first();
                if ($user) {
                    $user->password = $request->password;
                    $user->save();
                }
            }

            // If domain_name is provided, update the hosting account
            if ($request->filled('domain_name')) {
                \App\Models\HostingAccount::updateOrCreate(
                    ['client_id' => $client->id],
                    ['domain_name' => $request->domain_name]
                );
            }

            // If total_value changed, recalculate pending commission
            if ($request->filled('total_value')) {
                $commission = \App\Models\Commission::where('client_id', $client->id)
                    ->whereIn('status', ['pending', 'cancelled'])
                    ->latest()
                    ->first();
                if ($commission) {
                    $newAmount = floatval($request->total_value) * ($commission->percentage / 100);
                    $commission->update(['amount' => $newAmount]);
                }
            }

            return response()->json($client);
        } catch (\Exception $e) {
            Log::error('Client update error: ' . $e->getMessage());
            return response()->json(['error' => 'Update failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            // Find client first to get user_id if it's a client ID
            $client = Client::find($id);
            if ($client) {
                if ($client->user_id) {
                    User::where('id', $client->user_id)->delete();
                }
                $client->delete();
                return response()->json(['message' => 'Client deleted successfully']);
            }

            // If not found in clients, try users table
            $user = User::find($id);
            if ($user && $user->role === 'client') {
                Client::where('user_id', $user->id)->delete();
                $user->delete();
                return response()->json(['message' => 'Client user deleted successfully']);
            }

            return response()->json(['error' => 'Client not found'], 404);
        } catch (\Exception $e) {
            Log::error('Client Deletion Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Deletion failed due to related records',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
