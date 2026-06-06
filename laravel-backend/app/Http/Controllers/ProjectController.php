<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Project::with('client');
        
        if ($user && $user->role === 'agent') {
            $query->where('agent_id', $user->id);
        } elseif ($user && $user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first() 
                   ?? \App\Models\Client::where('email', $user->email)->first();
            $clientId = $client ? $client->id : -1;
            $query->where('client_id', $clientId);
        }

        return response()->json(
            $query->get()->map(fn($p) => [
                'id'             => $p->id,
                'name'           => $p->name,
                'description'    => $p->description,
                'package'        => $p->package,
                'total_value'    => $p->total_value,
                'advance_payment'=> $p->advance_payment,
                'status'         => $p->status,
                'progress'       => $p->progress,
                'deadline'       => $p->deadline,
                'renewal_date'   => $p->renewal_date,
                'approval_status' => $p->approval_status,
                'approval_notes'  => $p->approval_notes,
                'original_price'  => $p->original_price,
                'negotiated_price'=> $p->negotiated_price,
                'discount_amount' => $p->discount_amount,
                'final_price'     => $p->final_price,
                'currency'        => $p->currency,
                'client_id'      => $p->client_id,
                'client_name'    => $p->client ? $p->client->full_name : null,
                'created_at'     => $p->created_at,
            ])
        );
    }

    public function store(Request $request)
    {
        $validFields = [
            'client_id', 'agent_id', 'name', 'description', 
            'package', 'total_value', 'advance_payment', 
            'status', 'progress', 'deadline',
            'renewal_date',
            'original_price', 'negotiated_price', 'discount_amount', 'final_price',
            'currency', 'approval_status', 'approval_notes'
        ];
        
        $project = Project::create($request->only($validFields));
        return response()->json($project, 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $p = Project::with('client')->find($id);
        if (!$p) return response()->json(['error' => 'Project not found'], 404);

        // Security: Ensure the user is authorized to view this project
        if ($user->role === 'agent' && $p->agent_id != $user->id) {
            return response()->json(['error' => 'Unauthorized access to this project'], 403);
        }

        if ($user->role === 'client') {
            $client = \App\Models\Client::where('user_id', $user->id)->first() 
                   ?? \App\Models\Client::where('email', $user->email)->first();
            if (!$client || $p->client_id != $client->id) {
                return response()->json(['error' => 'Unauthorized access to this project'], 403);
            }
        }
        
        return response()->json([
            'id'             => $p->id,
            'name'           => $p->name,
            'description'    => $p->description,
            'package'        => $p->package,
            'total_value'    => $p->total_value,
            'advance_payment'=> $p->advance_payment,
            'status'         => $p->status,
            'progress'       => $p->progress,
            'deadline'       => $p->deadline,
            'renewal_date'   => $p->renewal_date,
            'approval_status' => $p->approval_status,
            'approval_notes'  => $p->approval_notes,
            'original_price'  => $p->original_price,
            'negotiated_price'=> $p->negotiated_price,
            'discount_amount' => $p->discount_amount,
            'final_price'     => $p->final_price,
            'currency'        => $p->currency,
            'client_id'      => $p->client_id,
            'client_name'    => $p->client ? $p->client->full_name : null,
            'created_at'     => $p->created_at,
        ]);
    }

    public function update(Request $request, $id)
    {
        try {
            $project = Project::find($id);
            if (!$project) return response()->json(['error' => 'Project not found'], 404);

            $validFields = [
                'client_id', 'agent_id', 'name', 'description',
                'package', 'total_value', 'advance_payment',
                'status', 'progress', 'deadline',
                'renewal_date',
                'original_price', 'negotiated_price', 'discount_amount', 'final_price',
                'currency', 'approval_status', 'approval_notes'
            ];

            $project->update($request->only($validFields));
            $this->syncWebsiteOrderInvoice($project);

            // If price fields changed, recalculate pending commission for this project's client
            if ($request->hasAny(['total_value', 'final_price', 'negotiated_price'])) {
                $this->syncProjectCommission($project);
            }

            return response()->json($project);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Update failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $project = Project::find($id);
            if (!$project) return response()->json(['error' => 'Project not found'], 404);

            // If this is a website order, cancel the linked unpaid invoice
            // so the client is not left with a ghost pending charge
            if (str_starts_with($project->name ?? '', 'Website Order -')) {
                \App\Models\Invoice::where('client_id', $project->client_id)
                    ->whereIn('status', ['pending', 'Pending'])
                    ->where('service_breakdown', 'like', '%"project_id":' . $project->id . '%')
                    ->update(['status' => 'cancelled']);
            }

            $project->delete();
            return response()->json(['message' => 'Project deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Deletion failed due to related records',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function upgrade(Request $request, $id)
    {
        try {
            $type = $request->type;
            $service = null;
            $name = "";

            if ($type === 'Hosting' || $type === 'Management') {
                $service = \App\Models\ServiceSubscription::find($id);
                $name = $type === 'Hosting' ? 'Website Hosting' : 'Website Management';
            } else {
                $service = Project::find($id);
                $name = $service ? $service->name : "";
            }

            if (!$service) return response()->json(['error' => 'Service not found'], 404);

            $user = $request->user();
            $client = \App\Models\Client::where('user_id', $user->id)->first()
                ?? \App\Models\Client::where('email', $user->email)->first();

            if (!$client || (int) $service->client_id !== (int) $client->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $newPackage = $request->package;
            $currentPackage = ($type === 'Hosting' || $type === 'Management') ? $service->package_name : $service->package;

            // If it's the SAME package, it's a renewal (Automatic)
            if ($currentPackage === $newPackage) {
                \App\Models\ActivityLog::log($request, 'SERVICE_RENEWAL', 
                    "Service '{$name}' renewed for '{$newPackage}' by client.");
                return response()->json([
                    'message' => "Successfully renewed {$newPackage}. No approval needed.",
                    'service' => $service
                ]);
            }

            // If it's a DIFFERENT package, it's an upgrade (Request + Payment)
            $package = \App\Models\Package::where('name', $newPackage)
                ->where('type', $type === 'Hosting' ? 'hosting' : 'management')
                ->first();
            $price = $package ? $package->price : 0;
            // Fallback: use current service price if no package row matched
            if (!$price && ($type === 'Hosting' || $type === 'Management')) {
                $price = $service->final_price ?? $service->negotiated_price ?? 0;
            }

            // Create a pending invoice for the upgrade
            $invoice = \App\Models\Invoice::create([
                'client_id' => $service->client_id,
                'invoice_number' => 'UPG-' . strtoupper(substr(uniqid(), -6)),
                'amount' => $price,
                'currency' => 'USD',
                'status' => 'pending',
                'due_date' => now()->addDays(3)->toDateString(),
                'service_breakdown' => "Upgrade '{$name}' to {$newPackage}"
            ]);

            // We store the pending upgrade intent in a session or a temporary field if needed, 
            // but for now, we'll assume payment completion triggers the update via webhook.
            // Let's store it in a metadata field if available or just the description.

            \App\Models\ActivityLog::log($request, 'UPGRADE_INVOICED', 
                "Generated upgrade invoice #{$invoice->invoice_number} for '{$name}' to '{$newPackage}'.");

            return response()->json([
                'message' => "Upgrade invoice generated. Please complete payment to activate.",
                'invoice_id' => $invoice->id,
                'requires_payment' => true,
                'service' => $service
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Upgrade failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function approveUpgrade(Request $request, $id)
    {
        try {
            $project = Project::find($id);
            if (!$project) return response()->json(['error' => 'Project not found'], 404);

            if (!$project->pending_package) {
                return response()->json(['error' => 'No pending upgrade found'], 400);
            }

            $oldPackage = $project->package;
            $newPackage = $project->pending_package;

            $project->update([
                'package' => $newPackage,
                'pending_package' => null
            ]);

            \App\Models\ActivityLog::log($request, 'UPGRADE_APPROVED', 
                "Admin approved upgrade for '{$project->name}' from '{$oldPackage}' to '{$newPackage}'.");

            return response()->json([
                'message' => "Upgrade to {$newPackage} approved successfully.",
                'project' => $project
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Approval failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function approveWebsiteOrder(Request $request, $id)
    {
        try {
            $project = Project::find($id);
            if (!$project) return response()->json(['error' => 'Project not found'], 404);

            if (!str_starts_with($project->name ?? '', 'Website Order -')) {
                return response()->json(['error' => 'This project is not a website order'], 400);
            }

            $project->update([
                'status' => 'In Progress',
                'progress' => $project->progress ?? 0,
                'approval_status' => 'approved',
                'approval_notes' => $request->approval_notes ?? 'Approved by admin.',
                'approved_by' => $request->user()->id ?? null,
            ]);

            $this->syncWebsiteOrderInvoice($project);

            \App\Models\ActivityLog::log($request, 'WEBSITE_ORDER_APPROVED',
                "Admin approved website order '{$project->name}'.");

            return response()->json([
                'message' => 'Website order approved successfully.',
                'project' => $project
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Approval failed', 'message' => $e->getMessage()], 500);
        }
    }

    private function syncProjectCommission(Project $project): void
    {
        // Find commission linked via invoice for this client
        $invoice = \App\Models\Invoice::where('client_id', $project->client_id)
            ->whereIn('status', ['pending', 'paid'])
            ->latest()
            ->first();

        if (!$invoice) return;

        $commission = \App\Models\Commission::where('invoice_id', $invoice->id)
            ->whereIn('status', ['pending', 'cancelled'])
            ->first();

        if (!$commission) return;

        $baseAmount = $project->final_price ?? $project->negotiated_price ?? $project->total_value ?? 0;
        $newAmount = $baseAmount * ($commission->percentage / 100);
        $commission->update(['amount' => $newAmount]);
    }

    private function syncWebsiteOrderInvoice(Project $project): void
    {
        if (!str_starts_with($project->name ?? '', 'Website Order -')) {
            return;
        }

        $invoice = \App\Models\Invoice::where('client_id', $project->client_id)
            ->where('service_breakdown', 'like', '%"project_id":' . $project->id . '%')
            ->latest()
            ->first();

        if (!$invoice) {
            return;
        }

        $invoice->update([
            'amount' => $project->total_value ?? $invoice->amount,
        ]);
    }
}
