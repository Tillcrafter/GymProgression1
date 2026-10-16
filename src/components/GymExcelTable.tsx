import { DayPlan, GymTableRow, WorkoutPresetType } from "../types";
import { Plus, Trash2, Dumbbell, HelpCircle, Activity, Sparkles, Settings } from "lucide-react";

interface GymExcelTableProps {
  currentDay: DayPlan;
  onUpdateDay: (updatedDay: DayPlan) => void;
  onSwitchTab?: (tab: "cardio") => void;
  onApplyPreset?: (dayId: string, preset: WorkoutPresetType) => void;
  onOpenSettings?: () => void;
}

export default function GymExcelTable({ 
  currentDay, 
  onUpdateDay, 
  onSwitchTab,
  onApplyPreset,
  onOpenSettings
}: GymExcelTableProps) {
  const rows = currentDay.gymRows || [];
  const focusUpper = (currentDay.focusTitle || "").toUpperCase();
  const isRestDay = focusUpper.includes("REST") || focusUpper.includes("PAUSE") || focusUpper.includes("ERHOLUNG");
  const isOpenDay = focusUpper.includes("NOCH KEIN TRAINING") || focusUpper.includes("OFFEN") || focusUpper.trim() === "";

  const updateRow = (id: string, field: keyof GymTableRow, value: string) => {
    const updated = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    onUpdateDay({ ...currentDay, gymRows: updated });
  };

  const addRow = () => {
    const newRow: GymTableRow = {
      id: `gym_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: "",
      setsAndWeight: "",
      notes: "",
    };
    onUpdateDay({ ...currentDay, gymRows: [...rows, newRow] });
  };

  const deleteRow = (id: string) => {
    onUpdateDay({ ...currentDay, gymRows: rows.filter((r) => r.id !== id) });
  };

  const updateFocus = (val: string) => {
    onUpdateDay({ ...currentDay, focusTitle: val });
  };

  // Calculate stats
  const totalExercises = rows.length;

  return (
    <div className="flex flex-col h-full bg-[#161619] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Table Header Bar */}
      <div className="p-4 sm:px-6 sm:py-4 bg-gradient-to-r from-[#1c1c21] to-[#161619] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                Tabelle 1
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs text-zinc-400 font-medium">Trainingsplan ({currentDay.name})</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
              GYM-TRAINING
            </h2>
          </div>
        </div>

        {/* Focus / Muscle Target Editor */}
        <div className="flex items-center bg-[#101013] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-cyan-500/60 transition-colors">
          <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2 tracking-wider">
            Fokus:
          </span>
          <input
            type="text"
            value={currentDay.focusTitle || ""}
            onChange={(e) => updateFocus(e.target.value)}
            placeholder="z. B. ARME / SCHULTERN"
            className="bg-transparent border-none text-xs sm:text-sm font-bold text-white focus:outline-none w-48 sm:w-64 uppercase placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Open Day Banner (Noch kein Training festgelegt) */}
      {isOpenDay && (
        <div className="bg-gradient-to-r from-cyan-950/40 via-[#1a1a22] to-[#161619] border-b border-cyan-500/20 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-zinc-300">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Noch kein Training für {currentDay.name} festgelegt:</span>
              <span className="text-zinc-400 hidden sm:inline ml-2">
                Wähle ein vorgefertigtes Workout oder trage eigene Übungen ein.
              </span>
            </div>
          </div>
          {onApplyPreset && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onApplyPreset(currentDay.id, "brust_ruecken")}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold transition-all cursor-pointer text-xs"
              >
                🏋️ Brust / Rücken
              </button>
              <button
                onClick={() => onApplyPreset(currentDay.id, "arme_schultern")}
                className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 font-bold transition-all cursor-pointer text-xs"
              >
                🏋️ Arme / Schultern
              </button>
              <button
                onClick={() => onApplyPreset(currentDay.id, "rest_run")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold transition-all cursor-pointer text-xs"
              >
                🏃 Restday: Laufen
              </button>
              <button
                onClick={() => onApplyPreset(currentDay.id, "krank_pause")}
                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold transition-all cursor-pointer text-xs"
              >
                🛌 Pause
              </button>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 font-bold transition-all cursor-pointer text-xs flex items-center gap-1"
                >
                  <Settings className="w-3 h-3 text-zinc-400" />
                  <span>Plan</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Restday Banner */}
      {!isOpenDay && isRestDay && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Activity className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-bold">Restday: Fokus auf Laufen & Erholung!</span>
              <span className="text-zinc-400 hidden sm:inline ml-2">
                Heute kein schweres Krafttraining. Den Laufplan findest du im Cardio-Tab.
              </span>
            </div>
          </div>
          {onSwitchTab && (
            <button
              onClick={() => onSwitchTab("cardio")}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap text-xs"
            >
              Zum Laufplan →
            </button>
          )}
        </div>
      )}

      {/* Excel Sheet Table Grid */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-[#121215] text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 select-none">
              <th className="py-2.5 px-3 w-12 text-center text-zinc-600 font-mono border-r border-white/5">#</th>
              <th className="py-2.5 px-3.5 w-1/3 min-w-[200px] border-r border-white/5">Übung / Exercise</th>
              <th className="py-2.5 px-3.5 w-1/3 min-w-[220px] border-r border-white/5 text-cyan-400">
                <div className="flex items-center gap-1.5">
                  <span>Sätze & Gewicht (z. B. 35x7, 35x6)</span>
                </div>
              </th>
              <th className="py-2.5 px-3.5 min-w-[160px] border-r border-white/5">Notizen / Ausführung</th>
              <th className="py-2.5 px-2 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs font-mono">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className="group hover:bg-white/[0.03] transition-colors focus-within:bg-cyan-950/20"
              >
                {/* Row Index */}
                <td className="py-2 px-3 text-center text-zinc-500 font-mono text-[11px] bg-black/20 border-r border-white/5 select-none">
                  {idx + 1}
                </td>

                {/* Exercise Name */}
                <td className="py-1 px-2 border-r border-white/5">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    placeholder="Übung eingeben..."
                    className="w-full bg-transparent px-2.5 py-2 rounded text-white font-medium focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-zinc-600 font-sans text-xs sm:text-sm"
                  />
                </td>

                {/* Single Consolidated Field: Sätze & Gewicht (e.g. 35x7, 35x6) */}
                <td className="py-1 px-2 border-r border-white/5 bg-cyan-500/[0.02]">
                  <input
                    type="text"
                    value={row.setsAndWeight || row.details || (row.weight && row.reps ? `${row.weight}x${row.reps}` : "")}
                    onChange={(e) => updateRow(row.id, "setsAndWeight", e.target.value)}
                    placeholder="z. B. 35x7, 35x6, 30x8"
                    className="w-full bg-transparent px-2.5 py-2 rounded text-cyan-300 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-zinc-600 font-mono text-xs sm:text-sm"
                  />
                </td>

                {/* Notes */}
                <td className="py-1 px-2 border-r border-white/5">
                  <input
                    type="text"
                    value={row.notes || ""}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                    placeholder="Notiz (Sitzhöhe, Pause, Tempo)..."
                    className="w-full bg-transparent px-2.5 py-2 rounded text-zinc-400 focus:text-white focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-zinc-700 font-sans text-xs"
                  />
                </td>

                {/* Delete Row Button */}
                <td className="py-1 px-2 text-center">
                  <button
                    onClick={() => deleteRow(row.id)}
                    title="Zeile löschen"
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-zinc-500">
                  <p className="text-sm font-medium">Keine Übungen in dieser Tabelle eingetragen.</p>
                  <button
                    onClick={addRow}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Erste Übung hinzufügen
                  </button>
                </td>
              </tr>
            )}
          </tbody>

          {/* Excel Summary Row */}
          <tfoot>
            <tr className="bg-[#121215] border-t border-white/10 text-xs font-mono font-bold text-zinc-300">
              <td className="py-2.5 px-3 text-center bg-black/40 text-zinc-600 border-r border-white/5">Σ</td>
              <td className="py-2.5 px-3.5 text-zinc-400 border-r border-white/5 uppercase text-[11px] tracking-wider font-sans">
                {totalExercises} Übungen im Plan
              </td>
              <td className="py-2.5 px-3.5 text-cyan-400 border-r border-white/5 text-[11px] font-sans font-normal">
                Direkte Eingabe: Sätze & Wdh (z. B. 35x7, 35x6)
              </td>
              <td colSpan={2} className="py-2.5 px-3.5 text-zinc-500 text-[11px] font-sans font-normal">
                Automatische Cloud-Sicherung
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Table Footer Action Bar */}
      <div className="p-3.5 sm:px-6 bg-[#141417] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Neue Übung hinzufügen</span>
        </button>

        <div className="flex items-center gap-2 text-zinc-500 text-xs font-sans">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-500/70" />
          <span>Tipp: Trage deine Sätze direkt ein wie <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300 font-mono">35x7, 35x7, 35x6</code></span>
        </div>
      </div>
    </div>
  );
}
