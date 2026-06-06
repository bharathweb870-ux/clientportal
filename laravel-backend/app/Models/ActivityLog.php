<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_email',
        'action',
        'role',
        'description',
        'ip_address',
        'user_agent',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper to log an action easily
     */
    public static function log($request, $action, $description = null, $metadata = [])
    {
        $user = $request->user();
        
        return self::create([
            'user_id' => $user ? $user->id : null,
            'user_email' => $user ? $user->email : ($request->email ?? null),
            'action' => $action,
            'role' => $user ? $user->role : 'guest',
            'description' => $description,
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'metadata' => $metadata
        ]);
    }
}
