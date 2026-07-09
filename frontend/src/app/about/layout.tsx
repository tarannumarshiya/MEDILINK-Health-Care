import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Medilink Health Care",
  description: "Learn about Medilink's mission, values and expert medical team dedicated to delivering world-class healthcare.",
  openGraph: {
    title: "About Us | Medilink Health Care",
    description: "Learn about Medilink's mission, values and expert medical team dedicated to delivering world-class healthcare.",
    url: "https://www.medilinkhealth.com/about",
    siteName: "Medilink Health Care",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | Medilink Health Care",
    description: "Learn about Medilink's mission, values and expert medical team dedicated to delivering world-class healthcare.",
  },
  alternates: { canonical: "https://www.medilinkhealth.com/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
