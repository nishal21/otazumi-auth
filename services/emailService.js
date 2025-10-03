/**
 * EmailService - Handles email sending
 * 
 * NOTE: This is a mock service for development.
 * In production, integrate with actual email service:
 * - SendGrid: https://sendgrid.com
 * - Mailgun: https://mailgun.com
 * - AWS SES: https://aws.amazon.com/ses/
 * - Resend: https://resend.com
 */

/**
 * Send verification email
 */
export async function sendVerificationEmail(email, username, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  console.log('📧 Verification Email');
  console.log('To:', email);
  console.log('Username:', username);
  console.log('Verification URL:', verificationUrl);

  // TODO: Integrate with email service
  /*
  Example with SendGrid:
  
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Verify your email - Otazumi',
    html: `
      <h1>Welcome to Otazumi, ${username}!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
  });
  */

  return { success: true };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, username, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  console.log('📧 Password Reset Email');
  console.log('To:', email);
  console.log('Username:', username);
  console.log('Reset URL:', resetUrl);

  // TODO: Integrate with email service
  /*
  await sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Reset your password - Otazumi',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${username},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  });
  */

  return { success: true };
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email, username) {
  console.log('📧 Welcome Email');
  console.log('To:', email);
  console.log('Username:', username);

  // TODO: Integrate with email service
  /*
  await sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Welcome to Otazumi!',
    html: `
      <h1>Welcome to Otazumi, ${username}!</h1>
      <p>Your account is now verified and ready to use.</p>
      <p>Enjoy watching anime!</p>
    `
  });
  */

  return { success: true };
}

/**
 * Send account deletion confirmation email
 */
export async function sendAccountDeletionEmail(email, username) {
  console.log('📧 Account Deletion Email');
  console.log('To:', email);
  console.log('Username:', username);

  // TODO: Integrate with email service
  /*
  await sgMail.send({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Account Deleted - Otazumi',
    html: `
      <h1>Account Deleted</h1>
      <p>Hi ${username},</p>
      <p>Your Otazumi account has been successfully deleted.</p>
      <p>We're sorry to see you go. If you change your mind, you can always create a new account.</p>
    `
  });
  */

  return { success: true };
}
