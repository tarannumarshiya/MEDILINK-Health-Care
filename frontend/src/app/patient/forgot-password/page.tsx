import { redirect } from "next/navigation";

export default function RedirectToForgotPassword() {
  redirect("/forgot-password");
}
