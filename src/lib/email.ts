// Simple email service for password reset
// In production, replace this with a real email service like SendGrid, Resend, or AWS SES

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const emailOptions: EmailOptions = {
    to: email,
    subject: 'Reset Your Password - PTO Agent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>You requested to reset your password for your PTO Agent account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 1 hour for security reasons.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this password reset, please ignore this email.
        </p>
      </div>
    `,
    text: `
Reset Your Password - PTO Agent

You requested to reset your password for your PTO Agent account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.
    `
  };

  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Password Reset Email:');
    console.log('To:', emailOptions.to);
    console.log('Subject:', emailOptions.subject);
    console.log('Reset URL:', resetUrl);
    console.log('HTML Content:', emailOptions.html);
    return;
  }

  // In production, you would send the actual email here
  // Example with SendGrid:
  // await sgMail.send(emailOptions);
  
  // Example with Resend:
  // await resend.emails.send(emailOptions);
  
  // Example with AWS SES:
  // await ses.sendEmail(emailOptions);

  console.log('📧 Password reset email would be sent to:', email);
  console.log('📧 Reset URL:', resetUrl);
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const emailOptions: EmailOptions = {
    to: email,
    subject: 'Welcome to PTO Agent!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to PTO Agent!</h2>
        <p>Hi ${name},</p>
        <p>Welcome to PTO Agent! We're excited to help you find permit offices across Georgia.</p>
        <p>You can now:</p>
        <ul>
          <li>Search for permit offices by location</li>
          <li>View detailed office information</li>
          <li>Save your favorite offices</li>
          <li>Access advanced search features</li>
        </ul>
        <p>Get started by visiting your dashboard:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
    `
  };

  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Welcome Email:');
    console.log('To:', emailOptions.to);
    console.log('Subject:', emailOptions.subject);
    return;
  }

  // In production, send the actual email
  console.log('📧 Welcome email would be sent to:', email);
}
