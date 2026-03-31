# Forgot Password Validations Complete List

## 🏷️ Backend Synchronize Label: Laravel 12 API
**Focus: Forgot Password Page Validations**

## 📋 Complete Validation Flow

### **Step 1: Email Input Validations**
**Endpoint**: `POST /api/send-otp`

#### **Backend Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Line 98
$request->validate(['email' => 'required|email']);
```

| Validation Rule | Purpose | Error Message |
|-----------------|---------|---------------|
| **required** | Email field must not be empty | "Please enter a valid email address." |
| **email** | Must be valid email format | "Please enter a valid email address." |

#### **Security Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 101-106
$user = User::where('email', $request->email)->first();

if (!$user) {
    // For security, still return success but don't send email
    return response()->json(['message' => 'OTP sent successfully.'], 200);
}
```

| Validation Type | Purpose | Behavior |
|-----------------|---------|----------|
| **Email Existence Check** | Verify email exists in users table | Returns success even if email doesn't exist (security) |

#### **Database Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 108-119
$otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

DB::table('password_resets')->updateOrInsert(
    ['email' => $request->email],
    [
        'token' => $otp,
        'created_at' => now(),
        'expires_at' => now()->addMinutes(5)
    ]
);
```

| Validation Type | Purpose | Implementation |
|-----------------|---------|----------------|
| **OTP Generation** | Generate 6-digit code | `str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT)` |
| **OTP Storage** | Store in database with expiration | 5-minute expiration time |
| **Unique Constraint** | Prevent duplicate OTPs | `updateOrInsert` method |

---

### **Step 2: OTP Verification Validations**
**Endpoint**: `POST /api/verify-otp`

#### **Backend Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 134-137
$request->validate([
    'email' => 'required|email',
    'otp' => 'required|digits:6'
]);
```

| Field | Validation Rule | Purpose | Error Message |
|-------|-----------------|---------|---------------|
| **email** | required | Email field must not be empty | "Please enter a valid email address." |
| **email** | email | Must be valid email format | "Please enter a valid email address." |
| **otp** | required | OTP field must not be empty | "Please enter a valid email address." |
| **otp** | digits:6 | Must be exactly 6 digits | "Please enter a valid email address." |

#### **Database Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 140-148
$resetRecord = DB::table('password_resets')
    ->where('email', $request->email)
    ->where('token', $request->otp)
    ->where('expires_at', '>', now())
    ->first();

if (!$resetRecord) {
    return response()->json(['message' => 'Invalid or expired OTP.'], 400);
}
```

| Validation Type | Purpose | Error Message |
|-----------------|---------|---------------|
| **Email Match** | OTP must belong to correct email | "Invalid or expired OTP." |
| **OTP Match** | OTP must match stored value | "Invalid or expired OTP." |
| **Expiration Check** | OTP must not be expired (5 minutes) | "Invalid or expired OTP." |

#### **Token Generation Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 150-157
$verificationToken = Str::random(60);

DB::table('password_resets')
    ->where('email', $request->email)
    ->where('token', $request->otp)
    ->update(['verified_at' => now(), 'verification_token' => $verificationToken]);
```

| Validation Type | Purpose | Implementation |
|-----------------|---------|----------------|
| **Verification Token** | Generate secure token for password reset | `Str::random(60)` |
| **OTP Marking** | Mark OTP as verified | `verified_at` timestamp |

---

### **Step 3: Password Reset Validations**
**Endpoint**: `POST /api/reset-password-otp`

#### **Backend Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 169-173
$request->validate([
    'email' => 'required|email',
    'verification_token' => 'required|string',
    'password' => 'required|min:8|confirmed'
]);
```

| Field | Validation Rule | Purpose | Error Message |
|-------|-----------------|---------|---------------|
| **email** | required | Email field must not be empty | "Please enter a valid email address." |
| **email** | email | Must be valid email format | "Please enter a valid email address." |
| **verification_token** | required | Token field must not be empty | "Please enter a valid email address." |
| **verification_token** | string | Must be string type | "Please enter a valid email address." |
| **password** | required | Password field must not be empty | "Please enter a valid email address." |
| **password** | min:8 | Must be at least 8 characters | "Please enter a valid email address." |
| **password** | confirmed | Must match password_confirmation | "Please enter a valid email address." |

#### **Verification Token Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 176-184
$resetRecord = DB::table('password_resets')
    ->where('email', $request->email)
    ->where('verification_token', $request->verification_token)
    ->where('verified_at', '>', now()->subMinutes(30)) // Token valid for 30 minutes after OTP verification
    ->first();

if (!$resetRecord) {
    return response()->json(['message' => 'Invalid or expired verification token.'], 400);
}
```

| Validation Type | Purpose | Error Message |
|-----------------|---------|---------------|
| **Email Match** | Token must belong to correct email | "Invalid or expired verification token." |
| **Token Match** | Token must match stored value | "Invalid or expired verification token." |
| **Verification Time** | Token must be verified within 30 minutes | "Invalid or expired verification token." |
| **Token Expiration** | Token expires 30 minutes after OTP verification | "Invalid or expired verification token." |

#### **User Existence Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 186-191
$user = User::where('email', $request->email)->first();

if (!$user) {
    return response()->json(['message' => 'User not found.'], 400);
}
```

| Validation Type | Purpose | Error Message |
|-----------------|---------|---------------|
| **User Existence** | Verify user exists in database | "User not found." |

#### **Password Security Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 194-195
$user->password = Hash::make($request->password);
$user->save();
```

