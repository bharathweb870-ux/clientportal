<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('activity_logs', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->unsignedBigInteger('user_id')->nullable();
            $blueprint->string('user_email')->nullable();
            $blueprint->string('action'); // e.g. 'LOGIN', 'CLIENT_REGISTERED', 'CLIENT_APPROVED'
            $blueprint->string('role'); // admin, agent, client
            $blueprint->text('description')->nullable();
            $blueprint->string('ip_address')->nullable();
            $blueprint->string('user_agent')->nullable();
            $blueprint->json('metadata')->nullable();
            $blueprint->timestamps();

            $blueprint->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('activity_logs');
    }
};
