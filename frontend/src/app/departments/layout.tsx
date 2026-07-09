import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Departments | Medilink Health Care",
  description: "Explore Medilink's specialized medical departments including Cardiology, Neurology, Orthopedics and Pediatrics.",
  openGraph: {
    title: "Medical Departments | Medilink Health Care",
    description: "Explore Medilink's specialized medical departments including Cardiology, Neurology, Orthopedics and Pediatrics.",
    url: "https://www.medilinkhealth.com/departments",
    siteName: "Medilink Health Care",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medical Departments | Medilink Health Care",
    description: "Explore Medilink's specialized medical departments including Cardiology, Neurology, Orthopedics and Pediatrics.",
  },
  alternates: { canonical: "https://www.medilinkhealth.com/departments" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
