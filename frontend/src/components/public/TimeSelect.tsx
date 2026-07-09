"use client";

const AM_SLOTS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30"];
const PM_SLOTS = ["12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"];

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  selectedDate: string;   // "YYYY-MM-DD" — needed to filter past times for today
  className?: string;
  required?: boolean;
}

export default function TimeSelect({ value, onChange, selectedDate, className = "", required }: Props) {
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday  = selectedDate === todayStr;
  const nowMins  = isToday ? new Date().getHours() * 60 + new Date().getMinutes() + 60 : 0; // +60 min buffer

  function isDisabled(t: string) {
    if (!isToday) return false;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m <= nowMins;
  }

  const amAvail = AM_SLOTS.filter(t => !isDisabled(t));
  const pmAvail = PM_SLOTS.filter(t => !isDisabled(t));

  return (
    <select
      required={required}
      className={`rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition ${className}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">Select time slot</option>
      {amAvail.length > 0 && (
        <optgroup label="Morning (AM)">
          {amAvail.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
        </optgroup>
      )}
      {pmAvail.length > 0 && (
        <optgroup label="Afternoon / Evening (PM)">
          {pmAvail.map(t => <option key={t} value={t}>{fmt(t)}</option>)}
        </optgroup>
      )}
      {amAvail.length === 0 && pmAvail.length === 0 && (
        <option disabled>No slots available for today — pick another date</option>
      )}
    </select>
  );
}
