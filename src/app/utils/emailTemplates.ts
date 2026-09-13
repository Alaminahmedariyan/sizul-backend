export const verificationEmailTemplate = (name: string, url: string) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Verify your email</h2>
    <p>Hi ${name},</p>
    <p>Please verify your email address to activate your account.</p>
    <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
    <p style="font-size: 13px; color: #666;">If the button doesn't work, copy this link: ${url}</p>
  </div>
`;

export const resetPasswordEmailTemplate = (name: string, url: string) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. This link expires shortly for your security.</p>
    <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
    <p style="font-size: 13px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
  </div>
`;

export const welcomeEmailTemplate = (name: string) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Welcome, ${name}!</h2>
    <p>Thanks for joining. Your account has been created successfully.</p>
  </div>
`;

export const otpEmailTemplate = (name: string, otp: string, expirationMinutes: number, purpose = "verify your email") => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    <h2>Verification Code</h2>
    <p>Hi ${name}, use the code below to ${purpose}.</p>
    <div style="display:inline-block;padding:12px 24px;background:#f0f4ff;color:#007bff;font-size:28px;font-weight:bold;letter-spacing:8px;border-radius:4px;margin-top:20px;">${otp}</div>
    <p style="font-size: 13px; color: #666; margin-top: 16px;">This code will expire in ${expirationMinutes} minutes. If you didn't request this, please ignore this email.</p>
  </div>
`;