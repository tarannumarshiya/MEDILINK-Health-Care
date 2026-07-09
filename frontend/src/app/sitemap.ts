import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.medilinkhealth.com";
  const now = new Date();
  return [
    { url: base,                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/departments`,   lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/doctors`,       lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/pharmacy`,      lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/appointment`,   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/contact`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/insurance`,     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/emergency`,     lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/patient/track`, lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
  ];
}
