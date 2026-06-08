<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use App\Models\Client;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    /**
     * List all tickets for the logged-in client (or all for admin/agent).
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'client') {
            $client = Client::where('user_id', $user->id)->first()
                   ?? Client::where('email', $user->email)->first();

            if (!$client) return response()->json([]);

            $tickets = SupportTicket::where('client_id', $client->id)
                ->orderByDesc('created_at')
                ->get();
        } else {
            $tickets = SupportTicket::with('client')
                ->orderByDesc('created_at')
                ->get();
        }

        return response()->json($tickets);
    }

    /**
     * Create a new support ticket.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $client = Client::where('user_id', $user->id)->first()
               ?? Client::where('email', $user->email)->first();

        if (!$client) {
            return response()->json(['message' => 'Client profile not found.'], 404);
        }

        $validated = $request->validate([
            'subject'     => 'required|string|max:255',
            'description' => 'required|string',
            'service'     => 'nullable|string|max:255',
            'priority'    => 'nullable|string|in:standard,high,critical',
        ]);

        $ticket = SupportTicket::create([
            'client_id'   => $client->id,
            'subject'     => $validated['subject'],
            'description' => $validated['description'],
            'service'     => $validated['service'] ?? null,
            'priority'    => $validated['priority'] ?? 'standard',
            'status'      => 'open',
            'ticket_number' => 'TKT-' . strtoupper(substr(uniqid(), -6)),
        ]);

        return response()->json($ticket, 201);
    }

    /**
     * Update ticket status (admin only).
     */
    public function update(Request $request, $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $ticket->update($request->only(['status']));
        return response()->json($ticket);
    }
}
