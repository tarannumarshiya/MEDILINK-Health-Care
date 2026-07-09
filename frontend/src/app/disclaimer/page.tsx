import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { hospitalInfo } from "@/lib/constants";

export default function DisclaimerPage() {
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
              Disclaimer
            </h1>

            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              The information provided on the {hospitalInfo.name} website is
              intended for general healthcare service awareness and digital
              hospital support. It should not replace consultation with a
              qualified medical professional.
            </p>

            <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  1. Medical Advice
                </h2>
                <p className="mt-2">
                  Website content, service descriptions, health package details,
                  appointment options, and general healthcare information should
                  not be considered medical advice, diagnosis, or treatment.
                  Always consult a qualified doctor for medical concerns.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  2. Emergency Situations
                </h2>
                <p className="mt-2">
                  In a medical emergency, users should immediately contact
                  emergency services or visit the nearest hospital. Online
                  forms, tracking pages, and website messages may not be suitable
                  for urgent life-threatening conditions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  3. Accuracy of Information
                </h2>
                <p className="mt-2">
                  We try to keep service information accurate and updated.
                  However, doctor availability, department timing, service
                  charges, medicine availability, insurance support, and package
                  details may change without prior notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  4. Third-Party Services
                </h2>
                <p className="mt-2">
                  Some services may involve third-party providers such as
                  insurance partners, payment gateways, diagnostic partners, or
                  map services. Their policies and availability may apply
                  separately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground">
                  5. Contact
                </h2>
                <p className="mt-2">
                  For questions about this disclaimer, contact us at{" "}
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