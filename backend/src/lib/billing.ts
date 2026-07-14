import { serviceClient } from "./supabase";
import { generateInvoiceCode } from "./ids";

export const LAB_CHARGE_PER_REQUEST = 200;
export const MEDICINE_CHARGE_PER_QTY = 50;

/**
 * Automatically generates an invoice for an appointment,
 * taking into account consultation fees, lab charges, and medicine charges.
 */
export async function generateInvoiceForAppointment(appointmentId: string) {
  // 1. Fetch appointment details
  const { data: appointment, error: apptError } = await serviceClient
    .from("appointments")
    .select("id, patient_id, patient_name, doctor_id")
    .eq("id", appointmentId)
    .single();

  if (apptError || !appointment) {
    console.error("Billing: Appointment not found", apptError);
    return null;
  }

  // 2. Fetch doctor's consultation fee
  let consultationCharge = 0;
  if (appointment.doctor_id) {
    const { data: doctor } = await serviceClient
      .from("doctors")
      .select("consultation_fee")
      .eq("id", appointment.doctor_id)
      .single();
    if (doctor) {
      consultationCharge = Number(doctor.consultation_fee) || 0;
    }
  }

  // 3. Fetch Lab charge (if any lab_tests exist)
  let labCharge = 0;
  const { data: labTests } = await serviceClient
    .from("lab_tests")
    .select("id")
    .eq("appointment_id", appointmentId);
  
  if (labTests && labTests.length > 0) {
    labCharge = LAB_CHARGE_PER_REQUEST * labTests.length;
  }

  // 4. Fetch Pharmacy charge (if any prescriptions exist)
  let medicineCharge = 0;
  const { data: prescriptions } = await serviceClient
    .from("prescriptions")
    .select("id")
    .eq("appointment_id", appointmentId);

  if (prescriptions && prescriptions.length > 0) {
    const prescriptionIds = prescriptions.map((p: any) => p.id);
    const { data: items } = await serviceClient
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

  const total = consultationCharge + labCharge + medicineCharge;

  // 5. Generate Invoice
  const { data: invoice, error: invoiceError } = await serviceClient
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

  // 6. Update appointment status to INVOICE_GENERATED (only if we actually generated it)
  await serviceClient.from("appointments").update({
    status: "INVOICE_GENERATED",
    updated_at: new Date().toISOString(),
  }).eq("id", appointmentId);

  return invoice;
}
