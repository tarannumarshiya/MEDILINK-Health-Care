import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, CheckCircle2 } from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

const departmentDetails = {
  cardiology: {
    name: "Cardiology",
    color: "#3b82f6",
    bg: "/departments/cardiology.png",
    desc: "Specialized care for heart health, blood pressure, chest pain, and cardiovascular conditions.",
    services: ["ECG support", "Heart consultation", "Cardiac monitoring", "Blood pressure management"],
  },
  orthopedics: {
    name: "Orthopedics",
    color: "#f59e0b",
    bg: "/departments/orthopedics.png",
    desc: "Diagnosis and care for bones, joints, spine, fractures, and mobility-related problems.",
    services: ["Joint pain care", "Fracture support", "Spine consultation", "Sports injury care"],
  },
  neurology: {
    name: "Neurology",
    color: "#a855f7",
    bg: "/departments/neurology.png",
    desc: "Care for brain, nerves, headaches, stroke symptoms, seizures, and nervous system conditions.",
    services: ["Headache care", "Nerve evaluation", "Stroke support", "Seizure consultation"],
  },
  pediatrics: {
    name: "Pediatrics",
    color: "#10b981",
    bg: "/departments/pediatrics.png",
    desc: "Child-focused healthcare for infants, children, and adolescents.",
    services: ["Child consultation", "Growth monitoring", "Vaccination guidance", "Nutrition support"],
  },
  dermatology: {
    name: "Dermatology",
    color: "#f472b6",
    bg: "/departments/dermatology.png",
    desc: "Skin, hair, allergy, acne, and aesthetic healthcare support.",
    services: ["Skin consultation", "Hair care", "Allergy support", "Acne treatment guidance"],
  },
  "general-medicine": {
    name: "General Medicine",
    color: "#059669",
    bg: "/departments/general-medicine.png",
    desc: "Primary healthcare support for fever, infections, chronic illness, and general health concerns.",
    services: ["Fever care", "General checkup", "Chronic care", "Preventive consultation"],
  },
};

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = departmentDetails[slug as keyof typeof departmentDetails];

  if (!dept) notFound();

  return (
    <>
      <PublicNavbar />

      <main className="pt-28">
        <section className="mx-auto max-w-6xl px-6 py-16">
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Departments
          </Link>

          <div className="mt-8 overflow-hidden rounded-3xl glass-card">
            <div
              className="relative min-h-[460px] bg-cover bg-center"
              style={{ backgroundImage: `url(${dept.bg})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />

              <div
                className="absolute inset-0 opacity-35 mix-blend-multiply"
                style={{ background: "oklch(0.55 0.10 210)" }}
              />

              <div
                className="absolute inset-0 opacity-25"
                style={{ background: dept.color }}
              />

              <div
                className="absolute left-0 top-0 h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${dept.color}, ${dept.color}88)`,
                }}
              />

              <div className="relative z-10 flex min-h-[460px] flex-col justify-end p-8 text-white sm:p-12">
                <span
                  className="mb-5 w-fit rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white"
                  style={{
                    background: `${dept.color}66`,
                    border: `1px solid ${dept.color}`,
                  }}
                >
                  Department
                </span>

                <h1 className="font-display text-4xl font-extrabold sm:text-6xl">
                  {dept.name}
                </h1>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/90">
                  {dept.desc}
                </p>

                <Link
                  href={`/appointment?department=${slug}`}
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${dept.color}, ${dept.color}cc)`,
                  }}
                >
                  <CalendarCheck size={18} />
                  Book Appointment
                </Link>
              </div>
            </div>

            <div className="p-8 sm:p-12">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Key Services
              </h2>

              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {dept.services.map((service) => (
                  <li key={service} className="flex items-center gap-3">
                    <CheckCircle2 className="shrink-0 text-mint" size={22} />
                    <span className="font-medium text-foreground">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}