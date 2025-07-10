<?php
$to = 'test@example.com';
$subject = 'Test Email from PHP Script';
$message = 'This is a test email sent using PHP mail() function.';
$headers = 'From: noreply@example.com';

if (mail($to, $subject, $message, $headers)) {
    echo 'Email sent successfully.';
} else {
    echo 'Failed to send email.';
}
?>
