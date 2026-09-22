const escapeHtml = (str: string): string =>
	str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

const emailFooter = `
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
  <p style="font-size:12px;color:#999;text-align:center;font-family:sans-serif;">
    © ${new Date().getFullYear()} Sizul. All rights reserved.
  </p>
`;

const wrap = (content: string, preheader: string) => `
  <div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(preheader)}
  </div>
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
    ${content}
    ${emailFooter}
  </div>
`;

/* ============================================================
   Templates
   ============================================================ */

export const verificationEmailTemplate = (name: string, url: string) =>
	wrap(
		`
      <h2>Verify your email</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Please verify your email address to activate your account.</p>
      <p>
        <a href="${url}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
          Verify Email
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        If the button doesn't work, copy this link: <br/>
        <span style="word-break:break-all;color:#007bff;">${url}</span>
      </p>
    `,
		"Verify your email to activate your Sizul account.",
	);

export const resetPasswordEmailTemplate = (name: string, url: string) =>
	wrap(
		`
      <h2>Reset your password</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received a request to reset your password. This link expires shortly for your security.</p>
      <p>
        <a href="${url}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
          Reset Password
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        If you didn't request this, you can safely ignore this email.
      </p>
    `,
		"Reset your Sizul password.",
	);

export const welcomeEmailTemplate = (name: string) =>
	wrap(
		`
      <h2>Welcome, ${escapeHtml(name)}!</h2>
      <p>Thanks for joining. Your account has been created successfully.</p>
    `,
		`Welcome to Sizul, ${name}!`,
	);

export const otpEmailTemplate = (
	name: string,
	otp: string,
	expirationMinutes: number,
	purpose = "verify your email",
) =>
	wrap(
		`
      <h2>Verification Code</h2>
      <p>Hi ${escapeHtml(name)}, use the code below to ${escapeHtml(purpose)}.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
        <tr>
          <td style="padding:12px 24px;background:#f0f4ff;color:#007bff;font-size:28px;font-weight:bold;letter-spacing:6px;border-radius:4px;font-family:monospace;">
            ${escapeHtml(otp)}
          </td>
        </tr>
      </table>
      <p style="font-size: 13px; color: #666; margin-top: 16px;">
        This code will expire in ${expirationMinutes} minutes. If you didn't request this, please ignore this email.
      </p>
    `,
		`Your verification code is ${otp}. Expires in ${expirationMinutes} minutes.`,
	);