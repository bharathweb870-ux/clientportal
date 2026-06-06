<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source')->default('payhere');
            $table->json('payload');
            $table->string('status')->default('received');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('webhook_logs');
    }
};