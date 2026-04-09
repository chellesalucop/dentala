<?php

// Simple email debug for production
echo "Testing email configuration...\n";

try {
    // Test basic SMTP connection
    $transport = new Swift_SmtpTransport('smtp.gmail.com', 587, 'tls')
        ->setUsername('mrasalucop01@tip.edu.ph')
        ->setPassword('kfpyqkdncvvbqzbo');
    
    $mailer = new Swift_Mailer($transport);
    $message = (new Swift_Message('Test Email'))
        ->setFrom(['mrasalucop01@tip.edu.ph' => 'Dentala Clinic'])
        ->setTo(['poculas.nna@gmail.com'])
        ->setBody('This is a test email from Dentala.');
    
    $result = $mailer->send($message);
    echo "Email sent successfully! Sent to: " . count($result) . " recipients\n";
    
} catch (Exception $e) {
    echo "Email failed: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
}
