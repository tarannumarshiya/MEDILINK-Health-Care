"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

interface Props {
  value: string;          // "YYYY-MM-DD"
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function DatePicker({ value, onChange, placeholder = "Select date", className = "", required }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsed   = value ? new Date(value + "T00:00:00") : null;
  const initYear = parsed ? parsed.getFullYear() : today.getFullYear();
  const initMonth= parsed ? parsed.getMonth()    : today.getMonth();

  const [open,       setOpen]       = useState(false);
  const [viewYear,   setViewYear]   = useState(initYear);
  const [viewMonth,  setViewMonth]  = useState(initMonth);
  const [pickingYear,setPickingYear]= useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (d < today) return; // block past
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  }

  function isPast(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    return d < today;
  }
  function isToday(day: number) {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  }
  function isSelected(day: number) {
    if (!parsed) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  }

  const displayValue = parsed
    ? parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  // Year list: current year to +5 years (no past years)
  const yearList = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setPickingYear(false); }}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-white p-4 text-left text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
      >
        <span className={displayValue ? "text-slate-900 font-semibold" : "text-slate-400"}>
          {displayValue || placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {required && <input type="hidden" required value={value} />}

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">

          {/* Month / Year header */}
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 transition">
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>

            <button type="button" onClick={() => setPickingYear(p => !p)}
              className="rounded-xl px-3 py-1 text-sm font-black text-slate-800 hover:bg-slate-100 transition">
              {MONTHS[viewMonth]} {viewYear}
            </button>

            <button type="button" onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 transition">
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Year picker overlay */}
          {pickingYear && (
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {yearList.map(y => (
                <button key={y} type="button"
                  onClick={() => { setViewYear(y); setPickingYear(false); }}
                  className={`rounded-xl py-1.5 text-sm font-bold transition ${
                    y === viewYear
                      ? "bg-teal-600 text-white"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAYS.map(d => (
              <span key={d} className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-1">{d}</span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <span key={i} />;
              const past     = isPast(day);
              const selected = isSelected(day);
              const todayDay = isToday(day);
              return (
                <button key={i} type="button"
                  disabled={past}
                  onClick={() => selectDay(day)}
                  className={`rounded-xl py-1.5 text-sm font-semibold transition ${
                    selected
                      ? "bg-teal-600 text-white font-black"
                      : past
                      ? "text-slate-300 cursor-not-allowed"
                      : todayDay
                      ? "border border-teal-400 text-teal-700 font-black hover:bg-teal-50"
                      : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <button type="button"
            onClick={() => {
              const yyyy = today.getFullYear();
              const mm   = String(today.getMonth() + 1).padStart(2, "0");
              const dd   = String(today.getDate()).padStart(2, "0");
              onChange(`${yyyy}-${mm}-${dd}`);
              setOpen(false);
            }}
            className="mt-3 w-full rounded-xl bg-slate-100 py-2 text-xs font-black text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition">
            Today
          </button>
        </div>
      )}
    </div>
  );
}
