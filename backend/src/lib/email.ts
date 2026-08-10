import { config } from "./config";
import logger from "./logger";

interface SendEmailParams {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({
  toEmail,
  toName,
  subject,
  htmlContent,
}: SendEmailParams): Promise<boolean> {
  const { brevoApiKey, brevoSenderEmail, brevoSenderName } = config;

  if (!brevoApiKey) {
    logger.warn("Brevo email send skipped: BREVO_API_KEY is not configured.");
    return false;
  }

  try {
    const payload = {
      sender: {
        name: brevoSenderName,
        email: brevoSenderEmail,
      },
      to: [
        {
          email: toEmail,
          name: toName || toEmail,
        },
      ],
      subject,
      htmlContent,
    };

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const responseText = await res.text();
      logger.error(`Brevo SMTP send failed with status ${res.status}`, responseText);
      return false;
    }

    logger.info(`Brevo email successfully sent to ${toEmail} with subject: "${subject}"`);
    return true;
  } catch (error) {
    logger.error("Unexpected error occurred while calling Brevo SMTP API", error);
    return false;
  }
}
