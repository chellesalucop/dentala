<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code - Dentala Clinic (TIP Support)</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
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
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .subheader {
            color: #6b7280;
            font-size: 14px;
        }
        .otp-container {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin: 25px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 15px 0;
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
        }
        .instructions {
            background-color: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .tip-branding {
            background-color: #1e40af;
            color: white;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            margin-bottom: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="tip-branding">
            🎓 TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES
        </div>
        
        <div class="header">
            <div class="logo">🦷 Dentala Clinic</div>
            <div class="subheader">TIP Support - Password Reset Service</div>
        </div>

        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your Dentala Clinic account. Use the OTP code below to proceed:</p>

        <div class="otp-container">
            <div>Your One-Time Password (OTP)</div>
            <div class="otp-code">{{ $otpCode }}</div>
            <div style="font-size: 14px; margin-top: 10px;">Valid for 5 minutes only</div>
        </div>

        <div class="instructions">
            <h3>📋 Instructions:</h3>
            <ol>
                <li>Enter this 6-digit code in the password reset form</li>
                <li>This code will expire in <strong>5 minutes</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>For technical support, contact TIP IT Department</li>
            </ol>
        </div>

        <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our staff will never ask for your OTP code.
        </div>

        <div class="footer">
            <p><strong>Dentala Clinic - TIP Support</strong></p>
            <p>Technological Institute of the Philippines</p>
            <p>© 2024 All rights reserved.</p>
            <p>For questions: mrasalucop01@tip.edu.ph</p>
        </div>
    </div>
</body>
</html>
