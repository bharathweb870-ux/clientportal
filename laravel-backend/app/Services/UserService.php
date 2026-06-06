<?php

namespace App\Services;

use App\Models\User;

class UserService
{
    public function createUser(array $data): User
    {
        return User::create($data);
    }

    public function updateUser(User $user, array $data): User
    {
        $user->update($data);
        return $user;
    }

    public function deleteUser(User $user): bool
    {
        return $user->delete();
    }

    public function getUserById(int $id): ?User
    {
        return User::find($id);
    }

    public function getAllUsers(): \Illuminate\Database\Eloquent\Collection
    {
        return User::all();
    }
}