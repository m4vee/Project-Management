from flask_mail import Mail, Message
import random
import string

mail = Mail()

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(recipient_email, otp_code):
    """Send OTP via email"""
    try:
        msg = Message(
            subject='TuPulse - Email Verification Code',
            recipients=[recipient_email],
            body=f'''
Hello!

Your verification code is: {otp_code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
TuPulse Team
            ''',
            html=f'''
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2>Email Verification</h2>
                    <p>Hello!</p>
                    <p>Your verification code is:</p>
                    <h1 style="color: #007bff; letter-spacing: 5px;">{otp_code}</h1>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>TuPulse Team</p>
                </body>
            </html>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False