<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@webbuilders.lk',
            'password' => bcrypt('admin123'),
            'role'     => 'admin',
        ]);

        User::create([
            'name'     => 'Agent John',
            'email'    => 'agent@webbuilders.lk',
            'password' => bcrypt('agent123'),
            'role'     => 'agent',
        ]);

        User::create([
            'name'     => 'Client Company',
            'email'    => 'client@webbuilders.lk',
            'password' => bcrypt('client123'),
            'role'     => 'client',
        ]);
    }
}
