<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Contracts\Validation\Validator;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'max:255',
                'unique:users,email',
                'regex:/^[a-z0-9._%+-]+@(gmail\.com|yahoo\.com|tip\.edu\.ph)$/i'
            ],
            'phone' => [
                'required',
                'digits:11',
                'unique:users,phone', // Check if 'phone' exists in 'users' table
            ],
            'password' => 'required|min:8|confirmed',
            'terms' => 'accepted',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            // 🛡️ RESTORED: Strict Regex for Whitelisted Domains
            'email.required' => 'Please use a valid email (Gmail, Yahoo, or TIP only).',
            'email.string' => 'Please use a valid email (Gmail, Yahoo, or TIP only).',
            'email.max' => 'Please use a valid email (Gmail, Yahoo, or TIP only).',
            'email.regex' => 'Please use a valid email (Gmail, Yahoo, or TIP only).',
            'email.unique' => 'The email has already been taken',

            // 🛡️ RESTORED: Strict 11 Digits
            'phone.required' => 'Phone number must be exactly 11 digits.',
            'phone.digits' => 'Phone number must be exactly 11 digits.',
            'phone.unique' => 'This phone number has already been taken.',

            // Password validation messages
            'password.required' => 'Password must be at least 8 characters',
            'password.min' => 'Password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match.',

            // Terms validation messages
            'terms.accepted' => 'You must accept the Terms and Conditions to proceed.',
        ];
    }

    /**
     * Handle a failed validation attempt.
     * Returns standard Laravel 422 JSON response for frontend catch blocks.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors()
            ], 422)
        );
    }
}
