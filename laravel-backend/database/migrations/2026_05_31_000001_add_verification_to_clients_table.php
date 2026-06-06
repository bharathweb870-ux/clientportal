<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('clients', function (Blueprint $blueprint) {
            $blueprint->string('verification_token')->nullable()->after('email');
            $blueprint->timestamp('email_verified_at')->nullable()->after('verification_token');
        });
    }

    public function down()
    {
        Schema::table('clients', function (Blueprint $blueprint) {
            $blueprint->dropColumn(['verification_token', 'email_verified_at']);
        });
    }
};
