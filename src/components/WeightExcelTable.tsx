import React from "react";
import { WeekPlan, WeightRow } from "../types";
import { 
  Scale, 
  Plus, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  Minus, 
  Sparkles, 
  Calendar,
  CheckCircle2,
  Clock
} from "lucide-react";

interface WeightExcelTableProps {
  currentWeek: WeekPlan;
  onUpdateWeek: (updatedWeek: WeekPlan) => void;
}

export default function WeightExcelTable({ currentWeek, onUpdateWeek }: WeightExcelTableProps) {
  const rows = currentWeek.weightRows || [];

  const updateRow = (id: string, field: keyof WeightRow, value: any) => {
    const updated = rows.map((r) => {
      if (r.id === id) {
        if (field === "weight") {
          // Allow empty string, or retain comma/dot string so user can type "76,9" without truncating
          if (value === "") return { ...r, weight: "" };
          // Keep only valid characters (numbers, comma, dot)
          const sanitized = String(value).replace(/[^0-9.,]/g, "");
          return { ...r, weight: sanitized };
        }
        return { ...r, [field]: value };
      }
      return r;
    });

    onUpdateWeek({ ...currentWeek, weightRows: updated });
  };

  const addRow = () => {
    const newRow: WeightRow = {
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shortDay: "EXTRA",
      dayLabel: "Zusatztag",
      date: new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      weight: "",
      time: "Nüchtern",
      notes: "",
    };
    onUpdateWeek({ ...currentWeek, weightRows: [...rows, newRow] });
  };

  const deleteRow = (id: string) => {
    onUpdateWeek({ ...currentWeek, weightRows: rows.filter((r) => r.id !== id) });
  };

  // Calculations for Weekly Average & Insights
  const validWeights = rows
    .map((r) => {
      if (typeof r.weight === "number") return r.weight;
      if (typeof r.weight === "string" && r.weight.trim() !== "") {
        const parsed = parseFloat(r.weight.replace(",", "."));
        return isNaN(parsed) ? NaN : parsed;
      }
      return NaN;
    })
    .filter((w) => !isNaN(w) && w > 0);

  const loggedCount = validWeights.length;
  const totalDays = rows.length;

  const weeklyAverage =
    loggedCount > 0
      ? (validWeights.reduce((acc, curr) => acc + curr, 0) / loggedCount).toFixed(2)
      : "--";

  const minWeight = loggedCount > 0 ? Math.min(...validWeights).toFixed(1) : "--";
  const maxWeight = loggedCount > 0 ? Math.max(...validWeights).toFixed(1) : "--";

  // Delta between first logged day and last logged day of the week
  let weeklyDelta: number | null = null;
  if (loggedCount >= 2) {
    const firstWeight = validWeights[0];
    const lastWeight = validWeights[validWeights.length - 1];
    weeklyDelta = parseFloat((lastWeight - firstWeight).toFixed(2));
  }

  return (
    <div className="flex flex-col h-full bg-[#161619] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Table Header Bar */}
      <div className="p-4 sm:px-6 sm:py-4 bg-gradient-to-r from-[#1c1c21] to-[#161619] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-400">
                Tabelle 4
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs text-zinc-400 font-medium">{currentWeek.name}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
              GEWICHTSTRACK & WOCHENDURCHSCHNITT
            </h2>
          </div>
        </div>

        {/* Big Calculated Weekly Average Badge */}
        <div className="flex items-center gap-3 bg-purple-950/40 border border-purple-500/30 rounded-xl px-4 py-2 shadow-inner">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-purple-300/80 tracking-wider">
              Wochendurchschnitt (Ø)
            </div>
            <div className="text-lg sm:text-xl font-black text-purple-200 font-mono tracking-tight">
              {weeklyAverage} {weeklyAverage !== "--" ? "kg" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:px-6 bg-[#131316] border-b border-white/5">
        <div className="bg-[#1b1b20] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Geloggte Tage
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-black text-white font-mono">
              {loggedCount} <span className="text-xs text-zinc-500 font-sans">/ {totalDays}</span>
            </span>
            <span className="text-xs font-bold text-purple-400">
              {Math.round((loggedCount / (totalDays || 1)) * 100)}%
            </span>
          </div>
          <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(loggedCount / (totalDays || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-[#1b1b20] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Wochentendenz (Δ)
          </span>
          <div className="flex items-center gap-2 mt-1">
            {weeklyDelta === null ? (
              <span className="text-lg font-black text-zinc-500 font-mono">--</span>
            ) : weeklyDelta > 0 ? (
              <div className="flex items-center gap-1 text-amber-400 font-mono font-black text-lg">
                <TrendingUp className="w-4 h-4" />
                <span>+{weeklyDelta} kg</span>
              </div>
            ) : weeklyDelta < 0 ? (
              <div className="flex items-center gap-1 text-emerald-400 font-mono font-black text-lg">
                <TrendingDown className="w-4 h-4" />
                <span>{weeklyDelta} kg</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-zinc-300 font-mono font-black text-lg">
                <Minus className="w-4 h-4" />
                <span>0.00 kg</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Start vs. letzter Eintrag</span>
        </div>

        <div className="bg-[#1b1b20] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Tiefstwert (Min)
          </span>
          <div className="mt-1">
            <span className="text-lg font-black text-cyan-400 font-mono">
              {minWeight} {minWeight !== "--" ? "kg" : ""}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Niedrigster Tag</span>
        </div>

        <div className="bg-[#1b1b20] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Höchstwert (Max)
          </span>
          <div className="mt-1">
            <span className="text-lg font-black text-orange-400 font-mono">
              {maxWeight} {maxWeight !== "--" ? "kg" : ""}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Höchster Tag</span>
        </div>
      </div>

      {/* Excel Sheet Table Grid */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#121215] text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 select-none">
              <th className="py-2.5 px-3 w-12 text-center text-zinc-600 font-mono border-r border-white/5">#</th>
              <th className="py-2.5 px-3.5 w-36 border-r border-white/5">Wochentag</th>
              <th className="py-2.5 px-3.5 w-28 border-r border-white/5">Datum</th>
              <th className="py-2.5 px-3.5 w-44 text-right border-r border-white/5 text-purple-300 font-bold">
                Körpergewicht (kg)
              </th>
              <th className="py-2.5 px-3.5 w-36 border-r border-white/5">Uhrzeit / Zustand</th>
              <th className="py-2.5 px-3.5 min-w-[180px] border-r border-white/5">Notizen / Bemerkung</th>
              <th className="py-2.5 px-2 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs font-mono">
            {rows.map((row, idx) => {
              return (
                <tr
                  key={row.id}
                  className="group hover:bg-white/[0.03] transition-colors focus-within:bg-purple-950/20"
                >
                  {/* Row Index */}
                  <td className="py-2 px-3 text-center text-zinc-500 font-mono text-[11px] bg-black/20 border-r border-white/5 select-none">
                    {idx + 1}
                  </td>

                  {/* Wochentag Badge */}
                  <td className="py-1 px-3 border-r border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 py-0.5 rounded bg-white/5 text-center text-[10px] font-black text-purple-300 border border-white/5">
                        {row.shortDay}
                      </span>
                      <span className="font-sans font-bold text-white text-xs sm:text-sm">
                        {row.dayLabel}
                      </span>
                    </div>
                  </td>

                  {/* Datum Input */}
                  <td className="py-1 px-2 border-r border-white/5">
                    <input
                      type="text"
                      value={row.date || ""}
                      onChange={(e) => updateRow(row.id, "date", e.target.value)}
                      placeholder="z. B. 16.10."
                      className="w-full bg-transparent px-2.5 py-2 rounded text-zinc-300 focus:text-white focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-mono text-xs"
                    />
                  </td>

                  {/* Körpergewicht Input (Excel Number Cell) */}
                  <td className="py-1 px-2 border-r border-white/5 bg-purple-500/[0.03]">
                    <div className="flex items-center justify-end gap-1.5 px-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.weight === "" ? "" : row.weight}
                        onChange={(e) => updateRow(row.id, "weight", e.target.value)}
                        placeholder="0.0"
                        className="w-24 bg-transparent text-right py-2 rounded text-purple-200 font-black focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-mono text-sm sm:text-base"
                      />
                      <span className="text-zinc-500 text-xs font-sans font-bold select-none">kg</span>
                    </div>
                  </td>

                  {/* Time / State */}
                  <td className="py-1 px-2 border-r border-white/5">
                    <input
                      type="text"
                      value={row.time || ""}
                      onChange={(e) => updateRow(row.id, "time", e.target.value)}
                      placeholder="z. B. Nüchtern"
                      className="w-full bg-transparent px-2.5 py-2 rounded text-zinc-400 focus:text-white focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-sans text-xs"
                    />
                  </td>

                  {/* Notes */}
                  <td className="py-1 px-2 border-r border-white/5">
                    <input
                      type="text"
                      value={row.notes || ""}
                      onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                      placeholder="Bemerkung (Salz, Schlaf, Restday)..."
                      className="w-full bg-transparent px-2.5 py-2 rounded text-zinc-400 focus:text-white focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-sans text-xs"
                    />
                  </td>

                  {/* Delete / Clear Action */}
                  <td className="py-1 px-2 text-center">
                    <button
                      onClick={() => updateRow(row.id, "weight", "")}
                      title="Gewicht leeren"
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Excel Summary Row: AVERAGE FORMULA */}
          <tfoot>
            <tr className="bg-[#121215] border-t-2 border-purple-500/30 text-xs font-mono font-bold text-white">
              <td className="py-3 px-3 text-center bg-black/40 text-purple-400 border-r border-white/5 font-mono text-sm">
                Ø
              </td>
              <td className="py-3 px-3.5 text-zinc-300 border-r border-white/5 uppercase text-[11px] tracking-wider font-sans">
                WOCHENDURCHSCHNITT
              </td>
              <td className="py-3 px-3.5 text-zinc-500 border-r border-white/5 text-[11px] font-mono">
                =AVERAGE(D2:D8)
              </td>
              <td className="py-3 px-3.5 text-right border-r border-white/5 bg-purple-950/30">
                <span className="text-purple-300 font-black text-sm sm:text-base font-mono">
                  {weeklyAverage} kg
                </span>
              </td>
              <td colSpan={3} className="py-3 px-3.5 text-zinc-400 text-[11px] font-sans font-normal">
                {loggedCount} von {totalDays} Tagen geloggt • Daten werden automatisch gesichert
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Table Footer Action Bar */}
      <div className="p-3.5 sm:px-6 bg-[#141417] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Zusatztag / Zeile hinzufügen</span>
        </button>

        <div className="flex items-center gap-2 text-zinc-400 text-xs font-sans">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Der Wochendurchschnitt filtert tägliche Wasserschwankungen optimal heraus.</span>
        </div>
      </div>
    </div>
  );
}
