import { config } from "./config";
import logger from "./logger";

interface SMSParams {
  recipientPhone: string;
  message: string;
}

/**
 * Sends an SMS message using a standardized Twilio API integration template.
 * Calls: POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
 */
export async function sendSMS({ recipientPhone, message }: SMSParams): Promise<boolean> {
  const { twilioAccountSid, twilioAuthToken, twilioPhoneNumber } = config;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    logger.warn(`SMS skipped for ${recipientPhone}: Twilio credentials are not configured.`);
    return false;
  }

  try {
    const cleanedPhone = recipientPhone.replace(/[^0-9+]/g, ""); // Keep country code '+' prefix
    const basicAuth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");

    const formData = new URLSearchParams();
    formData.append("To", cleanedPhone);
    formData.append("From", twilioPhoneNumber);
    formData.append("Body", message);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error(`SMS send failed with status ${res.status}`, errorText);
      return false;
    }

    logger.info(`SMS successfully sent to ${cleanedPhone}: "${message.substring(0, 30)}..."`);
    return true;
  } catch (error) {
    logger.error("Unexpected error occurred while calling SMS Gateway API", error);
    return false;
  }
}
