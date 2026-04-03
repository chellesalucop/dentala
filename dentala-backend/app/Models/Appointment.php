<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appointment extends Model
{
    use HasFactory, SoftDeletes; // 🛡️ GHOST RECORD: Intercepts all delete() calls

    // The attributes that are mass assignable.
    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'email',
        'service_type',
        'custom_service',
        'preferred_dentist',
        'medical_conditions',
        'others',
        'appointment_date',
        'preferred_time',
        'status',
        'cancellation_reason',
        'booked_by_admin',
        'hmo_provider',
        'hmo_card_path',
    ];

    // The attributes that should be cast.
    protected $casts = [
        // Automatically converts to JSON from the database into a usable array
        'medical_conditions' => 'array', 
        'appointment_date' => 'date',
        'preferred_time' => 'datetime:h:i A', // � AM/PM FORMAT: 12-hour time for admin display
        'others' => 'string', // Cast others to string for medical condition notes
        'created_at' => 'datetime', // 📅 NEWEST FIRST: Booking timestamp for admin sequence
        'deleted_at' => 'datetime', // 🛡️ GHOST RECORD: Cast deleted_at to datetime
    ];

    // Relationship: An appointment belongs to a User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}