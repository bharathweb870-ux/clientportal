<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = ActivityLog::orderBy('created_at', 'desc')
            ->limit(100)
            ->get();
            
        return response()->json($logs);
    }
}
