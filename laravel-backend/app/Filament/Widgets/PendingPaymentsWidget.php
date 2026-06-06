<?php

namespace App\Filament\Widgets;

use App\Models\Payment;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class PendingPaymentsWidget extends BaseWidget
{
    protected static ?int $sort = 2;
    
    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Payment::where('status', 'pending')->latest()->limit(5)
            )
            ->columns([
                Tables\Columns\TextColumn::make('client.name')->label('Client'),
                Tables\Columns\TextColumn::make('amount')->money('LKR'),
                Tables\Columns\TextColumn::make('due_date')->date(),
                Tables\Columns\BadgeColumn::make('status')->color('warning'),
            ]);
    }
}
