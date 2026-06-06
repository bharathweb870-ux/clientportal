<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        try {
            return response()->json(Setting::all());
        } catch (\Exception $e) {
            Log::error('Settings fetch error: ' . $e->getMessage());
            return response()->json([], 200);
        }
    }

    public function store(Request $request)
    {
        try {
            // Only admin can update settings
            $user = $request->user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $settings = $request->input('settings');
            if (!is_array($settings)) {
                return response()->json(['error' => 'Settings must be an array'], 422);
            }

            foreach ($settings as $key => $value) {
                $type = is_numeric($value) ? 'float' : 'string';
                Setting::set($key, $value, $type);
            }

            return response()->json(['message' => 'Settings updated successfully']);
        } catch (\Exception $e) {
            Log::error('Settings update error: ' . $e->getMessage());
            return response()->json(['error' => 'Update failed', 'message' => $e->getMessage()], 500);
        }
    }

    public function getDefaults()
    {
        try {
            return response()->json([
                'default_vat_percentage' => Setting::get('default_vat_percentage', 0),
                'default_tax_percentage' => Setting::get('default_tax_percentage', 0),
            ]);
        } catch (\Exception $e) {
            Log::error('Settings defaults error: ' . $e->getMessage());
            return response()->json([
                'default_vat_percentage' => 0,
                'default_tax_percentage' => 0,
            ]);
        }
    }
}
