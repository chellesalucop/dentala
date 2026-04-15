<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminNotificationMail extends Mailable implements ShouldQueue
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
        // Map of action type to a clear title for the Admin
        $subjects = [
            'New Booking'         => 'Action Required: New Booking Request',
            'Reschedule Request'  => 'Action Required: Appointment Rescheduled',
            'Patient Cancellation' => 'Alert: Appointment Cancelled by Patient',
            'Patient Confirmed'   => 'Alert: Patient Confirmed Appointment',
        ];

        $subject = $subjects[$this->statusType] ?? 'Admin Appointment Update';

        return $this->subject($subject)
                    ->view('emails.admin_notification');
    }
}
