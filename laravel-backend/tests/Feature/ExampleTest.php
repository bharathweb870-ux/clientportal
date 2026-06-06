<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_access_the_home_page()
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}