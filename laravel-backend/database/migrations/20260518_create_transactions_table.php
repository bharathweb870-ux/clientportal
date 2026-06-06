<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained();
            $table->string('txn_id')->unique();
            $table->string('payment_reference')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('LKR');
            $table->string('method');
            $table->string('status');  // paid/failed/pending/cancelled/refunded
            $table->json('gateway_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transactions');
    }
};