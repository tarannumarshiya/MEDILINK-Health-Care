import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Specialist Doctors | Medilink Health Care",
  description: "Meet Medilink's team of certified, experienced specialists across 11 medical departments.",
  openGraph: {
    title: "Our Specialist Doctors | Medilink Health Care",
    description: "Meet Medilink's team of certified, experienced specialists across 11 medical departments.",
    url: "https://www.medilinkhealth.com/doctors",
    siteName: "Medilink Health Care",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Specialist Doctors | Medilink Health Care",
    description: "Meet Medilink's team of certified, experienced specialists across 11 medical departments.",
  },
  alternates: { canonical: "https://www.medilinkhealth.com/doctors" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
