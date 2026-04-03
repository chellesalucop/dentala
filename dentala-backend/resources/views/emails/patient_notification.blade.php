<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Update</title>
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
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header img {
            max-height: 60px;
            margin-bottom: 5px;
        }
        .content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .appointment-details {
            margin-bottom: 15px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            border-bottom: 1px solid #f1f1f1;
            padding-bottom: 5px;
        }
        .detail-label {
            font-weight: bold;
            color: #666;
            min-width: 130px;
        }
        .detail-value {
            color: #333;
            flex: 1;
            text-align: right;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-confirmed { background-color: #d4edda; color: #155724; }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-cancelled { background-color: #f8d7da; color: #721c24; }
        .status-declined { background-color: #f8d7da; color: #721c24; }
        .status-no-show { background-color: #f8d7da; color: #721c24; }
        .status-expired { background-color: #e2e3e5; color: #383d41; }
        .status-reminder { background-color: #cce5ff; color: #004085; }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            color: #888;
        }
        .message-box {
            background-color: #fdfdfe;
            border-left: 4px solid #0162e0;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ asset('images/logo.png') }}" alt="Dentala Logo">
        <h1>Appointment Update</h1>
    </div>
    
    <div class="content">
        @if(!empty($customMessage))
            <div class="message-box">
                "{{ $customMessage }}"
            </div>
        @endif

        <div class="appointment-details">
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="status-badge status-{{ $statusType }}">
                        {{ ucfirst($statusType) }}
                    </span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Patient Name:</span>
                <span class="detail-value">{{ $appointment->full_name }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Dentist In-Charge:</span>
                <span class="detail-value"><strong>{{ $dentistName }}</strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service Type:</span>
                <span class="detail-value">{{ $appointment->service_type }} {{ $appointment->custom_service ? "({$appointment->custom_service})" : "" }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Appointment Date:</span>
                <span class="detail-value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('F j, Y') }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Preferred Time:</span>
                <span class="detail-value">{{ $appointment->preferred_time }}</span>
            </div>
        </div>

        <p style="font-size: 13px; color: #555;">Please arrive at least 15 minutes before your scheduled time to complete any necessary paperwork.</p>
    </div>
    
    <div class="footer">
        <p>This is an automated notification from Dentala Clinic. Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} Dentala Clinic. All rights reserved.</p>
    </div>
</body>
</html>
