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
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
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
        }
        .detail-label {
            font-weight: bold;
            color: #666;
            min-width: 120px;
        }
        .detail-value {
            color: #333;
            flex: 1;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending { background-color: #ffc107; color: #856404; }
        .status-confirmed { background-color: #28a745; color: white; }
        .status-completed { background-color: #28a745; color: white; }
        .status-cancelled { background-color: #dc3545; color: white; }
        .status-declined { background-color: #dc3545; color: white; }
        .status-no-show { background-color: #dc3545; color: white; }
        .status-expired { background-color: #6c757d; color: white; }
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
        <h1>Appointment Update</h1>
    </div>
    
    <div class="content">
        <div class="appointment-details">
            <div class="detail-row">
                <span class="detail-label">Patient:</span>
                <span class="detail-value">{{ $appointment->full_name }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="status-badge status-{{ $appointment->status }}">
                        {{ ucfirst($appointment->status) }}
                    </span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('F j, Y') }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">{{ $appointment->preferred_time }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">{{ $appointment->service_type }}</span>
            </div>
            @if($appointment->custom_service)
                <div class="detail-row">
                    <span class="detail-label">Custom Service:</span>
                    <span class="detail-value">{{ $appointment->custom_service }}</span>
                </div>
            @endif
            @if($appointment->cancellation_reason)
                <div class="detail-row">
                    <span class="detail-label">Reason:</span>
                    <span class="detail-value">{{ $appointment->cancellation_reason }}</span>
                </div>
            @endif
        </div>
    </div>
    
    <div class="footer">
        <p>This is an automated notification from your Dental Clinic.</p>
    </div>
</body>
</html>
