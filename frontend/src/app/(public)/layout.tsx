import { StethoscopeBackground } from "@/components/public/StethoscopeBackground";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StethoscopeBackground />
      {children}
    </>
  );
}
