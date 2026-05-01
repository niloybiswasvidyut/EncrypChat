const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function buildOtpEmailHtml(otp) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
          }
          .otp-code {
            background-color: #f0f0f0;
            border: 2px solid #007bff;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #007bff;
            border-radius: 4px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
          }
          .info {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #856404;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset OTP</h1>
          </div>

          <p>Hi,</p>

          <p>You requested to reset your EncrypChat password. Use the following One-Time Password (OTP) to proceed:</p>

          <div class="otp-code">${otp}</div>

          <div class="info">
            <strong>OTP Details:</strong>
            <ul>
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this code with anyone</li>
              <li>You have 5 attempts to verify the OTP</li>
            </ul>
          </div>

          <div class="warning">
            <strong>Security Warning:</strong> If you did not request a password reset, please ignore this email. Your account will remain secure.
          </div>

          <p>If you did not request this password reset, please change your password immediately or contact support.</p>

          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2026 EncrypChat. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<void>}
 */
export async function sendOTPEmail(email, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "EncrypChat";

  if (!apiKey || !senderEmail) {
    const message =
      "Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.";

    if (process.env.NODE_ENV === "development") {
      console.warn(message);
      console.info(`Development OTP preview for ${email}: ${otp}`);
      return;
    }

    throw new Error(message);
  }

  const payload = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [{ email }],
    subject: "Your Password Reset OTP - EncrypChat",
    htmlContent: buildOtpEmailHtml(otp),
    textContent: [
      "Your Password Reset OTP - EncrypChat",
      "",
      `Your OTP is: ${otp}`,
      "",
      "This OTP is valid for 10 minutes only.",
      "Do not share this code with anyone.",
      "You have 5 attempts to verify the OTP.",
    ].join("\n"),
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Brevo email request failed with status ${response.status}: ${errorText || response.statusText}`
      );
    }

    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
}
