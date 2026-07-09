"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { publicNavLinks } from "@/lib/constants";
import { usePharmacyCart } from "@/context/PharmacyCartContext";
import BrandLogo from "@/components/BrandLogo";

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const { cartCount, setCartOpen } = usePharmacyCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function openCart() {
    setOpen(false);
    setCartOpen(true);
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/40 px-4 py-3 shadow-soft transition-all duration-300 sm:px-6"
        style={{
          background: scrolled
            ? "oklch(0.98 0.012 215 / 0.96)"
            : "oklch(0.98 0.012 215 / 0.9)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
        }}
      >
        <BrandLogo />

        <div className="hidden items-center gap-1 lg:flex">
          {publicNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/80 hover:bg-primary/10 hover:text-primary",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            aria-label="Open pharmacy cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            <ShoppingCart size={19} />

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {pathname !== "/appointment" && (
            <>
              <Link
                href="/patient/login"
                className="hidden rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary sm:inline-flex"
              >
                Login
              </Link>

              <Link
                href="/patient/register"
                className="hidden rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 sm:inline-flex"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground/80 transition-colors hover:bg-primary/10 lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/30 p-4 shadow-soft lg:hidden"
            style={{
              background: "oklch(0.98 0.012 215 / 0.98)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            }}
          >
            <div className="flex flex-col gap-1">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-primary/10 hover:text-primary",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              ))}

              <button
                type="button"
                onClick={openCart}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-bold text-foreground transition hover:bg-primary/10 hover:text-primary"
              >
                <ShoppingCart size={17} />
                Cart {cartCount > 0 ? `(${cartCount})` : ""}
              </button>

              {pathname !== "/appointment" && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/patient/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-border py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-primary/10"
                  >
                    Login
                  </Link>

                  <Link
                    href="/patient/register"
                    onClick={() => setOpen(false)}
                    className="rounded-xl py-2.5 text-center text-sm font-bold text-primary-foreground transition hover:opacity-90"
                    style={{
                      background: "var(--gradient-primary)",
                      boxShadow: "var(--shadow-glow)",
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}