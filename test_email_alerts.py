#!/usr/bin/env python3
"""
Test Email Alert System
Sends a test email to verify configuration
"""

import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

def send_test_email():
    """Send a test email"""
    
    # Load config
    try:
        with open('email_config.json', 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("❌ Email config not found. Run: python3 automation_runner.py --setup-email")
        return False
    
    print("📧 Sending test email...")
    print(f"From: {config['from_email']}")
    print(f"To: {', '.join(config['to_emails'])}")
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🧪 Test Alert - BigDataClaw Opportunity System"
        msg['From'] = config['from_email']
        msg['To'] = ', '.join(config['to_emails'])
        
        # HTML content
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                .success {{ background: #d1fae5; color: #065f46; padding: 15px; 
                           border-radius: 8px; border-left: 4px solid #22c55e; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Test Alert Successful!</h1>
                    <p>BigDataClaw Opportunity Automation System</p>
                </div>
                
                <div class="success">
                    <strong>Your email alerts are working!</strong>
                    <p>This is a test email to confirm your alert configuration.</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3>Configuration Details:</h3>
                    <ul>
                        <li>SMTP Server: {config['smtp_server']}</li>
                        <li>From: {config['from_email']}</li>
                        <li>Recipients: {len(config['to_emails'])} configured</li>
                    </ul>
                </div>
                
                <p style="color: #666; margin-top: 20px;">
                    <small>Test sent at: {datetime.now().isoformat()}</small>
                </p>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Send
        with smtplib.SMTP(config['smtp_server'], config['smtp_port']) as server:
            server.starttls()
            server.login(config['username'], config['password'])
            server.sendmail(config['from_email'], config['to_emails'], msg.as_string())
        
        print("✅ Test email sent successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send test email: {e}")
        return False

if __name__ == '__main__':
    send_test_email()
