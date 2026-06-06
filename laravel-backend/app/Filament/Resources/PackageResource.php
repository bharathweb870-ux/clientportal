<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PackageResource\Pages;
use App\Models\Package;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PackageResource extends Resource
{
    protected static ?string $model = Package::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static ?string $navigationGroup = 'Settings';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Package Info')
                    ->schema([
                        Forms\Components\TextInput::make('name')->required(),
                        Forms\Components\Select::make('type')
                            ->options([
                                'hosting'    => 'Web Hosting',
                                'management' => 'Website Management',
                                'seo'        => 'SEO Services',
                                'dev'        => 'Web Development',
                                'smm'        => 'Social Media Marketing',
                                'rental'     => 'Website Rental',
                            ])->required(),
                        Forms\Components\TextInput::make('price')->numeric()->prefix('LKR')->required(),
                        Forms\Components\Toggle::make('is_active')->default(true),
                        Forms\Components\Textarea::make('description')->columnSpanFull(),
                    ])->columns(2),

                Forms\Components\Section::make('Features')
                    ->schema([
                        Forms\Components\Repeater::make('features')
                            ->schema([
                                Forms\Components\TextInput::make('text')->required()->label('Feature Text'),
                                Forms\Components\Toggle::make('included')->default(true)->label('Included'),
                            ])
                            ->columns(2)
                            ->label('Key Features List')
                    ])
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable(),
                Tables\Columns\TextColumn::make('type')->badge(),
                Tables\Columns\TextColumn::make('price')->money('LKR'),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPackages::route('/'),
            'create' => Pages\CreatePackage::route('/create'),
            'edit' => Pages\EditPackage::route('/{record}/edit'),
        ];
    }
}
