const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function sendEmailViaResendApi({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!resendApiKey) {
        console.warn(`[Resend API Key Missing - Simulated Email] To: ${to} | Subject: ${subject}`);
        return { success: true, simulated: true };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `ChapterChat <${fromEmail}>`,
                to: [to],
                subject,
                html,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Resend API error:', data);
            return { success: false, error: data.message || 'Failed to send email via Resend API' };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to send email via Resend REST API:', error);
        return { success: false, error: error.message || 'Network error sending email' };
    }
}

/**
 * Send OTP for email verification upon registration
 */
export async function sendVerificationOtpEmail(email: string, otp: string) {
    const subject = 'ChapterChat - Verify your account code';
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #1b1714; color: #f3efe6; border-radius: 16px; border: 1px solid #362e28;">
      <h2 style="color: #663820; margin-bottom: 20px; font-size: 24px;">Welcome to ChapterChat 📚</h2>
      <p style="font-size: 15px; color: #cfc7ba; line-height: 1.6;">
        Thank you for signing up! Please use the following 6-digit code to verify your email address:
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <span style="display: inline-block; background: #2a2016; color: #f5c879; border: 1px solid #663820; letter-spacing: 8px; font-size: 32px; font-weight: bold; padding: 12px 24px; border-radius: 10px;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 13px; color: #9c9284;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
    `;

    return sendEmailViaResendApi({ to: email, subject, html });
}

/**
 * Send OTP for Password Reset
 */
export async function sendPasswordResetOtpEmail(email: string, otp: string) {
    const subject = 'ChapterChat - Password Reset OTP';
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #1b1714; color: #f3efe6; border-radius: 16px; border: 1px solid #362e28;">
      <h2 style="color: #663820; margin-bottom: 20px; font-size: 24px;">Reset Your Password 🔐</h2>
      <p style="font-size: 15px; color: #cfc7ba; line-height: 1.6;">
        We received a request to reset your password for your ChapterChat account. Use the OTP code below to set a new password:
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <span style="display: inline-block; background: #2a2016; color: #f5c879; border: 1px solid #663820; letter-spacing: 8px; font-size: 32px; font-weight: bold; padding: 12px 24px; border-radius: 10px;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 13px; color: #9c9284;">This OTP is valid for 10 minutes. If you did not request a password reset, your account is safe.</p>
    </div>
    `;

    return sendEmailViaResendApi({ to: email, subject, html });
}

/**
 * Send email when account is blocked by Admin
 */
export async function sendAccountBlockedEmail(email: string, name: string, reason?: string) {
    const subject = 'ChapterChat - Account Notice: Access Suspended';
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background-color: #faf8f5; color: #212a3b; border-radius: 16px; border: 1px solid #e7ded0;">
      <h2 style="color: #991b1b; margin-bottom: 16px; font-size: 22px; font-family: Georgia, serif;">Account Access Suspended</h2>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        Your ChapterChat account (<code>${email}</code>) has been suspended by an administrator.
      </p>
      ${reason ? `
      <div style="margin: 20px 0; padding: 14px 18px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; font-size: 13px;">
        <strong>Reason for suspension:</strong> ${reason}
      </div>
      ` : ''}
      <p style="font-size: 13px; color: #666; line-height: 1.5; margin-top: 20px;">
        If you believe this was done in error or would like to request an appeal, please reply to this email or contact support.
      </p>
    </div>
    `;

    return sendEmailViaResendApi({ to: email, subject, html });
}

/**
 * Send email when account is unblocked by Admin
 */
export async function sendAccountUnblockedEmail(email: string, name: string) {
    const subject = 'ChapterChat - Account Notice: Access Restored';
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background-color: #faf8f5; color: #212a3b; border-radius: 16px; border: 1px solid #e7ded0;">
      <h2 style="color: #166534; margin-bottom: 16px; font-size: 22px; font-family: Georgia, serif;">Account Restored</h2>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        Great news! Your ChapterChat account access has been restored. You can now sign in and access your personal library as usual.
      </p>
    </div>
    `;

    return sendEmailViaResendApi({ to: email, subject, html });
}

/**
 * Send email when account is deleted by Admin
 */
export async function sendAccountDeletedEmail(email: string, name: string, reason?: string) {
    const subject = 'ChapterChat - Account Notice: Account Deleted';
    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; background-color: #faf8f5; color: #212a3b; border-radius: 16px; border: 1px solid #e7ded0;">
      <h2 style="color: #991b1b; margin-bottom: 16px; font-size: 22px; font-family: Georgia, serif;">Account Deletion Notice</h2>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        Hello <strong>${name}</strong>,
      </p>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        This email is to notify you that your ChapterChat account (<code>${email}</code>) and associated library data have been removed by an administrator.
      </p>
      ${reason ? `
      <div style="margin: 20px 0; padding: 14px 18px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; font-size: 13px;">
        <strong>Reason:</strong> ${reason}
      </div>
      ` : ''}
    </div>
    `;

    return sendEmailViaResendApi({ to: email, subject, html });
}
