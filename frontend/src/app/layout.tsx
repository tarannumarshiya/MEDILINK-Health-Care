import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { StethoscopeBackground } from "@/components/public/StethoscopeBackground";
import { PharmacyCartProvider } from "@/context/PharmacyCartContext";
import CartDrawer from "@/components/pharmacy/CartDrawer";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Medilink Health Care — Healthcare, Reimagined",
  description:
    "Premium digital healthcare platform connecting patients, doctors, laboratories and pharmacies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
        >
          <PharmacyCartProvider>
            <StethoscopeBackground />

            {children}

            {/* Global Pharmacy Cart */}
            <CartDrawer />
          </PharmacyCartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}