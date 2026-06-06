<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('package')->nullable();
            $table->decimal('total_value', 10, 2)->nullable();
            $table->decimal('advance_payment', 10, 2)->nullable();
            $table->string('status')->default('In Progress');
            $table->integer('progress')->default(0);
            $table->string('deadline')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('projects');
    }
};