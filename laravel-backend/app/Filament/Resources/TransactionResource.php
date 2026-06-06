<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TransactionResource\Pages;
use App\Models\Transaction;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TransactionResource extends Resource
{
    protected static ?string $model = Transaction::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';
    
    protected static ?string $navigationGroup = 'Financial Management';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Card::make()
                    ->schema([
                        Forms\Components\Select::make('invoice_id')
                            ->relationship('invoice', 'invoice_number')
                            ->required(),
                        Forms\Components\TextInput::make('amount')
                            ->numeric()
                            ->prefix('LKR')
                            ->required(),
                        Forms\Components\Select::make('payment_method')
                            ->options([
                                'online' => 'Online Payment',
                                'cash' => 'Cash/Direct',
                                'bank' => 'Bank Transfer',
                            ])
                            ->required(),
                        Forms\Components\TextInput::make('reference_id')
                            ->maxLength(255),
                    ])->columns(2)
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('invoice.invoice_number')->searchable(),
                Tables\Columns\TextColumn::make('amount')->money('LKR'),
                Tables\Columns\TextColumn::make('payment_method'),
                Tables\Columns\TextColumn::make('reference_id')->searchable(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTransactions::route('/'),
            'create' => Pages\CreateTransaction::route('/create'),
        ];
    }
}
