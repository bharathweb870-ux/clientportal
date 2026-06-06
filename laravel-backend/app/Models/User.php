<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        // NOTE: Password hashing is handled by the setPasswordAttribute mutator below.
        // Do NOT add 'password' => 'hashed' here — the mutator is the single source of truth.
    ];

    /**
     * Mutator: Always store a bcrypt hash, never a plain-text or double-hashed password.
     * - If plain text is passed  → hashes it with bcrypt.
     * - If a bcrypt hash is passed (e.g. Hash::make() was called by mistake) → stores as-is.
     * This is the single enforcer — safe no matter what controllers pass in.
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = Hash::isHashed($value)
            ? $value
            : Hash::make($value);
    }
}