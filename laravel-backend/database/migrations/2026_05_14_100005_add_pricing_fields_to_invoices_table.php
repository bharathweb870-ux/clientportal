<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('exchange_rate', 10, 4)->nullable()->after('currency');
            $table->decimal('original_amount_usd', 15, 2)->nullable()->after('amount');
            $table->decimal('converted_amount_lkr', 15, 2)->nullable()->after('original_amount_usd');
            $table->text('service_breakdown')->nullable()->after('status');
        });
    }

    public function down()
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'original_amount_usd', 'converted_amount_lkr', 'service_breakdown']);
        });
    }
};
