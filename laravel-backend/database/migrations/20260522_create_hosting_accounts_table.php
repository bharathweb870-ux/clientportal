<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('hosting_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('domain_name');
            $table->string('package')->nullable();
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->string('server_ip')->nullable();
            $table->string('status')->default('active');
            $table->date('expiry_date')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('hosting_accounts');
    }
};