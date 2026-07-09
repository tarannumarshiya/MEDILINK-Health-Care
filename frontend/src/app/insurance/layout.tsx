import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Insurance | Medilink Health Care",
  description: "Medilink partners with leading insurers. Submit and track health insurance claims with complete transparency.",
  openGraph: {
    title: "Health Insurance | Medilink Health Care",
    description: "Medilink partners with leading insurers. Submit and track health insurance claims with complete transparency.",
    url: "https://www.medilinkhealth.com/insurance",
    siteName: "Medilink Health Care",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Health Insurance | Medilink Health Care",
    description: "Medilink partners with leading insurers. Submit and track health insurance claims with complete transparency.",
  },
  alternates: { canonical: "https://www.medilinkhealth.com/insurance" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
