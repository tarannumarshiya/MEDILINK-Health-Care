"use client";

import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Packages } from "@/components/sections/Packages";
import { Departments } from "@/components/sections/Departments";
import { Doctors } from "@/components/sections/Doctors";
import { MedicalTeam } from "@/components/sections/MedicalTeam";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { Pharmacy } from "@/components/sections/Pharmacy";
import { Testimonials } from "@/components/sections/Testimonials";
import { Contact } from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <>
      <PublicNavbar />

      <main>
        <Hero />
        <About />
        <Services />
        <Packages />
        <Departments />
        <Doctors />
        <MedicalTeam />
        <WhyChooseUs />
        <Pharmacy />
        <Testimonials />
        <Contact />
      </main>

      <PublicFooter />
    </>
  );
}