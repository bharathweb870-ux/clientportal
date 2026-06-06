<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'service_type',
        'package_name',
        'original_price',
        'negotiated_price',
        'discount_amount',
        'final_price',
        'currency',
        'billing_cycle',
        'status',
        'approval_notes',
        'approved_by',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
