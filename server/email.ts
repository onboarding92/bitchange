import nodemailer from "nodemailer";

// SendGrid SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "apikey",
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using SendGrid SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || "BitChange Pro"} <${process.env.SMTP_FROM_EMAIL || "info@bitchangemoney.xyz"}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BitChange Pro! 🚀</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for joining BitChange Pro, your professional cryptocurrency exchange platform.</p>
          
          <p><strong>What you can do now:</strong></p>
          <ul>
            <li>✅ Deposit cryptocurrencies to your wallet</li>
            <li>📊 Start trading with advanced charts and indicators</li>
            <li>💰 Track your portfolio performance in real-time</li>
            <li>🎯 Set price alerts for your favorite coins</li>
          </ul>

          <a href="https://www.bitchangemoney.xyz/dashboard" class="button">Go to Dashboard</a>

          <p>If you have any questions, feel free to contact our support team.</p>
          
          <p>Happy Trading!<br>The BitChange Pro Team</p>
        </div>
        <div class="footer">
          <p>© 2026 BitChange Pro. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to BitChange Pro! 🚀",
    html,
  });
}

/**
 * Send email verification code
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Please use the following verification code to complete your registration:</p>
          
          <div class="code">${code}</div>

          <p><strong>This code will expire in 15 minutes.</strong></p>
          
          <p>If you didn't request this verification, please ignore this email.</p>
          
          <p>Best regards,<br>The BitChange Pro Team</p>
        </div>
        <div class="footer">
          <p>© 2026 BitChange Pro. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your Email - BitChange Pro",
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your BitChange Pro account.</p>
          
          <a href="${resetLink}" class="button">Reset Password</a>

          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetLink}</p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and ensure your account is secure.
          </div>
          
          <p>Best regards,<br>The BitChange Pro Team</p>
        </div>
        <div class="footer">
          <p>© 2026 BitChange Pro. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Password Reset - BitChange Pro",
    html,
  });
}

/**
 * Send deposit confirmation email
 */
export async function sendDepositConfirmationEmail(
  email: string,
  amount: number,
  currency: string,
  txHash: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Deposit Confirmed</h1>
        </div>
        <div class="content">
          <h2>Your deposit has been processed!</h2>
          <p>We've successfully received your deposit. The funds are now available in your account.</p>
          
          <div class="details">
            <div class="detail-row">
              <strong>Amount:</strong>
              <span>${amount} ${currency}</span>
            </div>
            <div class="detail-row">
              <strong>Transaction Hash:</strong>
              <span style="font-size: 12px; word-break: break-all;">${txHash}</span>
            </div>
            <div class="detail-row">
              <strong>Status:</strong>
              <span style="color: #10b981; font-weight: bold;">✅ Confirmed</span>
            </div>
          </div>

          <p>You can now use these funds for trading.</p>
          
          <p>Best regards,<br>The BitChange Pro Team</p>
        </div>
        <div class="footer">
          <p>© 2026 BitChange Pro. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Deposit Confirmed: ${amount} ${currency}`,
    html,
  });
}

/**
 * Send withdrawal confirmation email
 */
export async function sendWithdrawalConfirmationEmail(
  email: string,
  amount: number,
  currency: string,
  address: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💸 Withdrawal Processing</h1>
        </div>
        <div class="content">
          <h2>Your withdrawal is being processed</h2>
          <p>We've received your withdrawal request and it's currently being processed.</p>
          
          <div class="details">
            <div class="detail-row">
              <strong>Amount:</strong>
              <span>${amount} ${currency}</span>
            </div>
            <div class="detail-row">
              <strong>Destination:</strong>
              <span style="font-size: 12px; word-break: break-all;">${address}</span>
            </div>
            <div class="detail-row">
              <strong>Status:</strong>
              <span style="color: #f59e0b; font-weight: bold;">⏳ Processing</span>
            </div>
          </div>

          <p>You'll receive another email once the withdrawal is completed.</p>
          
          <p>Best regards,<br>The BitChange Pro Team</p>
        </div>
        <div class="footer">
          <p>© 2026 BitChange Pro. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Withdrawal Processing: ${amount} ${currency}`,
    html,
  });
}
