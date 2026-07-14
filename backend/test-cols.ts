import { config } from "dotenv";
config();
import { serviceClient } from "./src/lib/supabase";

async function run() {
  const { data, error } = await serviceClient.from("telemedicine_sessions").select("*").limit(1);
  console.log("Cols:", data && data.length > 0 ? Object.keys(data[0]) : "No data or error", error);
}
run();
