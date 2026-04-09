<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use App\Mail\AdminNotificationMail;
use App\Mail\PatientNotificationMail;

class SendAppointmentEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $appointment;
    public $emailType;
    public $recipientEmail;
    public $customMessage;
    public $dentistName;

    /**
     * Create a new job instance.
     */
    public function __construct($appointment, $emailType, $recipientEmail, $customMessage = '', $dentistName = 'Dentala Clinic Specialist')
    {
        $this->appointment = $appointment;
        $this->emailType = $emailType;
        $this->recipientEmail = $recipientEmail;
        $this->customMessage = $customMessage;
        $this->dentistName = $dentistName;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        \Log::info('SendAppointmentEmailJob: Starting email send to ' . $this->recipientEmail);
        \Log::info('SendAppointmentEmailJob: Email type - ' . $this->emailType);
        
        try {
            if ($this->emailType === 'admin') {
                Mail::to($this->recipientEmail)->send(new AdminNotificationMail($this->appointment, $this->customMessage));
                \Log::info('SendAppointmentEmailJob: Admin email sent successfully');
            } elseif ($this->emailType === 'patient') {
                Mail::to($this->recipientEmail)->send(new PatientNotificationMail($this->appointment, $this->customMessage, '', $this->dentistName));
                \Log::info('SendAppointmentEmailJob: Patient email sent successfully');
            }
        } catch (\Exception $e) {
            \Log::error('SendAppointmentEmailJob failed: ' . $e->getMessage());
            \Log::error('SendAppointmentEmailJob trace: ' . $e->getTraceAsString());
            
            // Retry the job if it fails
            $this->release(30); // Retry after 30 seconds
        }
    }
}
