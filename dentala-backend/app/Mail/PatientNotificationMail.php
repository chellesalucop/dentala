<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PatientNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;
    public $statusType;
    public $customMessage;

    public function __construct($appointment, $statusType, $customMessage = '')
    {
        $this->appointment = $appointment;
        $this->statusType = $statusType;
        $this->customMessage = $customMessage;
    }

    public function build()
    {
        // Map of status to a clear, human-readable title
        $subjects = [
            'pending'   => 'Appointment Received - Pending Approval',
            'confirmed' => 'Appointment Confirmed',
            'completed' => 'Appointment Completed',
            'cancelled' => 'Appointment Cancelled',
            'declined'  => 'Appointment Declined',
            'no-show'   => 'Appointment Marked as No-Show',
            'expired'   => 'Appointment Expired',
            'reminder'  => 'Reminder: You have an appointment tomorrow!',
        ];



        $subject = $subjects[$this->statusType] ?? 'Appointment Update';

        return $this->subject($subject)
                    ->view('emails.patient_notification');
    }
}
