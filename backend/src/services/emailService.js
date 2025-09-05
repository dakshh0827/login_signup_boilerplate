// server/src/services/emailService.js - BREVO SMTP OPTIMIZED
import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    // Initialize Brevo SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT),
      secure: process.env.BREVO_SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASSWORD
      },
      // Additional settings for better deliverability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14 // emails per second
    });

    console.log('📧 Brevo SMTP EmailService initialized');
    console.log('📧 SMTP Host:', process.env.BREVO_SMTP_HOST);
    console.log('📧 SMTP Port:', process.env.BREVO_SMTP_PORT);
    console.log('📧 SMTP User:', process.env.BREVO_SMTP_USER);

    // Test connection on startup
    this.testConnection();
  }

  async sendOTP(email, otp, type = 'verification') {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      const subject =
        type === 'verification'
          ? 'Your RoadGuard Verification Code'
          : 'Your RoadGuard Password Reset Code';

      const mailOptions = {
        from: {
          name: process.env.BREVO_FROM_NAME || 'RoadGuard',
          address: process.env.BREVO_FROM_EMAIL
        },
        to: email.toLowerCase().trim(),
        subject: subject,
        text: `RoadGuard - Your ${type} code: ${otp}. This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you didn't request this code, please ignore this email.`,
        html: this.generateDeliverableOTPEmail(otp, type),
        
        // Headers for better deliverability
        headers: {
          'X-Priority': '1',
          'X-Mailer': 'RoadGuard-System',
          'X-Category': `otp-${type}`,
          'List-Unsubscribe': `<mailto:unsubscribe@${process.env.BREVO_FROM_EMAIL?.split('@')[1] || 'example.com'}>`
        }
      };

      console.log('📧 Sending email via Brevo SMTP to:', email);
      console.log('📧 From address:', mailOptions.from.address);
      console.log('📧 Subject:', subject);

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✅ Brevo SMTP email sent successfully:', {
        messageId: info.messageId,
        response: info.response,
        to: email
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully via Brevo SMTP',
        response: info.response
      };
    } catch (error) {
      console.error('❌ Brevo SMTP email send failed:', error);

      // Handle specific SMTP errors
      if (error.code === 'EAUTH') {
        console.error('❌ Authentication failed - Check SMTP credentials');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection refused - Check SMTP host and port');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('❌ Connection timeout - Check network connectivity');
      }

      throw new Error(`Brevo SMTP email failed: ${error.message}`);
    }
  }

  generateDeliverableOTPEmail(otp, type) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="format-detection" content="telephone=no">
        <title>RoadGuard ${type === 'verification' ? 'Verification' : 'Password Reset'}</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        
        <!-- Preheader text (hidden) -->
        <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
          Your RoadGuard ${type} code: ${otp}
        </div>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #2563eb; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">RoadGuard</h1>
                    <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">Vehicle Management System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">
                      ${type === 'verification' ? 'Verify Your Email Address' : 'Reset Your Password'}
                    </h2>
                    
                    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6; font-size: 16px;">
                      ${type === 'verification' 
                        ? 'Thank you for signing up! Please use the verification code below to confirm your email address and activate your RoadGuard account.' 
                        : 'You requested a password reset for your RoadGuard account. Use the code below to create a new password.'}
                    </p>
                    
                    <!-- OTP Code Box -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="background-color: #f8fafc; border: 3px solid #2563eb; border-radius: 12px; padding: 25px;">
                          <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">
                            ${otp}
                          </div>
                          <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">
                            Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Instructions -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 6px 6px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                        <strong>Instructions:</strong> 
                        ${type === 'verification' 
                          ? 'Enter this code on the verification page to complete your account setup.' 
                          : 'Enter this code on the password reset page to create a new password.'}
                      </p>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.4;">
                        <strong>Security Notice:</strong> If you didn't request this ${type}, please ignore this email. This code will expire automatically.
                      </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 13px; margin: 30px 0 0 0; line-height: 1.4;">
                      This is an automated message from RoadGuard. Please do not reply to this email. 
                      If you need help, please contact our support team.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
                      © 2025 RoadGuard. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      This email was sent to you because you have an account with RoadGuard.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Email validation helper
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async testConnection() {
    try {
      console.log('🔄 Testing Brevo SMTP connection...');
      const verified = await this.transporter.verify();
      
      if (verified) {
        console.log('✅ Brevo SMTP connection verified successfully');
        
        // Send a test email to verify complete functionality
        if (process.env.NODE_ENV !== 'production') {
          await this.sendTestEmail();
        }
        
        return true;
      } else {
        console.error('❌ Brevo SMTP connection verification failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Brevo SMTP connection test failed:', error.message);
      console.error('❌ Please check your SMTP credentials and network connectivity');
      return false;
    }
  }

  async sendTestEmail() {
    try {
      const testEmail = process.env.BREVO_FROM_EMAIL;
      if (!testEmail) {
        console.log('⚠️ Skipping test email - BREVO_FROM_EMAIL not configured');
        return;
      }

      const testMsg = {
        from: {
          name: process.env.BREVO_FROM_NAME || 'RoadGuard',
          address: process.env.BREVO_FROM_EMAIL
        },
        to: testEmail,
        subject: 'Brevo SMTP Test - RoadGuard System',
        text: 'This is a test email to verify Brevo SMTP configuration is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #2563eb;">✅ Brevo SMTP Test Successful</h2>
              <p>This test email confirms that your RoadGuard system can successfully send emails via Brevo SMTP.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(testMsg);
      console.log('✅ Brevo test email sent successfully:', info.messageId);
    } catch (error) {
      console.error('⚠️ Test email failed (non-critical):', error.message);
    }
  }

  async sendWelcomeEmail(email, firstName) {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      const mailOptions = {
        from: {
          name: process.env.BREVO_FROM_NAME || 'RoadGuard',
          address: process.env.BREVO_FROM_EMAIL
        },
        to: email.toLowerCase().trim(),
        subject: 'Welcome to RoadGuard! 🎉',
        text: `Welcome ${firstName}! Your account has been successfully verified and is now active. You can now access all features of RoadGuard to manage your vehicles efficiently.`,
        html: this.generateWelcomeEmail(firstName),
        headers: {
          'X-Category': 'welcome',
          'X-Mailer': 'RoadGuard-System'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Welcome email failed:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  generateWelcomeEmail(firstName) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to RoadGuard</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="background-color: #10b981; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Welcome to RoadGuard! 🎉</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hello ${firstName}!</h2>
                    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                      Congratulations! Your RoadGuard account has been successfully verified and is now active.
                    </p>
                    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                      You can now access all features of RoadGuard to efficiently manage your vehicles, track maintenance, and stay on top of important updates.
                    </p>
                    <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                      Thank you for choosing RoadGuard!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Method to check SMTP status and provide debugging info
  async checkSMTPStatus() {
    try {
      console.log('📊 Checking Brevo SMTP status...');
      console.log('SMTP Host:', process.env.BREVO_SMTP_HOST);
      console.log('SMTP Port:', process.env.BREVO_SMTP_PORT);
      console.log('SMTP User:', process.env.BREVO_SMTP_USER);
      console.log('From Email:', process.env.BREVO_FROM_EMAIL);
      
      // Test connection
      const isConnected = await this.testConnection();
      
      console.log('📝 SMTP Deliverability Tips:');
      console.log('   ✓ Ensure from email is verified in Brevo');
      console.log('   ✓ Check recipient spam/junk folders');
      console.log('   ✓ Monitor Brevo dashboard for delivery statistics');
      console.log('   ✓ Use proper SPF/DKIM records for your domain');
      
      return isConnected;
    } catch (error) {
      console.error('❌ Error checking SMTP status:', error);
      return false;
    }
  }

  // Gracefully close the SMTP connection
  async closeConnection() {
    try {
      this.transporter.close();
      console.log('📧 SMTP connection closed');
    } catch (error) {
      console.error('❌ Error closing SMTP connection:', error);
    }
  }
}

export default new EmailService();