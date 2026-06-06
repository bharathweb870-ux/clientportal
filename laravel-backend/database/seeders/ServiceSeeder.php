<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            ['name' => 'Web Design & Development', 'description' => 'Professional web development services'],
            ['name' => 'Website Management', 'description' => 'Ongoing website maintenance and updates'],
            ['name' => 'Social Media Management', 'description' => 'Managing your social presence'],
            ['name' => 'Search Engine Optimization', 'description' => 'Improving search rankings'],
            ['name' => 'Hosting & Domain', 'description' => 'Server and domain management'],
            ['name' => 'Web Technical Support', 'description' => '24/7 technical assistance'],
            ['name' => 'Content Writing', 'description' => 'Professional content creation'],
            ['name' => 'Reseller Program', 'description' => 'Partner with us and earn'],
            ['name' => 'Startup Funding Program', 'description' => 'Helping startups grow'],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['name' => $service['name']], $service);
        }
    }
}
