import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Medilink Health Care",
  description: "Reach Medilink Health Care for appointments, emergency support, or general enquiries. Available 24/7.",
  openGraph: {
    title: "Contact Us | Medilink Health Care",
    description: "Reach Medilink Health Care for appointments, emergency support, or general enquiries. Available 24/7.",
    url: "https://www.medilinkhealth.com/contact",
    siteName: "Medilink Health Care",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Medilink Health Care",
    description: "Reach Medilink Health Care for appointments, emergency support, or general enquiries. Available 24/7.",
  },
  alternates: { canonical: "https://www.medilinkhealth.com/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
