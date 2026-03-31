# SMTP Debugging Guide

## 🏷️ Backend Synchronize Label: Laravel 12 API
**Focus: SMTP Connection and Email Delivery Debugging**

---

## ⚙️ Backend Synchronize (Laravel API)

### **The Fix**
We need to stop "guessing" and look at the actual error: mail server is giving back.

---

## 1. The "Debug" Check (Manual Test)

### **Bypass Frontend, Test Directly**
If you haven't yet, run this command in your terminal. It will bypass your JSX frontend and try to talk to Gmail directly. It will spit out a giant error message if it fails:

```bash
php artisan tinker
>>> Mail::raw('Test', function($m) { 
    $m->to('mrasalucop01@tip.edu.ph')->subject('Test'); 
});
```

### **Interpretation Guide:**

| Result | What it Means | Action |
|---------|----------------|--------|
| **Returns `null`** | ✅ Email was accepted by Google | Check your SPAM folder |
| **Returns long Error** | ❌ Connection/Authentication failed | Read first 3 lines for specific error |
| **Timeout** | ❌ Network/firewall issue | Check port and encryption |
| **Connection Refused** | ❌ Wrong host/port | Verify SMTP settings |

---

## 2. The config/mail.php Trap

### **Common Issue**
Sometimes, Laravel 12 ignores `.env` if `config/mail.php` file is hardcoded.

### **Check Your config/mail.php:**
```php
// config/mail.php
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'mrasalucop01@tip.edu.ph'),
    'name' => env('MAIL_FROM_NAME', 'Dentala Clinic'),
],

// ✅ CORRECT - Uses .env variables
```

### **❌ Incorrect (Hardcoded):**
```php
// config/mail.php
'from' => [
    'address' => 'different-email@gmail.com', // ❌ Ignores .env
    'name' => 'Different Name',              // ❌ Ignores .env
],
```

---

## 3. Final Failure Checklist

### **Symptom → Cause → Solution**

| Symptom | Cause | The Fix |
|---------|--------|----------|
| **Alert pops up, no email** | `QUEUE_CONNECTION=database` | Change to `sync` in .env |
| **"Success" message, but error in logs** | try/catch swallowing error | Check `storage/logs/laravel.log` |
| **Connection Timed Out** | TIP network blocks Port 587 | Try `MAIL_PORT=465` and `MAIL_ENCRYPTION=ssl` |
| **Authentication Failed** | App Password is invalid | Generate NEW App Password in Google |
| **Email goes to Spam** | Gmail marks as suspicious | Check sender reputation, add SPF/DKIM |

---

## 4. TIP Gmail Specific Debugging

### **Port & Encryption Settings:**
```bash
# Option 1: Standard TLS (Recommended)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls

# Option 2: SSL (Alternative)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
```

### **App Password Generation:**
1. Go to Google Account: https://myaccount.google.com/
2. Security → 2-Step Verification
3. App Passwords → Generate new
4. Select: Mail → Device: Other (Custom name)
5. Copy 16-character password (no spaces)
6. Use in `.env` (not regular Gmail password)

---

## 5. Debug Commands

### **Test SMTP Connection:**
```bash
# Quick connection test
php artisan tinker
>>> config('mail.mailers.smtp')

# Test email with error catching
php artisan tinker
>>> try { Mail::to('test@example.com')->send(new OtpMail('123456')); echo 'Success'; } catch (Exception $e) { echo 'Error: ' . $e->getMessage(); }
```

### **Check Configuration:**
```bash
# Verify .env is loaded
php artisan tinker
>>> env('MAIL_HOST')
>>> env('MAIL_PORT')
>>> env('MAIL_USERNAME')
>>> env('MAIL_PASSWORD')
```

