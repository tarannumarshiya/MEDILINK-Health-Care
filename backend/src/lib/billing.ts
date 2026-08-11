import { getServiceClient } from "./supabase";
import { generateInvoiceCode } from "./ids";

export const LAB_CHARGE_PER_REQUEST = 200;
export const MEDICINE_CHARGE_PER_QTY = 50;

interface InvoiceOptions {
  /** Include consultation fee (always true) */
  includeConsultation?: boolean;
  /** Include lab charges — only true if doctor requested lab tests */
  includeLab?: boolean;
  /** Include medicine charges — only true if doctor prescribed medicines */
  includeMedicine?: boolean;
}

/**
 * Automatically generates an invoice for an appointment.
 *
 * Invoice logic:
 * - Consultation fee: ALWAYS included (doctor's fee for the visit)
 * - Lab charges: ONLY included if doctor explicitly requested lab tests
 * - Medicine charges: ONLY included if doctor explicitly prescribed medicines
 *
 * If the patient doesn't want tests or medicines, the doctor simply doesn't
 * check those boxes, and the invoice only contains the consultation fee.
 */
export async function generateInvoiceForAppointment(
  appointmentId: string,
  options: InvoiceOptions = {}
) {
  const {
    includeConsultation = true,
    includeLab = true,
    includeMedicine = true,
  } = options;

  // 1. Fetch appointment details
  const { data: appointment, error: apptError } = await getServiceClient()
    .from("appointments")
    .select("id, patient_id, patient_name, doctor_id, lab_required")
    .eq("id", appointmentId)
    .single();

  if (apptError || !appointment) {
    console.error("Billing: Appointment not found", apptError);
    return null;
  }

  // 2. Consultation fee — ALWAYS included
  let consultationCharge = 0;
  if (includeConsultation && appointment.doctor_id) {
    const { data: doctor } = await getServiceClient()
      .from("doctors")
      .select("consultation_fee")
      .eq("id", appointment.doctor_id)
      .single();
    if (doctor) {
      consultationCharge = Number(doctor.consultation_fee) || 0;
    }
  }

  // 3. Lab charges — ONLY if doctor requested lab tests
  let labCharge = 0;
  if (includeLab) {
    const { data: labTests } = await getServiceClient()
      .from("lab_tests")
      .select("id")
      .eq("appointment_id", appointmentId);

    if (labTests && labTests.length > 0) {
      labCharge = LAB_CHARGE_PER_REQUEST * labTests.length;
    }
  }

  // 4. Medicine charges — ONLY if doctor prescribed medicines
  let medicineCharge = 0;
  if (includeMedicine) {
    const { data: prescriptions } = await getServiceClient()
      .from("prescriptions")
      .select("id")
      .eq("appointment_id", appointmentId);

    if (prescriptions && prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map((p: any) => p.id);
      const { data: items } = await getServiceClient()
        .from("prescription_items")
        .select("quantity")
        .in("prescription_id", prescriptionIds);

      if (items) {
        medicineCharge = items.reduce(
          (sum: number, m: any) => sum + (Number(m.quantity) || 1) * MEDICINE_CHARGE_PER_QTY,
          0
        );
      }
    }
  }

  const total = consultationCharge + labCharge + medicineCharge;

  // Don't generate invoice if total is zero
  if (total <= 0) {
    console.warn("Billing: Invoice total is zero, skipping generation");
    return null;
  }

  // 5. Check if invoice already exists for this appointment
  const { data: existingInvoice } = await getServiceClient()
    .from("invoices")
    .select("id, invoice_code, consultation_charge, lab_charge, medicine_charge, total, status")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (existingInvoice) {
    // Update existing invoice — only add charges that weren't already included
    const newLabCharge = Math.max(Number(existingInvoice.lab_charge) || 0, labCharge);
    const newMedicineCharge = Math.max(Number(existingInvoice.medicine_charge) || 0, medicineCharge);
    const newTotal = consultationCharge + newLabCharge + newMedicineCharge;

    const { data: invoice, error: invoiceError } = await getServiceClient()
      .from("invoices")
      .update({
        consultation_charge: consultationCharge,
        lab_charge: newLabCharge,
        medicine_charge: newMedicineCharge,
        total: newTotal,
      })
      .eq("id", existingInvoice.id)
      .select()
      .single();

    if (invoiceError) {
      console.error("Invoice update failed:", invoiceError.message);
      return null;
    }
    return invoice;
  }

  // 6. Generate new Invoice
  const { data: invoice, error: invoiceError } = await getServiceClient()
    .from("invoices")
    .insert({
      invoice_code: generateInvoiceCode(),
      patient_id: appointment.patient_id ?? null,
      appointment_id: appointmentId,
      patient_name: appointment.patient_name ?? null,
      consultation_charge: consultationCharge,
      lab_charge: labCharge,
      medicine_charge: medicineCharge,
      insurance_deduction: 0,
      total,
      status: "UNPAID",
    })
    .select()
    .single();

  if (invoiceError) {
    console.error("Invoice auto-generation failed:", invoiceError.message);
    return null;
  }

  // 6. Update appointment status to INVOICE_GENERATED
  await getServiceClient().from("appointments").update({
    status: "INVOICE_GENERATED",
    updated_at: new Date().toISOString(),
  }).eq("id", appointmentId);

  return invoice;
}
