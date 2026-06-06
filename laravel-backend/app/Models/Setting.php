<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value', 'type'];

    public static function get($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) return $default;

        $value = $setting->value;
        switch ($setting->type) {
            case 'float':
            case 'decimal':
                return (float) $value;
            case 'int':
            case 'integer':
                return (int) $value;
            case 'bool':
            case 'boolean':
                return (bool) $value;
            default:
                return $value;
        }
    }

    public static function set($key, $value, $type = 'string')
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => (string) $value, 'type' => $type]
        );
    }
}
