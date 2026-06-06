<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ClientResource\Pages;
use App\Models\Client;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ClientResource extends Resource
{
    protected static ?string $model = Client::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-plus';
    
    protected static ?string $navigationGroup = 'User Management';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Tabs::make('Registration Form')
                    ->tabs([
                        Forms\Components\Tabs\Tab::make('Client Details')
                            ->icon('heroicon-o-user')
                            ->schema([
                                Forms\Components\TextInput::make('full_name')->required()->label('Full Name'),
                                Forms\Components\TextInput::make('nic')->label('NIC Number'),
                                Forms\Components\TextInput::make('company_name')->label('Company Name'),
                                Forms\Components\TextInput::make('address')->label('Address'),
                                Forms\Components\TextInput::make('email')->email()->required(),
                                Forms\Components\TextInput::make('phone')->tel(),
                                Forms\Components\TextInput::make('whatsapp')->tel()->label('WhatsApp Number'),
                            ])->columns(2),

                        Forms\Components\Tabs\Tab::make('Domain & Hosting')
                            ->icon('heroicon-o-globe-alt')
                            ->schema([
                                Forms\Components\Group::make()->schema([
                                    Forms\Components\Placeholder::make('Domain Details'),
                                    Forms\Components\TextInput::make('domain_name'),
                                    Forms\Components\TextInput::make('domain_provider'),
                                    Forms\Components\DatePicker::make('domain_start_date'),
                                    Forms\Components\DatePicker::make('domain_expiry_date'),
                                    Forms\Components\TextInput::make('domain_login_url'),
                                    Forms\Components\TextInput::make('domain_username'),
                                    Forms\Components\TextInput::make('domain_password')->password(),
                                ])->columns(2),

                                Forms\Components\Group::make()->schema([
                                    Forms\Components\Placeholder::make('Server Details'),
                                    Forms\Components\TextInput::make('hosting_provider'),
                                    Forms\Components\TextInput::make('hosting_package'),
                                    Forms\Components\DatePicker::make('hosting_start_date'),
                                    Forms\Components\DatePicker::make('hosting_expiry_date'),
                                    Forms\Components\TextInput::make('hosting_login_url'),
                                    Forms\Components\TextInput::make('hosting_username'),
                                    Forms\Components\TextInput::make('hosting_password')->password(),
                                ])->columns(2),
                            ]),

                        Forms\Components\Tabs\Tab::make('Project & Payments')
                            ->icon('heroicon-o-briefcase')
                            ->schema([
                                Forms\Components\TextInput::make('project_name'),
                                Forms\Components\Textarea::make('project_description')->columnSpanFull(),
                                Forms\Components\TextInput::make('timeline')->placeholder('e.g. 3 Months'),
                                
                                Forms\Components\Separator::make('Payment Info')->columnSpanFull(),
                                Forms\Components\TextInput::make('advance_payment')->numeric()->prefix('LKR'),
                                Forms\Components\TextInput::make('balance_payment')->numeric()->prefix('LKR'),
                                Forms\Components\TextInput::make('installment_payment')->numeric()->prefix('LKR'),
                                Forms\Components\DatePicker::make('due_date'),
                                Forms\Components\Select::make('payment_status')
                                    ->options([
                                        'paid' => 'Paid',
                                        'pending' => 'Pending',
                                        'overdue' => 'Overdue',
                                    ])->default('pending'),
                            ])->columns(2),

                        Forms\Components\Tabs\Tab::make('Legal & Attachments')
                            ->icon('heroicon-o-document-check')
                            ->schema([
                                Forms\Components\FileUpload::make('registration_form_scan')
                                    ->label('Upload Scanned Paper Form')
                                    ->disk('public')
                                    ->directory('clients/forms'),
                                Forms\Components\FileUpload::make('nic_copy')
                                    ->label('NIC Copy Attachment')
                                    ->disk('public')
                                    ->directory('clients/nic'),
                                Forms\Components\Placeholder::make('digital_signature')
                                    ->label('Digital Signature Status')
                                    ->content('Digital Signature will be captured during client onboarding.'),
                            ])->columns(2),

                        Forms\Components\Tabs\Tab::make('Other Services')
                            ->icon('heroicon-o-plus-circle')
                            ->schema([
                                Forms\Components\CheckboxList::make('other_services')
                                    ->options([
                                        'seo' => 'SEO',
                                        'app_dev' => 'App Development',
                                        'social_media' => 'Social Media Management',
                                        'pos' => 'POS Systems',
                                        'rental' => 'Website Rental',
                                    ])->columns(3),
                                Forms\Components\Select::make('agent_id')
                                    ->relationship('agent', 'user_id')
                                    ->getOptionLabelFromRecordUsing(fn ($record) => $record->user?->name ?? "Agent #{$record->id}")
                                    ->label('Assigned Agent')
                                    ->searchable()
                                    ->preload(),
                            ]),
                    ])->columnSpanFull()
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('full_name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('company_name')->searchable(),
                Tables\Columns\TextColumn::make('email')->searchable(),
                Tables\Columns\TextColumn::make('phone'),
                Tables\Columns\BadgeColumn::make('payment_status')
                    ->colors([
                        'success' => 'paid',
                        'warning' => 'pending',
                        'danger' => 'overdue',
                    ]),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListClients::route('/'),
            'create' => Pages\CreateClient::route('/create'),
            'edit' => Pages\EditClient::route('/{record}/edit'),
        ];
    }
}