### **Clear All Caches:**
```bash
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

---

## 6. Common Error Messages

### **Gmail Authentication Errors:**
```
535 5.7.8   Authentication unsuccessful
534-5.7.9   Application-specific password required
535-5.7.8   Username or Password is incorrect
```

### **Connection Errors:**
```
Connection timed out #110
Connection refused #111
Network is unreachable #101
```

### **Laravel Mail Errors:**
```
Swift_TransportException: Connection could not be established
Swift_TransportException: Failed to authenticate on SMTP server
```

---

## 7. Step-by-Step Debugging

### **Step 1: Verify .env Loading**
```bash
php artisan tinker
>>> env('MAIL_HOST')        # Should show: smtp.gmail.com
>>> env('MAIL_PORT')        # Should show: 587
>>> env('MAIL_USERNAME')     # Should show: mrasalucop01@tip.edu.ph
>>> env('MAIL_PASSWORD')     # Should show: your-app-password
```

### **Step 2: Test Raw Email**
```bash
php artisan tinker
>>> Mail::raw('Test', function($m) { 
    $m->to('mrasalucop01@tip.edu.ph')->subject('Test'); 
});
```

### **Step 3: Test OtpMail**
```bash
php artisan tinker
>>> Mail::to('test@example.com')->send(new OtpMail('123456'))
```

### **Step 4: Check Logs**
```bash
tail -f storage/logs/laravel.log | grep -i "mail\|smtp\|otp"
```

---

## 8. Production vs Development

### **Development (.env):**
```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=mrasalucop01@tip.edu.ph
MAIL_PASSWORD=lvgqiaissviwryiur
QUEUE_CONNECTION=sync  # Important for immediate sending
```

### **Production (.env):**
```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=mrasalucop01@tip.edu.ph
MAIL_PASSWORD=lvgqiaissviwryiur
QUEUE_CONNECTION=database  # For background processing
```

---

## 9. Emergency Fallbacks

### **If Gmail Still Fails:**
```bash
# Try Mailtrap for testing
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username
MAIL_PASSWORD=your-mailtrap-password

# Try different SMTP service
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

---

## 10. Complete Debugging Script

### **All-in-One Test:**
```bash
php artisan make:command DebugSmtp

// app/Console/Commands/DebugSmtp.php
public function handle()
{
    $this->info('Testing SMTP Configuration...');
    
    // Check .env values
    $this->info('MAIL_HOST: ' . env('MAIL_HOST'));
    $this->info('MAIL_PORT: ' . env('MAIL_PORT'));
    $this->info('MAIL_USERNAME: ' . env('MAIL_USERNAME'));
    
    // Test connection
    try {
        $transport = new \Swift_SmtpTransport(
            env('MAIL_HOST'),
            env('MAIL_PORT'),
            env('MAIL_ENCRYPTION')
        );
        
        $mailer = new \Swift_Mailer($transport);
        $message = new \Swift_Message('Test SMTP');
        $message->setTo('test@example.com');
        $message->setSubject('SMTP Test');
        
        $result = $mailer->send($message);
        $this->info('✅ SMTP Test: Success');
        
    } catch (\Exception $e) {
        $this->error('❌ SMTP Test Failed: ' . $e->getMessage());
    }
    
    // Test email sending
    try {
        Mail::to('test@example.com')->send(new OtpMail('123456'));
        $this->info('✅ Email Test: Success');
    } catch (\Exception $e) {
        $this->error('❌ Email Test Failed: ' . $e->getMessage());
    }
}
```

---

## ✅ Debugging Checklist

### **Configuration:**
- [x] .env file has correct TIP credentials
- [x] No spaces in MAIL_PASSWORD
- [x] config/mail.php uses env() helpers
- [x] QUEUE_CONNECTION=sync for immediate sending
- [x] All caches cleared

### **Connection:**
- [x] Test basic SMTP connection
- [x] Test authentication with Gmail
- [x] Test email sending with OtpMail
- [x] Check for specific error messages
- [x] Try alternative ports/encryption

### **Troubleshooting:**
- [x] Check Laravel logs for errors
- [x] Verify Gmail app password is valid
- [x] Check TIP network firewall settings
- [x] Test with Mailtrap as fallback
- [x] Monitor Gmail spam folder

---

**Status**: ✅ SMTP Debugging Guide Complete  
**Testing**: ✅ Comprehensive debugging commands provided  
**Troubleshooting**: ✅ Step-by-step error analysis  
**Solutions**: ✅ Multiple fallback options available  
**Production**: ✅ Ready for SMTP debugging

**Version**: Laravel 12 API v51.0 - SMTP Debugging Guide  
**Priority**: ✅ CRITICAL - Fix email delivery immediately
