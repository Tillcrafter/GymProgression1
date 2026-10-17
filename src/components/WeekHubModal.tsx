import React, { useState } from "react";
import { WeekPlan, DayPlan, GymTableRow, parseGermanOrEnglishNumber } from "../types";
import { 
  X, 
  Calendar, 
  TrendingUp, 
  Scale, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Dumbbell, 
  Flame, 
  Sparkles, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Trophy,
  Activity,
  Layers,
  Edit2,
  Trash2,
  Check
} from "lucide-react";

interface WeekHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeks: WeekPlan[];
  selectedWeekId: string;
  onSelectWeek: (weekId: string) => void;
  onAddWeek: () => void;
  onRenameWeek?: (weekId: string, newName: string) => void;
  onDeleteWeek?: (weekId: string) => void;
  onUpdatePhase: (phase: string) => void;
  onOpenPlanManager: () => void;
}

interface ExerciseProgression {
  exerciseName: string;
  prevWeekSets: string;
  currentWeekSets: string;
  prevMaxWeight: number;
  currentMaxWeight: number;
  prevTotalReps: number;
  currentTotalReps: number;
  prevVolume: number;
  currentVolume: number;
  weightDelta: number;
  repsDelta: number;
  status: "improved" | "equal" | "decreased" | "new";
}

/**
 * Parses sets string like "35x7, 35x7, 35x6" or "80x8" into structured sets
 */
function parseSetsAndWeights(str: string): { weight: number; reps: number }[] {
  if (!str) return [];
  const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
  const sets: { weight: number; reps: number }[] = [];
  
  for (const part of parts) {
    // Match "35x7" or "35 x 7" or "35kg x 7"
    const match = part.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:x|\*|×)\s*([0-9]+)/i);
    if (match) {
      const weight = parseGermanOrEnglishNumber(match[1]);
      const reps = parseInt(match[2], 10) || 0;
      if (weight > 0 && reps > 0) {
        sets.push({ weight, reps });
      }
    }
  }
  return sets;
}

