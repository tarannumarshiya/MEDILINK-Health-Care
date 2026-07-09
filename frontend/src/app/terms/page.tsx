import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { hospitalInfo } from "@/lib/constants";

export default function TermsPage() {
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
              Terms & Conditions
            </h1>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              These Terms & Conditions govern the use of {hospitalInfo.name}
              website, appointment services, patient support features, pharmacy
              support, diagnostic services, insurance support, and emergency
              support features.
            </p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  1. Use of Services
                </h2>
                <p className="mt-2">
                  Users must provide accurate information while booking
                  appointments, requesting services, contacting support, or using
                  any healthcare-related feature on the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  2. Healthcare Disclaimer
                </h2>
                <p className="mt-2">
                  Information available on this website is for general service
                  guidance only. It should not be treated as a replacement for
                  professional medical advice, diagnosis, or treatment from a
                  qualified healthcare provider.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  3. Appointments and Availability
                </h2>
                <p className="mt-2">
                  Appointment requests are subject to doctor availability,
                  department availability, emergency priorities, and hospital
                  confirmation. The platform may approve, reschedule, or reject
                  appointment requests based on operational requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  4. User Responsibilities
                </h2>
                <p className="mt-2">
                  Users must not misuse the platform, submit false medical
                  information, attempt unauthorized access, interfere with system
                  operations, or use the platform for unlawful activities.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  5. Contact
                </h2>
                <p className="mt-2">
                  For questions about these terms, contact us at{" "}
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