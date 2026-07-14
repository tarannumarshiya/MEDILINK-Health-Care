import { config } from "dotenv";
config();
import { serviceClient } from "./src/lib/supabase";

async function run() {
  const { data } = await serviceClient.from("appointments").select("*").order("created_at", { ascending: false }).limit(3);
  console.log(JSON.stringify(data, null, 2));

  const { data: ts } = await serviceClient.from("telemedicine_sessions").select("*").order("scheduled_at", { ascending: false }).limit(3);
  console.log(JSON.stringify(ts, null, 2));
}
run();
