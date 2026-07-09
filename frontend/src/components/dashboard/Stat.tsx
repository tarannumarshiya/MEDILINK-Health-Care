"use client";

import { useCountUp } from "@/hooks/useCountUp";

export function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  const display = useCountUp(value);

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br ${color} p-6 text-white shadow-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl`}
    >
      <p className="text-sm font-bold text-white/80">{title}</p>
      <p className="mt-2 text-4xl font-black">{display}</p>
    </div>
  );
}
