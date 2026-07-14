import { config } from "dotenv";
config();
import { serviceClient } from "./src/lib/supabase";

async function run() {
  const { data: claims } = await serviceClient.from("insurance_claims").select("*").limit(1);
  if (!claims || claims.length === 0) {
    console.log("No claims found");
    return;
  }
  const claim = claims[0];
  console.log("Testing reject on claim", claim.id);

  const { data, error } = await serviceClient
    .from("insurance_claims")
    .update({ status: "REJECTED", decision_reason: "Test rejection" })
    .eq("id", claim.id).select().single();

  console.log("Result:", { data, error });
}
run();
