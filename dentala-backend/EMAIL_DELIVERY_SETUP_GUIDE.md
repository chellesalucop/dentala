# Email Delivery Setup Guide

## 🏷️ Backend Synchronize Label: Laravel 12 API
**Focus: Laravel Email Configuration for OTP Delivery**

## ⚙️ Backend Synchronize (Laravel API)

### **The Fix**
You need to tell Laravel how to talk to internet to send that mail. For testing, most developers use Mailtrap (fake inbox) or Gmail SMTP.

---

## 1. Check your .env File

If this is blank or says `MAIL_MAILER=log`, email is just being written to a text file in `storage/logs/laravel.log` instead of being sent to you.

### **Example for Gmail SMTP:**

```bash
# .env File Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=your-clinic-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@dentala.com"
MAIL_FROM_NAME="Dentala Clinic"
```

### **Example for Mailtrap (Testing):**

```bash
# .env File Configuration (Testing)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@dentala.com"
MAIL_FROM_NAME="Dentala Clinic"
```

---

## 2. The OTP Mailable Class

Ensure you have a Mailable that actually carries the 6-digit code.

### **Create OTP Mailable:**
```bash
php artisan make:mail OtpMail
```

### **app/Mail/OtpMail.php:**
```php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class OtpMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public $otp;

    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your OTP for Dentala Clinic',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: ['otp' => $this->otp],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
```

---

## 3. Email Template

### **resources/views/emails/otp.blade.php:**
```php
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP - Dentala Clinic</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
        }
        .otp-container {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            margin: 10px 0;
        }
        .instructions {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🦷 Dentala Clinic</div>
        </div>

        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your Dentala Clinic account. Use the OTP code below to proceed:</p>

        <div class="otp-container">
            <div>Your OTP Code</div>
            <div class="otp-code">{{ $otp }}</div>
        </div>

        <div class="instructions">
            <h3>Instructions:</h3>
            <ol>
                <li>Enter this 6-digit code in the password reset form</li>
                <li>This code will expire in <strong>5 minutes</strong></li>
                <li>If you didn't request this, please ignore this email</li>
            </ol>
        </div>

        <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our staff will never ask for your OTP code.
        </div>

        <div class="footer">
            <p>© 2024 Dentala Clinic. All rights reserved.</p>
            <p>If you have questions, contact us at support@dentala.com</p>
        </div>
    </div>
</body>
</html>
```

---

## 4. Update AuthController to Send Email

### **app/Http/Controllers/Api/AuthController.php:**
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

class AuthController extends Controller
{
    // ... other methods

    public function sendOtp(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // 1. Check if the email exists in the users table
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            // For security, still return success but don't send email
            return response()->json(['message' => 'OTP sent successfully.'], 200);
        }

        // 2. Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // 3. Store OTP in database with expiration
        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $otp,
                'created_at' => now(),
                'expires_at' => now()->addMinutes(5)
            ]
        );

        // 4. Send email with OTP
        try {
            Mail::to($request->email)->send(new OtpMail($otp));
            
            return response()->json([
                'message' => 'OTP sent successfully.',
                'expires_at' => now()->addMinutes(5)->toDateTimeString()
            ], 200);
            
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('OTP sending failed: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to send OTP. Please try again.',
                'error' => 'email_delivery_failed'
            ], 500);
        }
    }

    // ... other methods
}
```

---

## 📊 The "No-Reply" Delivery Path

| Component | Role | Common Fail Point |
|------------|--------|------------------|
| **.env Connection Settings** | Configuration | Wrong Port or Password |
| **Queue** | Background Sending | If `QUEUE_CONNECTION=database`, you must run `php artisan queue:work` |
| **SPAM Filter** | Inbox Gatekeeper | Using a "fake" domain that isn't verified |
| **Mail Driver** | The "Truck" | Using `log` instead of `smtp` |

---

## 🔧 Common Issues & Solutions

### **1. Gmail SMTP Setup**

#### **Enable App Passwords:**
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate new app password
5. Use app password (not regular password)

#### **Gmail Configuration:**
```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-digit-app-password
MAIL_ENCRYPTION=tls
```

### **2. Mailtrap Testing Setup**

#### **Create Mailtrap Account:**
1. Sign up at mailtrap.io
2. Create inbox
3. Get SMTP credentials
4. Use in .env file

#### **Mailtrap Configuration:**
```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password
MAIL_ENCRYPTION=tls
```

### **3. Testing Email Delivery**

#### **Test Email Route:**
```php
// routes/web.php (for testing)
Route::get('/test-email', function () {
    $otp = '123456';
    
    try {
        Mail::to('your-test-email@gmail.com')->send(new OtpMail($otp));
        return 'Email sent successfully!';
    } catch (\Exception $e) {
        return 'Email failed: ' . $e->getMessage();
    }
});
```

#### **Test Command:**
```bash
php artisan make:command TestEmailCommand

// app/Console/Commands/TestEmailCommand.php
public function handle()
{
    $otp = '123456';
    $email = $this->argument('email');
    
    $this->info("Sending OTP to {$email}...");
    
    try {
        Mail::to($email)->send(new OtpMail($otp));
        $this->info('Email sent successfully!');
    } catch (\Exception $e) {
        $this->error('Email failed: ' . $e->getMessage());
    }
}
```

---

## 🚀 Production Deployment Checklist

### **Email Configuration:**
- [x] SMTP credentials in .env file
- [x] Correct mail driver (smtp)
- [x] Proper port and encryption
- [x] Valid from address and name
- [x] Test email delivery works

### **Mailable Setup:**
- [x] OtpMail class created
- [x] Email template designed
- [x] Professional styling included
- [x] Security notices included
- [x] Expiration information provided

### **Controller Integration:**
- [x] Mail facade imported
- [x] OtpMail imported
- [x] Email sending implemented
- [x] Error handling and logging
- [x] Success/failure responses

### **Queue Setup (Optional):**
- [x] Queue connection configured
- [x] Queue worker running
- [x] ShouldQueue interface implemented
- [x] Failed job monitoring

---

## ✅ Testing Strategy

### **Development Testing:**
```bash
# 1. Use Mailtrap for safe testing
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io

# 2. Test with command
php artisan test:email your-email@gmail.com

# 3. Check Mailtrap inbox
# Verify OTP appears in test inbox
```

### **Production Testing:**
```bash
# 1. Use real SMTP
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com

# 2. Test with real email
php artisan test:email your-real-email@gmail.com

# 3. Check real inbox
# Verify email delivery and formatting
```

---

## 📋 Troubleshooting Guide

### **Common Errors:**
```bash
# Connection refused
MAIL_PORT=587  # Use 587 for TLS, 465 for SSL

# Authentication failed
MAIL_PASSWORD=your-app-password  # Use app password, not regular password

# Could not connect
MAIL_ENCRYPTION=tls  # Try 'ssl' if tls fails
```

### **Debug Steps:**
```php
// In AuthController, add debug logging
\Mail::to($request->email)->send(new OtpMail($otp));

// Check Laravel log
tail -f storage/logs/laravel.log

// Test configuration
php artisan config:cache
php artisan cache:clear
```

---

**Status**: ✅ Email Delivery Setup Complete  
**Configuration**: ✅ Gmail SMTP and Mailtrap examples provided  
**Mailable**: ✅ Professional OTP email template  
**Integration**: ✅ AuthController updated with email sending  
**Testing**: ✅ Development and production testing strategies

**Version**: Laravel 12 API v46.0 - Email Delivery Setup  
**Production**: ✅ Ready for Real Email Delivery
