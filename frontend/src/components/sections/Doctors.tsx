"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SectionHeading } from "@/components/public/SectionHeading";
import { createClient } from "@/lib/supabase/client";

type Doctor = {
  id: string;
  full_name: string;
  department_name: string;
  qualification: string | null;
  experience_years: number;
  consultation_fee: number;
};

type DoctorRow = {
  id: string;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
  departments:
    | { name: string | null }
    | { name: string | null }[]
    | null;
};

function firstItem<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      const supabase = createClient();

      const { data } = await supabase
        .from("doctors")
        .select(`
          id,
          qualification,
          experience_years,
          consultation_fee,
          profiles:profile_id ( full_name ),
          departments:department_id ( name )
        `)
        .eq("is_available", true)
        .order("created_at", { ascending: true })
        .limit(3);

      const rows = (data ?? []) as DoctorRow[];

      setDoctors(
        rows.map((d) => {
          const prof = firstItem(d.profiles);
          const dept = firstItem(d.departments);

          return {
            id: d.id,
            full_name: prof?.full_name ? `Dr. ${prof.full_name}` : "Doctor",
            department_name: dept?.name ?? "General Medicine",
            qualification: d.qualification,
            experience_years: d.experience_years ?? 0,
            consultation_fee: d.consultation_fee ?? 0,
          };
        })
      );

      setLoading(false);
    }

    fetchDoctors();
  }, []);

  return (
    <section id="doctors" className="relative overflow-hidden py-14">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Doctors"
          title="Meet Our Specialist Doctors"
          description="Real available doctors from the Medilink system."
        />

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : doctors.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">
            No doctors available right now.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc) => (
              <div key={doc.id} className="glass-card rounded-3xl p-6">
                <p className="text-sm font-bold text-primary">
                  {doc.department_name}
                </p>

                <h3 className="mt-2 font-display text-xl font-bold text-foreground">
                  {doc.full_name}
                </h3>

                {doc.qualification && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    🎓 {doc.qualification}
                  </p>
                )}

                <p className="mt-2 text-sm text-muted-foreground">
                  ⭐ {doc.experience_years}+ Years Experience
                </p>

                <p className="mt-3 font-bold text-primary">
                  Fee: ৳{doc.consultation_fee}
                </p>

                <Link
                  href={`/appointment?doc=${doc.id}`}
                  className="mt-5 inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Book Visit
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/doctors" className="font-bold text-primary hover:underline">
            View All Doctors →
          </Link>
        </div>
      </div>
    </section>
  );
}