<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('service_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('service_type'); // 'hosting', 'management'
            $table->string('package_name');
            $table->decimal('original_price', 15, 2)->default(0);
            $table->decimal('negotiated_price', 15, 2)->nullable();
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('final_price', 15, 2)->default(0);
            $table->string('currency')->default('USD');
            $table->string('billing_cycle')->default('monthly'); // 'monthly', 'yearly'
            
            $table->string('status')->default('pending'); // 'pending', 'approved', 'active', 'rejected'
            $table->text('approval_notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_subscriptions');
    }
};
