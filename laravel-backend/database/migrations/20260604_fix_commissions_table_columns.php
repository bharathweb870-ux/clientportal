<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('commissions', function (Blueprint $table) {
            if (!Schema::hasColumn('commissions', 'client_id')) {
                $table->foreignId('client_id')->nullable()->after('agent_id')->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('commissions', 'percentage')) {
                $table->decimal('percentage', 5, 2)->default(0)->after('amount');
            }
            if (!Schema::hasColumn('commissions', 'status')) {
                $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending')->after('percentage');
            }
            if (!Schema::hasColumn('commissions', 'type')) {
                $table->string('type')->default('direct')->after('status');
            }
            if (!Schema::hasColumn('commissions', 'earned_at')) {
                $table->timestamp('earned_at')->useCurrent()->after('type');
            }
        });
    }

    public function down()
    {
        Schema::table('commissions', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('commissions', 'client_id')) {
                $table->dropForeign(['client_id']);
                $cols[] = 'client_id';
            }
            if (Schema::hasColumn('commissions', 'percentage')) $cols[] = 'percentage';
            if (Schema::hasColumn('commissions', 'status')) $cols[] = 'status';
            if (Schema::hasColumn('commissions', 'type')) $cols[] = 'type';
            if (Schema::hasColumn('commissions', 'earned_at')) $cols[] = 'earned_at';
            
            if (!empty($cols)) $table->dropColumn($cols);
        });
    }
};
