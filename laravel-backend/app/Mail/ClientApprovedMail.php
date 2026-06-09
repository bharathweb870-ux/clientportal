<?php

namespace App\Mail;

use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ClientApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $client;
    public $username;
    public $password;

    public function __construct(Client $client, string $username, string $password)
    {
        $this->client = $client;
        $this->username = $username;
        $this->password = $password;
    }

    public function build()
    {
        $loginUrl = env('FRONTEND_URL', 'https://portal.crm.webbuilders.lk');
        return $this->subject('Your WebBuilders Account is Approved!')
                    ->html("
                        <h2>Congratulations! Your account has been approved.</h2>
                        <p>Dear {$this->client->full_name},</p>
                        <p>Your portal client account at WebBuilders CRM is now active. You can log in to view your invoices, projects, and manage services.</p>
                        
                        <div style='background:#f4f4f4;padding:15px;border-radius:8px;margin:15px 0;'>
                            <p style='margin:0 0 8px 0;'><strong>Login Portal:</strong> <a href='{$loginUrl}'>{$loginUrl}</a></p>
                            <p style='margin:0 0 8px 0;'><strong>Username / Email:</strong> {$this->client->email}</p>
                            <p style='margin:0;'><strong>Password:</strong> {$this->password}</p>
                        </div>

                        <p><a href='{$loginUrl}' style='display:inline-block;background:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Log In to Client Portal</a></p>
                        <br>
                        <p>Best regards,<br>WebBuilders Team</p>
                    ");
    }
}
