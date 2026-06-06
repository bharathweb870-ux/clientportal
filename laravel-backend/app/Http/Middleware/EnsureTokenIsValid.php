<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTokenIsValid
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('Authorization');

        if (!$token || !$this->isValidToken($token)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }

    private function isValidToken($token)
    {
        // Implement your token validation logic here
        return true; // Placeholder for actual validation
    }
}