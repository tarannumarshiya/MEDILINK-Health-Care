import { redirect } from "next/navigation";

export default function RedirectToResetPassword() {
  redirect("/reset-password");
}
