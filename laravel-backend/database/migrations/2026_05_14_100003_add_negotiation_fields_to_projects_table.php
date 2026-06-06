<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->decimal('original_price', 15, 2)->nullable()->after('total_value');
            $table->decimal('negotiated_price', 15, 2)->nullable()->after('original_price');
            $table->decimal('discount_amount', 15, 2)->nullable()->after('negotiated_price');
            $table->decimal('final_price', 15, 2)->nullable()->after('discount_amount');
            $table->string('currency')->default('USD')->after('final_price');
            
            $table->string('approval_status')->default('approved')->after('status');
            $table->text('approval_notes')->nullable()->after('approval_status');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null')->after('approval_notes');
        });
    }

    public function down()
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'original_price', 'negotiated_price', 'discount_amount', 'final_price', 'currency',
                'approval_status', 'approval_notes', 'approved_by'
            ]);
        });
    }
};
