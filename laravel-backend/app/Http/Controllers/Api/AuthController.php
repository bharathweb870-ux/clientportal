<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // Model 'hashed' cast auto-bcrypts plain text
        ]);

        return response()->json(['user' => $user], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $throttleKey = strtolower($request->input('email')) . '|' . $request->ip();

        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = \Illuminate\Support\Facades\RateLimiter::availableIn($throttleKey);
            \App\Models\ActivityLog::log($request, 'LOGIN_THROTTLED', "User blocked for {$seconds}s due to too many attempts");
            return response()->json([
                'message' => "Too many login attempts. Please try again in {$seconds} seconds."
            ], 429);
        }

        if (Auth::attempt($request->only('email', 'password'))) {
            \Illuminate\Support\Facades\RateLimiter::clear($throttleKey);
            $user = Auth::user();
            $token = $user->createToken('API Token')->plainTextToken;

            \App\Models\ActivityLog::log($request, 'LOGIN', "User logged in as {$user->role}");

            return response()->json(['token' => $token, 'access_token' => $token, 'user' => $user]);
        }

        \Illuminate\Support\Facades\RateLimiter::hit($throttleKey, 60);
        \App\Models\ActivityLog::log($request, 'LOGIN_FAILED', "Failed login attempt for email: {$request->email}");

        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    public function logout(Request $request)
    {
        if (Auth::check()) {
            \App\Models\ActivityLog::log($request, 'LOGOUT', "User logged out");
            Auth::user()->tokens()->delete();
        }

        return response()->json(['message' => 'Successfully logged out']);
    }
}