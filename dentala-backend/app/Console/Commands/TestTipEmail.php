<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

class TestTipEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:tip-email {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test TIP email configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $otpCode = '123456';
        
        $this->info("Sending test OTP to {$email}...");
        
        try {
            Mail::to($email)->send(new OtpMail($otpCode));
            $this->info('✅ Email sent successfully!');
        } catch (\Exception $e) {
            $this->error('❌ Email failed: ' . $e->getMessage());
        }
    }
}
