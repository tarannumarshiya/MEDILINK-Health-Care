import { config } from "dotenv";
config({ path: "backend/.env" });
import { serviceClient } from "./backend/src/lib/supabase";

async function run() {
  const invoiceCode = "INV-2026-457694";
  console.log("Looking up invoice", invoiceCode);
  const { data: inv, error: invErr } = await serviceClient
    .from("invoices").select("*").eq("invoice_code", invoiceCode).maybeSingle();
  
  if (invErr) {
    console.error("invErr:", invErr);
    return;
  }
  console.log("Invoice:", inv);

  if (!inv) return;
  
  const { data, error } = await serviceClient.from("payments").insert({
    invoice_id: inv.id,
    invoice_code: inv.invoice_code,
    amount: inv.total,
    method: "cash",
    status: "COMPLETED",
  });
  
  console.log("Insert result:", { data, error });
}
run();
