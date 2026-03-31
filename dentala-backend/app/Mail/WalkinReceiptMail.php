<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WalkinReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;
    public $statusType; // 🛡️ Added for styling consistency
    public $customMessage; // 🛡️ Added for styling consistency

    public function __construct($appointment)
    {
        $this->appointment = $appointment;
        $this->statusType = 'confirmed'; // Walk-ins are confirmed by default
        $this->customMessage = 'Thank you for visiting! Your walk-in appointment has been successfully registered.';
    }

    public function build()
    {
        // 🛡️ Syncing the subject line to the "Dentala" style
        return $this->subject('Appointment Confirmed - Walk-in Receipt')
                    ->view('emails.patient_notification'); // 🎯 Point to the unified view
    }
}
