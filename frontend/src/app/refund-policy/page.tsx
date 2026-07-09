import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { hospitalInfo } from "@/lib/constants";

export default function RefundPolicyPage() {
  return (
    <>
      <PublicNavbar />

      <main className="min-h-screen bg-background">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Legal Information
            </p>

            <h1 className="mt-3 font-display text-4xl font-bold text-foreground">
              Refund Policy
            </h1>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              This Refund Policy explains how refund requests may be handled for
              eligible healthcare services, appointments, diagnostic bookings,
              packages, or other paid services provided through{" "}
              {hospitalInfo.name}.
            </p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  1. Eligibility for Refund
                </h2>
                <p className="mt-2">
                  Refund eligibility depends on the type of service, payment
                  status, appointment status, cancellation timing, and whether
                  the service has already been started or completed.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  2. Non-Refundable Services
                </h2>
                <p className="mt-2">
                  Services that have already been completed, medicines already
                  dispensed, diagnostic tests already processed, emergency
                  services already delivered, or third-party insurance-related
                  charges may not be refundable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  3. Refund Processing
                </h2>
                <p className="mt-2">
                  Approved refunds may take several business days to process,
                  depending on the payment method, bank, payment gateway, and
                  verification requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  4. Cancellation
                </h2>
                <p className="mt-2">
                  Appointment cancellations should be requested as early as
                  possible. Late cancellations or missed appointments may be
                  subject to hospital policy and may not qualify for a refund.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  5. Contact
                </h2>
                <p className="mt-2">
                  For refund-related support, contact us at{" "}
                  <a
                    href={`mailto:${hospitalInfo.support}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {hospitalInfo.support}
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}