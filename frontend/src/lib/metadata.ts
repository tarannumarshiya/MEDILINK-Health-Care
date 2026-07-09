import type { Metadata } from "next";

const BASE_URL = "https://www.medilinkhealth.com";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

export function buildMeta(page: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = page.path ? `${BASE_URL}${page.path}` : BASE_URL;
  return {
    title: `${page.title} | Medilink Health Care`,
    description: page.description,
    openGraph: {
      title: `${page.title} | Medilink Health Care`,
      description: page.description,
      url,
      siteName: "Medilink Health Care",
      images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | Medilink Health Care`,
      description: page.description,
      images: [OG_IMAGE],
    },
    alternates: { canonical: url },
  };
}