export function WeekHubModal({
  isOpen,
  onClose,
  weeks,
  selectedWeekId,
  onSelectWeek,
  onAddWeek,
  onRenameWeek,
  onDeleteWeek,
  onUpdatePhase,
  onOpenPlanManager,
}: WeekHubModalProps) {
  const [activeTab, setActiveTab] = useState<"progression" | "weight" | "weeks">("progression");
  const [compareWeekId, setCompareWeekId] = useState<string>("");
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null);
  const [editingWeekName, setEditingWeekName] = useState<string>("");

  if (!isOpen) return null;

  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || weeks[0];
  const currentWeekIndex = weeks.findIndex((w) => w.id === selectedWeekId);
  
  // Default comparison week is the previous week in the array (e.g. Woche 1 if current is Woche 2)
  const defaultPrevWeek = currentWeekIndex > 0 ? weeks[currentWeekIndex - 1] : null;
  const comparisonWeek = weeks.find((w) => w.id === compareWeekId) || defaultPrevWeek;

  // ----------------------------------------------------
  // Compute Exercise Progression between comparisonWeek and currentWeek
  // ----------------------------------------------------
  const progressions: ExerciseProgression[] = [];
  
  if (currentWeek) {
    // Gather all gym exercises from the current week
    const currentExercisesMap = new Map<string, GymTableRow[]>();
    for (const day of currentWeek.days) {
      for (const row of day.gymRows || []) {
        if (!row.name || !row.setsAndWeight) continue;
        const normalizedName = row.name.trim();
        const existing = currentExercisesMap.get(normalizedName) || [];
        existing.push(row);
        currentExercisesMap.set(normalizedName, existing);
      }
    }

    // Gather from comparison week
    const prevExercisesMap = new Map<string, GymTableRow[]>();
    if (comparisonWeek) {
      for (const day of comparisonWeek.days) {
        for (const row of day.gymRows || []) {
          if (!row.name || !row.setsAndWeight) continue;
          const normalizedName = row.name.trim();
          const existing = prevExercisesMap.get(normalizedName) || [];
          existing.push(row);
          prevExercisesMap.set(normalizedName, existing);
        }
      }
    }

    // Compare
    currentExercisesMap.forEach((currRows, exName) => {
      const prevRows = prevExercisesMap.get(exName);
      const currSetsStr = currRows.map((r) => r.setsAndWeight).join("; ");
      const prevSetsStr = prevRows ? prevRows.map((r) => r.setsAndWeight).join("; ") : "";

      const currParsed = currRows.flatMap((r) => parseSetsAndWeights(r.setsAndWeight));
      const prevParsed = prevRows ? prevRows.flatMap((r) => parseSetsAndWeights(r.setsAndWeight)) : [];

      const currMaxWeight = currParsed.reduce((max, s) => Math.max(max, s.weight), 0);
      const prevMaxWeight = prevParsed.reduce((max, s) => Math.max(max, s.weight), 0);

      const currTotalReps = currParsed.reduce((sum, s) => sum + s.reps, 0);
      const prevTotalReps = prevParsed.reduce((sum, s) => sum + s.reps, 0);

      const currVolume = currParsed.reduce((sum, s) => sum + s.weight * s.reps, 0);
      const prevVolume = prevParsed.reduce((sum, s) => sum + s.weight * s.reps, 0);

      const weightDelta = Math.round((currMaxWeight - prevMaxWeight) * 10) / 10;
      const repsDelta = currTotalReps - prevTotalReps;

      let status: "improved" | "equal" | "decreased" | "new" = "new";
      if (prevParsed.length > 0) {
        if (weightDelta > 0 || (weightDelta === 0 && repsDelta > 0)) {
          status = "improved";
        } else if (weightDelta === 0 && repsDelta === 0) {
          status = "equal";
        } else {
          status = "decreased";
        }
      }

      progressions.push({
        exerciseName: exName,
        prevWeekSets: prevSetsStr,
        currentWeekSets: currSetsStr,
        prevMaxWeight,
        currentMaxWeight: currMaxWeight,
        prevTotalReps,
        currentTotalReps: currTotalReps,
        prevVolume,
        currentVolume: currVolume,
        weightDelta,
        repsDelta,
        status,
      });
    });
  }

  // Progression summary metrics
  const totalImproved = progressions.filter((p) => p.status === "improved").length;
  const totalCompared = progressions.filter((p) => p.status !== "new").length;
  const improvementRate = totalCompared > 0 ? Math.round((totalImproved / totalCompared) * 100) : 0;

  // ----------------------------------------------------
  // Compute Weight Progression across ALL weeks
  // ----------------------------------------------------
  const weekWeightStats = weeks.map((w, idx) => {
    const validWeights = (w.weightRows || [])
      .map((r) => parseGermanOrEnglishNumber(r.weight))
      .filter((n) => !isNaN(n) && n > 0);

    const count = validWeights.length;
    const avg = count > 0 ? Math.round((validWeights.reduce((a, b) => a + b, 0) / count) * 100) / 100 : 0;
    const min = count > 0 ? Math.min(...validWeights) : 0;
    const max = count > 0 ? Math.max(...validWeights) : 0;

    return {
      week: w,
      index: idx,
      count,
      avg,
      min,
      max,
    };
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-[#151518] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#1a1a1f] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  Wochen-Hub
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-xs font-bold text-white uppercase">{currentWeek?.name} ({currentWeek?.phase || "AUFBAU"})</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
                ÜBERSICHT, STEIGERUNGEN & GEWICHTSVERLAUF
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Switcher Chips & Action Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#121215] border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
          {/* Week Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none max-w-full">
            <span className="text-zinc-500 text-[11px] font-bold uppercase mr-1 hidden sm:inline">Woche:</span>
            {weeks.map((w) => {
              const isSelected = w.id === selectedWeekId;
              return (
                <button
                  key={w.id}
                  onClick={() => onSelectWeek(w.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-sm font-black"
                      : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border-white/5"
                  }`}
                >
                  {w.name}
                </button>
              );
            })}

            {/* Add Week Button */}
            <button
              onClick={onAddWeek}
              title="Neue Woche hinzufügen"
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Neue Woche</span>
            </button>
          </div>

          {/* Quick Plan Manager Link */}
          <button
            onClick={() => {
              onClose();
              onOpenPlanManager();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-bold transition-all cursor-pointer ml-auto"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Neuer Trainingsplan</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#161619] px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("progression")}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "progression"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Übungs-Steigerung</span>
            {totalImproved > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                +{totalImproved}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("weight")}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "weight"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Gewichtsverlauf</span>
          </button>

          <button
            onClick={() => setActiveTab("weeks")}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "weeks"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Alle Wochen ({weeks.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: ÜBUNGS-STEIGERUNG */}
          {activeTab === "progression" && (
            <div className="space-y-4">
              {/* Compare Week Selection Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-medium">Vergleich mit:</span>
                  <select
                    value={compareWeekId || (defaultPrevWeek?.id || "")}
                    onChange={(e) => setCompareWeekId(e.target.value)}
                    className="bg-[#111113] text-white px-2.5 py-1 rounded-lg border border-white/10 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer text-xs"
                  >
                    {weeks
                      .filter((w) => w.id !== currentWeek.id)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.phase || "Aufbau"})
                        </option>
                      ))}
                    {weeks.length <= 1 && (
                      <option value="">Keine Vorwoche vorhanden</option>
                    )}
                  </select>
                </div>

                {comparisonWeek && totalCompared > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Trophy className="w-4 h-4" />
                      <span>{totalImproved} von {totalCompared} gesteigert ({improvementRate}%)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* No comparison week warning or empty state */}
              {weeks.length <= 1 ? (
                <div className="p-6 rounded-2xl bg-[#1a1a20] border border-cyan-500/20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-black text-sm uppercase">Ausgangswoche {currentWeek.name}</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Du befindest dich in deiner ersten Woche. Trage deine Gewichte und Sätze in die Gym-Tabelle ein. Sobald du mit <strong>+ Neue Woche</strong> Woche 2 startest, vergleicht das System automatisch alle Steigerungen in Kilo und Wiederholungen!
                  </p>
                  <button
                    onClick={onAddWeek}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Jetzt Woche 2 anlegen</span>
                  </button>
                </div>
              ) : progressions.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-zinc-400">
                  Keine Übungen in dieser Woche gefunden. Trage Übungen und Gewichte in der Gym-Tabelle ein.
                </div>
              ) : (
                <div className="border border-white/10 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#1c1c22] border-b border-white/10 text-[11px] font-black uppercase text-zinc-400">
                          <th className="py-2.5 px-3">Übung</th>
                          <th className="py-2.5 px-3">{comparisonWeek?.name || "Vorwoche"}</th>
                          <th className="py-2.5 px-3 text-cyan-300">{currentWeek.name} (Aktuell)</th>
                          <th className="py-2.5 px-3 text-center">Steigerung</th>
                          <th className="py-2.5 px-3 text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {progressions.map((prog, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            {/* Exercise Name */}
                            <td className="py-2.5 px-3 font-sans font-bold text-white">
                              {prog.exerciseName}
                            </td>

                            {/* Previous Week S&W */}
                            <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                              {prog.prevWeekSets ? (
                                <span>{prog.prevWeekSets}</span>
                              ) : (
                                <span className="text-zinc-600 font-sans italic">Neu</span>
                              )}
                            </td>

                            {/* Current Week S&W */}
                            <td className="py-2.5 px-3 text-cyan-200 font-bold text-[11px]">
                              {prog.currentWeekSets}
                            </td>

                            {/* Delta / Improvement Badge */}
                            <td className="py-2.5 px-3 text-center">
                              {prog.status === "improved" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold text-[11px] border border-emerald-500/20">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                  {prog.weightDelta > 0 && `+${prog.weightDelta} kg`}
                                  {prog.weightDelta > 0 && prog.repsDelta > 0 && " • "}
                                  {prog.repsDelta > 0 && `+${prog.repsDelta} Wdh.`}
                                  {prog.weightDelta === 0 && prog.repsDelta === 0 && "Volumen +"}
                                </span>
                              )}
                              {prog.status === "equal" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 font-bold text-[11px] border border-blue-500/20">
                                  <Minus className="w-3.5 h-3.5" />
                                  <span>Gehalten</span>
                                </span>
                              )}
                              {prog.status === "decreased" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-bold text-[11px] border border-amber-500/20">
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                  <span>{prog.weightDelta < 0 ? `${prog.weightDelta} kg` : `${prog.repsDelta} Wdh.`}</span>
                                </span>
                              )}
                              {prog.status === "new" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-bold text-[10px]">
                                  Basiswert
                                </span>
                              )}
                            </td>

                            {/* Visual Status icon */}
                            <td className="py-2.5 px-3 text-right">
                              {prog.status === "improved" ? (
                                <span className="text-emerald-400 font-bold text-xs">🚀 Gesteigert</span>
                              ) : prog.status === "equal" ? (
                                <span className="text-blue-400 font-bold text-xs">➔ Stabil</span>
                              ) : prog.status === "decreased" ? (
                                <span className="text-amber-400 font-bold text-xs">Deload / -</span>
                              ) : (
                                <span className="text-zinc-500 text-xs font-sans">Erstaufzeichnung</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GEWICHTSVERLAUF */}
          {activeTab === "weight" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">Wöchentlicher Gewichtsverlauf</span>
                  <p className="text-zinc-400 text-[11px]">
                    Basierend auf deinen täglichen Nüchterngewicht-Eintragungen in Tabelle 4 (Gewichtstrack).
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
                  Phase: {currentWeek?.phase || "AUFBAU"}
                </div>
              </div>

              {/* Weekly Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {weekWeightStats.map((stat, i) => {
                  const prevStat = i > 0 ? weekWeightStats[i - 1] : null;
                  const delta = prevStat && stat.avg > 0 && prevStat.avg > 0 
                    ? Math.round((stat.avg - prevStat.avg) * 10) / 10 
                    : null;
                  const isCurrent = stat.week.id === currentWeek.id;

                  return (
                    <div
                      key={stat.week.id}
                      onClick={() => onSelectWeek(stat.week.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isCurrent
                          ? "bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-400/30 shadow-md"
                          : "bg-white/5 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-black uppercase ${isCurrent ? "text-cyan-300" : "text-white"}`}>
                          {stat.week.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {stat.count}/7 Wiegetage
                        </span>
                      </div>

                      {/* Average Weight */}
                      <div className="text-2xl font-black text-white font-mono tracking-tight my-1">
                        {stat.avg > 0 ? `${stat.avg} kg` : <span className="text-zinc-600 text-base">Keine Daten</span>}
                      </div>

                      {/* Delta to previous week */}
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5 mt-2">
                        <span className="text-zinc-400">Veränderung:</span>
                        {delta !== null ? (
                          <span className={`font-bold font-mono ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-amber-400" : "text-zinc-400"}`}>
                            {delta > 0 ? `+${delta} kg` : `${delta} kg`}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono">—</span>
                        )}
                      </div>

                      {/* Min / Max */}
                      {stat.count > 1 && (
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-1">
                          <span>Min: {stat.min} kg</span>
                          <span>Max: {stat.max} kg</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Day-by-Day Table for Current Week */}
              <div className="mt-4 border border-white/10 rounded-xl overflow-hidden bg-[#18181c]">
                <div className="px-4 py-2.5 bg-[#1f1f26] border-b border-white/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                    Tageswerte {currentWeek?.name} (Nüchterngewicht)
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    Schnitt: <strong>{weekWeightStats.find((s) => s.week.id === currentWeek.id)?.avg || 0} kg</strong>
                  </span>
                </div>
                <div className="grid grid-cols-7 divide-x divide-white/5 text-center p-2 text-xs font-mono">
                  {(currentWeek?.weightRows || []).map((row) => (
                    <div key={row.id} className="p-2 space-y-1">
                      <div className="text-zinc-500 font-bold text-[10px]">{row.shortDay}</div>
                      <div className="text-white font-black text-sm">
                        {row.weight ? `${row.weight}` : <span className="text-zinc-700">—</span>}
                      </div>
                      <div className="text-[10px] text-zinc-600">{row.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALLE WOCHEN */}
          {activeTab === "weeks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Verwalte deine Trainingswochen oder füge neue hinzu:</span>
                <button
                  onClick={onAddWeek}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neue Woche hinzufügen</span>
                </button>
              </div>

              <div className="space-y-2">
                {weeks.map((w, idx) => {
                  const isCurrent = w.id === selectedWeekId;
                  const workoutsCount = (w.days || []).filter(
                    (d) => !d.focusTitle?.toUpperCase().includes("REST") && !d.focusTitle?.toUpperCase().includes("KRANK") && !d.focusTitle?.toUpperCase().includes("OFFEN")
                  ).length;

                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? "bg-cyan-500/10 border-cyan-500/40"
                          : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCurrent ? "bg-cyan-500 text-black" : "bg-white/10 text-zinc-300"
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {editingWeekId === w.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={editingWeekName}
                                  onChange={(e) => setEditingWeekName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && editingWeekName.trim()) {
                                      onRenameWeek && onRenameWeek(w.id, editingWeekName.trim());
                                      setEditingWeekId(null);
                                    } else if (e.key === "Escape") {
                                      setEditingWeekId(null);
                                    }
                                  }}
                                  className="bg-[#111113] border border-cyan-400 rounded px-2 py-0.5 text-xs text-white font-bold focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (editingWeekName.trim() && onRenameWeek) {
                                      onRenameWeek(w.id, editingWeekName.trim());
                                    }
                                    setEditingWeekId(null);
                                  }}
                                  className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                                  title="Name speichern"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingWeekId(null)}
                                  className="p-1 rounded bg-white/10 text-zinc-400 hover:text-white cursor-pointer text-xs"
                                  title="Abbrechen"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-black text-sm text-white">{w.name}</span>
                                {onRenameWeek && (
                                  <button
                                    onClick={() => {
                                      setEditingWeekId(w.id);
                                      setEditingWeekName(w.name);
                                    }}
                                    className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-white/5 cursor-pointer transition-colors"
                                    title="Woche umbenennen"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                            )}

                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                                Aktiv
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Phase: <strong>{w.phase || "AUFBAU"}</strong> • {workoutsCount} Trainingseinheiten
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCurrent ? (
                          <button
                            onClick={() => {
                              onSelectWeek(w.id);
                              onClose();
                            }}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
                          >
                            Zu dieser Woche wechseln
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ausgewählt</span>
                          </span>
                        )}

                        {/* Delete week button */}
                        {onDeleteWeek && (
                          <button
                            onClick={() => {
                              if (weeks.length <= 1) {
                                alert("Du kannst nicht die einzige verbleibende Woche löschen.");
                                return;
                              }
                              if (window.confirm(`Möchtest du "${w.name}" wirklich unwiderruflich löschen?`)) {
                                onDeleteWeek(w.id);
                              }
                            }}
                            disabled={weeks.length <= 1}
                            title={weeks.length <= 1 ? "Mindestens 1 Woche muss erhalten bleiben" : `"${w.name}" löschen`}
                            className={`p-1.5 rounded-lg transition-all ${
                              weeks.length <= 1
                                ? "text-zinc-700 cursor-not-allowed opacity-40"
                                : "text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#111114] border-t border-white/10 flex items-center justify-between text-xs text-zinc-500">
          <span>Automatisch gesichert mit Firebase Cloud</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
