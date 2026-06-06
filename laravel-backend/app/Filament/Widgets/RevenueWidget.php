<?php

namespace App\Filament\Widgets;

use App\Models\Invoice;
use App\Models\Payment;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class RevenueWidget extends BaseWidget
{
    protected function getStats(): array
    {
        $totalRevenue = Payment::where('status', 'paid')->sum('amount');
        $pendingPayments = Payment::where('status', 'pending')->sum('amount');
        $activeProjects = \App\Models\Project::where('status', 'running')->count();

        return [
            Stat::make('Total Revenue', 'LKR ' . number_format($totalRevenue, 2))
                ->description('Total collected payments')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),
            Stat::make('Pending Payments', 'LKR ' . number_format($pendingPayments, 2))
                ->description('Outstanding invoices')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),
            Stat::make('Active Projects', $activeProjects)
                ->description('Ongoing web projects')
                ->descriptionIcon('heroicon-m-rocket-launch')
                ->color('primary'),
        ];
    }
}
