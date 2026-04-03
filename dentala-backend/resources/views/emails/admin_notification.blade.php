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
        <img src="{{ asset('images/logo.png') }}" alt="Dentala Logo">
        <h1>Appointment Update</h1>
    </div>
    
    <div class="content">
        <div class="appointment-details">
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                    <span class="status-badge status-{{ $appointment->status }}">
                        {{ ucfirst($appointment->status) }}
                    </span>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Appointment Date:</span>
                <span class="detail-value">{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('F j, Y') }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Preferred Time:</span>
                <span class="detail-value">{{ $appointment->preferred_time }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Patient Name:</span>
                <span class="detail-value">{{ $appointment->full_name }}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service Type:</span>
                <span class="detail-value">{{ $appointment->service_type }}</span>
            </div>
            @if($appointment->custom_service)
                <div class="detail-row">
                    <span class="detail-label">Custom Service:</span>
                    <span class="detail-value">{{ $appointment->custom_service }}</span>
                </div>
            @endif
            @if($appointment->hmo_provider && $appointment->hmo_provider !== 'None')
                <div class="detail-row">
                    <span class="detail-label">HMO Provider:</span>
                    <span class="detail-value" style="color: #0162e0; font-weight: bold;">{{ $appointment->hmo_provider }}</span>
                </div>
                @if($appointment->hmo_card_path)
                    <div style="margin-top: 15px; border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #fff;">
                        <p style="font-size: 11px; color: #888; margin-top: 0; margin-bottom: 5px; font-weight: bold; text-transform: uppercase;">HMO Card Preview:</p>
                        <img src="{{ $appointment->hmo_card_path }}" style="max-width: 100%; border-radius: 4px; border: 1px solid #eee;" alt="HMO Card">
                    </div>
                @endif
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
