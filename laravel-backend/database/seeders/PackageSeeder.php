<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Package;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            'Starter Package' => [
                ['text' => 'Posting New Content You Provide',                                                          'included' => true],
                ['text' => 'Add Any New Page Or Listings',                                                             'included' => true],
                ['text' => 'Time Allocated Each Month Up To 02 Days',                                                  'included' => true],
                ['text' => 'Emergency Repairs Due To Website Errors',                                                  'included' => true],
                ['text' => 'Optimizing And Posting New Images You Provide',                                            'included' => false],
                ['text' => 'Maintaining Shopping Website (Uploading New Products, Adjusting Product Information, Pictures, Etc)', 'included' => false],
                ['text' => 'Update Trending Design (Every Six Month Per)',                                             'included' => false],
                ['text' => 'Monitoring Google Analytics & Google Webmaster Tools',                                     'included' => false],
                ['text' => 'Optimize The Website Speed',                                                               'included' => false],
            ],
            'Light Package' => [
                ['text' => 'Posting New Content You Provide',                                                          'included' => true],
                ['text' => 'Add Any New Page Or Listings',                                                             'included' => true],
                ['text' => 'Time Allocated Each Month Up To 05 Days',                                                  'included' => true],
                ['text' => 'Emergency Repairs Due To Website Errors',                                                  'included' => true],
                ['text' => 'Optimizing And Posting New Images You Provide',                                            'included' => true],
                ['text' => 'Maintaining Shopping Website (Uploading New Products, Adjusting Product Information, Pictures, Etc)', 'included' => true],
                ['text' => 'Update Trending Design (Every Year Per)',                                                  'included' => true],
                ['text' => 'Monitoring Google Analytics & Google Webmaster Tools',                                     'included' => false],
                ['text' => 'Optimize The Website Speed',                                                               'included' => false],
            ],
            'Pro Package' => [
                ['text' => 'Posting New Content You Provide',                                                          'included' => true],
                ['text' => 'Add Any New Page Or Listings',                                                             'included' => true],
                ['text' => 'Time Allocated Each Month Up To 10 Days',                                                  'included' => true],
                ['text' => 'Emergency Repairs Due To Website Errors',                                                  'included' => true],
                ['text' => 'Optimizing And Posting New Images You Provide',                                            'included' => true],
                ['text' => 'Maintaining Shopping Website (Uploading New Products, Adjusting Product Information, Pictures, Etc)', 'included' => true],
                ['text' => 'Update Trending Design (Every Six Month Per)',                                             'included' => true],
                ['text' => 'Monitoring Google Analytics & Google Webmaster Tools',                                     'included' => true],
                ['text' => 'Optimize The Website Speed',                                                               'included' => true],
            ],
        ];

        $packages = [
            [
                'name'        => 'Starter Package',
                'type'        => 'management',
                'price'       => 49.99,
                'description' => 'Basic website management for small businesses',
                'is_active'   => true,
            ],
            [
                'name'        => 'Light Package',
                'type'        => 'management',
                'price'       => 99.99,
                'description' => 'Extended management with image optimization and shopping support',
                'is_active'   => true,
            ],
            [
                'name'        => 'Pro Package',
                'type'        => 'management',
                'price'       => 149.90,
                'description' => 'Full-service management with analytics and speed optimization',
                'is_active'   => true,
            ],
        ];

        foreach ($packages as $pkg) {
            Package::updateOrCreate(
                ['name' => $pkg['name'], 'type' => $pkg['type']],
                array_merge($pkg, ['features' => $features[$pkg['name']]])
            );
        }
    }
}
