<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Package;

class HostingPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name'        => 'Starter Package',
                'type'        => 'hosting',
                'price'       => 60.00,
                'description' => 'Unmanaged Server',
                'is_active'   => true,
                'features'    => [
                    ['text' => 'Domain Registration Support',   'included' => true],
                    ['text' => '05GB NVMe SSD Storage',         'included' => true],
                    ['text' => 'Shared Server',                 'included' => true],
                    ['text' => '03GB Ram',                      'included' => true],
                    ['text' => 'Single Website',                'included' => true],
                    ['text' => 'LiteSpeed + LSCache',           'included' => true],
                    ['text' => 'Unlimited Bandwidth',           'included' => true],
                    ['text' => 'FREE SSL Certificates For Life','included' => true],
                    ['text' => '15MB IO',                       'included' => true],
                    ['text' => '300% CPU Power',                'included' => true],
                    ['text' => 'File Access',                   'included' => true],
                    ['text' => 'Error Fixing',                  'included' => false],
                ],
            ],
            [
                'name'        => 'Light Package',
                'type'        => 'hosting',
                'price'       => 120.00,
                'description' => 'Managed Server',
                'is_active'   => true,
                'features'    => [
                    ['text' => 'Domain Registration Support',   'included' => true],
                    ['text' => 'Unlimited SSD Storage',         'included' => true],
                    ['text' => 'Shared Server',                 'included' => true],
                    ['text' => '03GB Ram',                      'included' => true],
                    ['text' => '2 Websites',                    'included' => true],
                    ['text' => 'LiteSpeed + LSCache',           'included' => true],
                    ['text' => 'Unlimited Bandwidth',           'included' => true],
                    ['text' => 'FREE SSL Certificates For Life','included' => true],
                    ['text' => '15MB IO',                       'included' => true],
                    ['text' => '300% CPU Power',                'included' => true],
                    ['text' => 'File Access',                   'included' => true],
                    ['text' => 'Error Fixing',                  'included' => true],
                ],
            ],
            [
                'name'        => 'Pro Package',
                'type'        => 'hosting',
                'price'       => 200.00,
                'description' => 'Resellers Special Server',
                'is_active'   => true,
                'features'    => [
                    ['text' => 'Domain Registration Support',   'included' => true],
                    ['text' => '25GB NVMe SSD Storage',         'included' => true],
                    ['text' => 'Shared Server',                 'included' => true],
                    ['text' => '03GB Ram',                      'included' => true],
                    ['text' => 'Unlimited Websites',            'included' => true],
                    ['text' => 'LiteSpeed + LSCache',           'included' => true],
                    ['text' => 'Unlimited Bandwidth',           'included' => true],
                    ['text' => 'FREE SSL Certificates For Life','included' => true],
                    ['text' => '15MB IO',                       'included' => true],
                    ['text' => '300% CPU Power',                'included' => true],
                    ['text' => 'File Access',                   'included' => true],
                    ['text' => 'Error Fixing',                  'included' => true],
                ],
            ],
        ];

        foreach ($packages as $pkg) {
            Package::updateOrCreate(
                ['name' => $pkg['name'], 'type' => $pkg['type']],
                $pkg
            );
        }
    }
}
