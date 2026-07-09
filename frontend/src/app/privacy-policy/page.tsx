import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { hospitalInfo } from "@/lib/constants";

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              At {hospitalInfo.name}, we respect the privacy of patients,
              visitors, doctors, staff, and partners. This Privacy Policy
              explains how we collect, use, store, and protect personal and
              healthcare-related information shared through our website and
              digital healthcare services.
            </p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  1. Information We Collect
                </h2>
                <p className="mt-2">
                  We may collect information such as name, phone number, email
                  address, appointment details, department selection, symptoms,
                  medical service requests, prescription details, diagnostic
                  requests, pharmacy requests, insurance support details, and
                  emergency support information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  2. How We Use Information
                </h2>
                <p className="mt-2">
                  Information is used to process appointments, support patient
                  care, manage doctor consultations, handle laboratory and
                  pharmacy services, provide emergency assistance, improve user
                  experience, and communicate important service updates.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  3. Protection of Medical Information
                </h2>
                <p className="mt-2">
                  We follow reasonable administrative, technical, and operational
                  safeguards to protect personal and medical information from
                  unauthorized access, misuse, loss, alteration, or disclosure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  4. Sharing of Information
                </h2>
                <p className="mt-2">
                  Patient information may be shared only with authorized doctors,
                  hospital staff, laboratory teams, pharmacy teams, insurance
                  support teams, or emergency teams when required to provide
                  healthcare services. We do not sell personal medical
                  information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  5. Contact
                </h2>
                <p className="mt-2">
                  For privacy-related questions, contact us at{" "}
                  <a
                    href={`mailto:${hospitalInfo.email}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {hospitalInfo.email}
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