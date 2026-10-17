import React from "react";
import { DayPlan, CardioTableRow, parseGermanOrEnglishNumber } from "../types";
import { Plus, Trash2, Activity, Flame } from "lucide-react";

interface CardioExcelTableProps {
  currentDay: DayPlan;
  onUpdateDay: (updatedDay: DayPlan) => void;
}

export default function CardioExcelTable({ currentDay, onUpdateDay }: CardioExcelTableProps) {
  const rows = currentDay.cardioRows || [];

  const updateRow = (id: string, field: keyof CardioTableRow, value: string) => {
    const updated = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    onUpdateDay({ ...currentDay, cardioRows: updated });
  };

  const addRow = () => {
    const newRow: CardioTableRow = {
      id: `cardio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      activity: "",
      duration: "20 min",
      intensity: "",
      steps: "",
      calories: "",
      notes: "",
    };
    onUpdateDay({ ...currentDay, cardioRows: [...rows, newRow] });
  };

  const deleteRow = (id: string) => {
    onUpdateDay({ ...currentDay, cardioRows: rows.filter((r) => r.id !== id) });
  };

  // Safe German/English Summaries
  const totalEntries = rows.length;
  const totalMinutes = rows.reduce((acc, r) => acc + parseGermanOrEnglishNumber(r.duration), 0);
  const totalKcal = Math.round(rows.reduce((acc, r) => acc + parseGermanOrEnglishNumber(r.calories), 0));
  const totalSteps = Math.round(rows.reduce((acc, r) => acc + parseGermanOrEnglishNumber(r.steps), 0));

  return (
    <div className="flex flex-col h-full bg-[#161619] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Table Header Bar */}
      <div className="p-4 sm:px-6 sm:py-4.5 bg-gradient-to-r from-[#1c1c21] to-[#161619] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Tabelle 2
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs text-zinc-400 font-medium">Ausdauer & Schritte</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
              CARDIO & AKTIVITÄT
            </h2>
          </div>
        </div>

        <div className="text-xs text-zinc-400 font-medium bg-[#101013] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Direkte Tabellen-Eingabe</span>
        </div>
      </div>

      {/* Excel Sheet Table Grid */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="bg-[#121215] text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 select-none">
              <th className="py-2.5 px-3 w-10 text-center text-zinc-600 font-mono border-r border-white/5">#</th>
              <th className="py-2.5 px-3 min-w-[160px] border-r border-white/5">Aktivität / Typ</th>
              <th className="py-2.5 px-3 w-28 text-center border-r border-white/5">Dauer</th>
              <th className="py-2.5 px-3 min-w-[160px] border-r border-white/5">Intensität / Stufe</th>
              <th className="py-2.5 px-3 w-28 text-center border-r border-white/5">Schritte</th>
              <th className="py-2.5 px-3 w-28 text-center border-r border-white/5">Kcal</th>
              <th className="py-2.5 px-3 min-w-[140px] border-r border-white/5">Notizen</th>
              <th className="py-2.5 px-2 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs font-mono">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className="group hover:bg-white/[0.03] transition-colors focus-within:bg-amber-950/20"
              >
                {/* Row Index */}
                <td className="py-2 px-3 text-center text-zinc-500 font-mono text-[11px] bg-black/20 border-r border-white/5 select-none">
                  {idx + 1}
                </td>

                {/* Activity */}
                <td className="py-1 px-2 border-r border-white/5">
                  <input
                    type="text"
                    value={row.activity}
                    onChange={(e) => updateRow(row.id, "activity", e.target.value)}
                    placeholder="z.B. Incline Walk, Radfahren..."
                    className="w-full bg-transparent px-2 py-1.5 rounded text-white font-medium focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-zinc-600 font-sans text-xs sm:text-sm"
                  />
                </td>

                {/* Duration */}
                <td className="py-1 px-1.5 border-r border-white/5">
                  <input
                    type="text"
                    value={row.duration}
                    onChange={(e) => updateRow(row.id, "duration", e.target.value)}
                    placeholder="20 min"
                    className="w-full text-center bg-transparent px-1 py-1.5 rounded text-amber-300 font-semibold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </td>

                {/* Intensity */}
                <td className="py-1 px-2 border-r border-white/5">
                  <input
                    type="text"
                    value={row.intensity}
                    onChange={(e) => updateRow(row.id, "intensity", e.target.value)}
                    placeholder="Steigung 12%, 4.8 km/h"
                    className="w-full bg-transparent px-2 py-1.5 rounded text-zinc-300 focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-zinc-600 font-sans"
                  />
                </td>

                {/* Steps */}
                <td className="py-1 px-1.5 border-r border-white/5">
                  <input
                    type="text"
                    value={row.steps}
                    onChange={(e) => updateRow(row.id, "steps", e.target.value)}
                    placeholder="10.000"
                    className="w-full text-center bg-transparent px-1 py-1.5 rounded text-cyan-400 font-semibold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </td>

                {/* Calories */}
                <td className="py-1 px-1.5 border-r border-white/5">
                  <input
                    type="text"
                    value={row.calories}
                    onChange={(e) => updateRow(row.id, "calories", e.target.value)}
                    placeholder="200 kcal"
                    className="w-full text-center bg-transparent px-1 py-1.5 rounded text-orange-400 font-semibold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </td>

                {/* Notes */}
                <td className="py-1 px-2 border-r border-white/5">
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                    placeholder="Notizen / Details..."
                    className="w-full bg-transparent px-2 py-1.5 rounded text-zinc-400 focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-zinc-600 font-sans"
                  />
                </td>

                {/* Delete button */}
                <td className="py-1 px-2 text-center">
                  <button
                    onClick={() => deleteRow(row.id)}
                    title="Zeile entfernen"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs italic">
                  Keine Cardio-Einträge. Klicke unten auf "+ Zeile hinzufügen".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Bar: Quick Add & Excel Formula Summary */}
      <div className="p-3 sm:px-4 bg-[#121215] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Zeile hinzufügen</span>
        </button>

        {/* Excel Formula Summary */}
        <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px] bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">=EINTRÄGE:</span>
            <span className="text-white font-bold">{totalEntries}</span>
          </div>
          {totalMinutes > 0 && (
            <>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-zinc-500">=DAUER:</span>
                <span className="text-amber-300 font-bold">{totalMinutes} min</span>
              </div>
            </>
          )}
          {totalKcal > 0 && (
            <>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1">
                <span className="text-zinc-500">=KCAL:</span>
                <span className="text-orange-400 font-bold">{totalKcal} kcal</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
