<?php

namespace App\Filament\Widgets;

use App\Models\Subscription;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class UpcomingRenewalsWidget extends BaseWidget
{
    protected static ?int $sort = 3;
    
    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Subscription::where('status', 'active')
                    ->where('renews_at', '>=', now())
                    ->orderBy('renews_at')
                    ->limit(5)
            )
            ->columns([
                Tables\Columns\TextColumn::make('client.name')->label('Client'),
                Tables\Columns\TextColumn::make('service.name')->label('Service'),
                Tables\Columns\TextColumn::make('renews_at')
                    ->label('Renewal Date')
                    ->date()
                    ->sortable(),
                Tables\Columns\BadgeColumn::make('status')->color('success'),
            ]);
    }
}
