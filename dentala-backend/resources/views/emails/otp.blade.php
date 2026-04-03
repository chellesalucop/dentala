<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .header {
            background-color: #0162e0;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header img {
            max-height: 50px;
            margin-bottom: 10px;
        }
        .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .otp-box {
            background-color: #f1f8ff;
            border: 2px dashed #0162e0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #0162e0;
            letter-spacing: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ asset('images/logo.png') }}" alt="Dentala Logo">
        <h1>Password Reset</h1>
    </div>
    
    <div class="content">
        <p>Hello,</p>
        <p>You requested an OTP for your password reset. Please use the code below to proceed:</p>
        
        <div class="otp-box">
            <div class="otp-code">{{ $otpCode }}</div>
        </div>
        
        <p style="font-size: 14px; color: #777;">This code is valid for 5 minutes only.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
    </div>
    
    <div class="footer">
        <p>This is an automated notification from Dentala Clinic.</p>
        <p>&copy; {{ date('Y') }} Dentala Clinic. All rights reserved.</p>
    </div>
</body>
</html>
