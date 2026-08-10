import { config } from "./config";
import logger from "./logger";

interface WhatsAppAppointmentParams {
  recipientPhone: string;
  patientName: string;
  appointmentCode: string;
  date: string;
  time: string;
}

interface WhatsAppLabParams {
  recipientPhone: string;
  patientName: string;
  testType: string;
}

/**
 * Sends a WhatsApp notification using Meta's WhatsApp Business Cloud API.
 * Calls: POST https://graph.facebook.com/v20.0/{phone_number_id}/messages
 */
export async function sendWhatsAppNotification(
  recipientPhone: string,
  templateName: string,
  parameters: Array<{ type: string; text: string }>
): Promise<boolean> {
  const { metaWaPhoneNumberId, metaWaAccessToken } = config;

  if (!metaWaPhoneNumberId || !metaWaAccessToken) {
    logger.warn(`WhatsApp notification skipped for ${recipientPhone}: Meta keys are not configured.`);
    return false;
  }

  // Clean phone number (remove spaces, dashes, ensuring country code prefix is present)
  const cleanedPhone = recipientPhone.replace(/[^0-9]/g, "");

  try {
    const payload = {
      messaging_product: "whatsapp",
      to: cleanedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US",
        },
        components: [
          {
            type: "body",
            parameters,
          },
        ],
      },
    };

    const url = `https://graph.facebook.com/v20.0/${metaWaPhoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${metaWaAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error(`Meta WhatsApp send failed with status ${res.status}`, errorText);
      return false;
    }

    logger.info(`Meta WhatsApp successfully sent to ${cleanedPhone} using template: "${templateName}"`);
    return true;
  } catch (error) {
    logger.error("Unexpected error occurred while calling Meta WhatsApp Cloud API", error);
    return false;
  }
}

export async function sendWhatsAppAppointmentNotification({
  recipientPhone,
  patientName,
  appointmentCode,
  date,
  time,
}: WhatsAppAppointmentParams): Promise<boolean> {
  return sendWhatsAppNotification(recipientPhone, "appointment_confirmation", [
    { type: "text", text: patientName },
    { type: "text", text: appointmentCode },
    { type: "text", text: date },
    { type: "text", text: time },
  ]);
}

export async function sendWhatsAppLabNotification({
  recipientPhone,
  patientName,
  testType,
}: WhatsAppLabParams): Promise<boolean> {
  return sendWhatsAppNotification(recipientPhone, "lab_report_ready", [
    { type: "text", text: patientName },
    { type: "text", text: testType },
  ]);
}