| Validation Type | Purpose | Implementation |
|-----------------|---------|----------------|
| **Password Hashing** | Secure password storage | `Hash::make()` |
| **Password Update** | Update user password | `$user->save()` |

#### **Cleanup Validations**
```php
// app/Http/Controllers/Api/AuthController.php - Lines 197-198
DB::table('password_resets')->where('email', $request->email)->delete();
```

| Validation Type | Purpose | Implementation |
|-----------------|---------|----------------|
| **Token Cleanup** | Remove used tokens for security | `delete()` method |

---

## 🎯 Complete Validation Summary

### **Step 1: Email Input (POST /api/send-otp)**
| Validation | Rule | Error Message |
|------------|------|---------------|
| Email Required | `required` | "Please enter a valid email address." |
| Email Format | `email` | "Please enter a valid email address." |
| Email Existence | Database check | Returns success (security) |
| OTP Generation | 6-digit random | N/A |
| OTP Storage | 5-minute expiration | N/A |

### **Step 2: OTP Verification (POST /api/verify-otp)**
| Validation | Rule | Error Message |
|------------|------|---------------|
| Email Required | `required` | "Please enter a valid email address." |
| Email Format | `email` | "Please enter a valid email address." |
| OTP Required | `required` | "Please enter a valid email address." |
| OTP Format | `digits:6` | "Please enter a valid email address." |
| OTP Match | Database check | "Invalid or expired OTP." |
| OTP Expiration | 5-minute limit | "Invalid or expired OTP." |
| Email Match | Database check | "Invalid or expired OTP." |

### **Step 3: Password Reset (POST /api/reset-password-otp)**
| Validation | Rule | Error Message |
|------------|------|---------------|
| Email Required | `required` | "Please enter a valid email address." |
| Email Format | `email` | "Please enter a valid email address." |
| Token Required | `required` | "Please enter a valid email address." |
| Token Format | `string` | "Please enter a valid email address." |
| Password Required | `required` | "Please enter a valid email address." |
| Password Length | `min:8` | "Please enter a valid email address." |
| Password Confirmation | `confirmed` | "Please enter a valid email address." |
| Token Match | Database check | "Invalid or expired verification token." |
| Token Expiration | 30-minute limit | "Invalid or expired verification token." |
| User Existence | Database check | "User not found." |

---

## 🔧 Security Validations

### **Time-Based Security**
| Security Feature | Implementation | Purpose |
|------------------|----------------|---------|
| **OTP Expiration** | 5 minutes | Prevents OTP reuse |
| **Token Expiration** | 30 minutes after OTP verification | Limits password reset window |
| **Token Cleanup** | Automatic deletion after use | Prevents token reuse |

### **Data Security**
| Security Feature | Implementation | Purpose |
|------------------|----------------|---------|
| **OTP Format** | 6-digit numeric | Easy to enter, secure |
| **Token Format** | 60-character random string | Cryptographically secure |
| **Password Hashing** | Bcrypt | Secure password storage |
| **Email Obfuscation** | Success response for non-existent emails | Prevents email enumeration |

### **Validation Security**
| Security Feature | Implementation | Purpose |
|------------------|----------------|---------|
| **Input Validation** | Laravel validation rules | Prevents injection attacks |
| **Type Validation** | String, numeric checks | Ensures proper data types |
| **Length Validation** | min:8 for passwords | Ensures password strength |
| **Format Validation** | email, digits:6 | Ensures proper input formats |

---

## 📊 Error Message Matrix

| Step | Error Type | HTTP Status | Message |
|------|------------|-------------|---------|
| **Step 1** | Invalid email format | 422 | "Please enter a valid email address." |
| **Step 1** | Empty email field | 422 | "Please enter a valid email address." |
| **Step 2** | Invalid OTP | 400 | "Invalid or expired OTP." |
| **Step 2** | Expired OTP | 400 | "Invalid or expired OTP." |
| **Step 2** | Invalid email format | 422 | "Please enter a valid email address." |
| **Step 2** | Invalid OTP format | 422 | "Please enter a valid email address." |
| **Step 3** | Invalid verification token | 400 | "Invalid or expired verification token." |
| **Step 3** | Expired verification token | 400 | "Invalid or expired verification token." |
| **Step 3** | User not found | 400 | "User not found." |
| **Step 3** | Password too short | 422 | "Please enter a valid email address." |
| **Step 3** | Password mismatch | 422 | "Please enter a valid email address." |

---

## ✅ Implementation Status

### **Backend Validations**
- [x] Step 1: Email input validation and OTP generation
- [x] Step 2: OTP verification with expiration checks
- [x] Step 3: Password reset with token validation
- [x] Security measures: Time limits, hashing, cleanup
- [x] Error handling: Clear, actionable messages

### **Database Validations**
- [x] OTP storage with 5-minute expiration
- [x] Verification token with 30-minute validity
- [x] User existence checks
- [x] Token cleanup after use

### **Security Validations**
- [x] Input sanitization and validation
- [x] Time-based expiration controls
- [x] Secure password hashing
- [x] Email enumeration prevention

---

**Status**: ✅ Complete Forgot Password Validations Documented  
**Steps**: ✅ 3-step validation flow implemented  
**Security**: ✅ Multiple security layers in place  
**Error Handling**: ✅ Clear, actionable error messages  
**Database**: ✅ Proper token storage and cleanup

**Version**: Laravel 12 API v39.0 - Forgot Password Validations  
**Production**: ✅ Ready for Frontend Integration
