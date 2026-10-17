import React, { useState } from "react";
import { WeekPlan, parseGermanOrEnglishNumber } from "../types";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Scale,
  Dumbbell,
  Plus,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Flame,
  Activity,
  Layers,
  ChevronRight,
  Award
} from "lucide-react";

interface WeekOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeks: WeekPlan[];
  selectedWeekId: string;
  onSelectWeek: (weekId: string) => void;
  onAddWeek: () => void;
  onOpenPlanCreator?: () => void;
}

/**
 * Extracts max weight and reps from setsAndWeight string (e.g. "35x7, 35x7, 35x6" -> weight: 35, reps: 7)
 */
function parseExerciseStats(setsAndWeightStr: string): { maxWeight: number; maxReps: number; totalVolume: number; setsCount: number } {
  if (!setsAndWeightStr || typeof setsAndWeightStr !== "string") {
    return { maxWeight: 0, maxReps: 0, totalVolume: 0, setsCount: 0 };
  }

  const parts = setsAndWeightStr.split(",").map((s) => s.trim());
  let maxWeight = 0;
  let maxReps = 0;
  let totalVolume = 0;
  let setsCount = 0;

  for (const part of parts) {
    // Matches patterns like "35x7", "35 x 7", "37,5x8", "40kg x 6", "12 reps @ 70kg"
    const matchX = part.replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)\s*(?:x|×|\*)\s*([0-9]+)/i);
    if (matchX) {
      const weight = parseFloat(matchX[1]);
      const reps = parseInt(matchX[2], 10);
      if (!isNaN(weight) && !isNaN(reps)) {
        setsCount++;
        if (weight > maxWeight) maxWeight = weight;
        if (reps > maxReps) maxReps = reps;
        totalVolume += weight * reps;
        continue;
      }
    }

    // Fallback: just find numbers
    const numMatches = part.replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/g);
    if (numMatches && numMatches.length >= 2) {
      const w = parseFloat(numMatches[0]);
      const r = parseInt(numMatches[1], 10);
      if (!isNaN(w) && !isNaN(r)) {
        setsCount++;
        if (w > maxWeight) maxWeight = w;
        if (r > maxReps) maxReps = r;
        totalVolume += w * r;
      }
    }
  }

  return { maxWeight, maxReps, totalVolume, setsCount };
}

export default function WeekOverviewModal({
  isOpen,
  onClose,
  weeks,
  selectedWeekId,
  onSelectWeek,
  onAddWeek,
  onOpenPlanCreator,
}: WeekOverviewModalProps) {
  const [activeTab, setActiveTab] = useState<"progression" | "weight" | "weeks">("progression");

  if (!isOpen) return null;

  // 1. Compute weight stats per week
  const weekWeightStats = weeks.map((w, idx) => {
    const validWeights = (w.weightRows || [])
      .map((r) => parseGermanOrEnglishNumber(r.weight))
      .filter((num) => !isNaN(num) && num > 0);

    const count = validWeights.length;
    const avg = count > 0 ? validWeights.reduce((a, b) => a + b, 0) / count : null;
    const min = count > 0 ? Math.min(...validWeights) : null;
    const max = count > 0 ? Math.max(...validWeights) : null;

    return {
      week: w,
      index: idx,
      count,
      avg,
      min,
      max,
    };
  });

  // 2. Scan exercises across weeks to build progression comparison
  // Gather unique exercise names from all weeks (ignoring empty or rest entries)
  const exerciseMap: Record<
    string,
    {
      name: string;
      dayLabel: string;
      byWeek: Record<string, { raw: string; maxWeight: number; maxReps: number; setsCount: number }>;
    }
  > = {};

  weeks.forEach((w) => {
    (w.days || []).forEach((d) => {
      (d.gymRows || []).forEach((row) => {
        const cleanName = (row.name || "").trim();
        if (
          !cleanName ||
          cleanName.toLowerCase().includes("pause") ||
          cleanName.toLowerCase().includes("erholung") ||
          cleanName.toLowerCase().includes("kein training")
        ) {
          return;
        }

        const key = cleanName.toLowerCase();
        if (!exerciseMap[key]) {
          exerciseMap[key] = {
            name: cleanName,
            dayLabel: d.name,
            byWeek: {},
          };
        }

        const stats = parseExerciseStats(row.setsAndWeight);
        exerciseMap[key].byWeek[w.id] = {
          raw: row.setsAndWeight || "—",
          maxWeight: stats.maxWeight,
          maxReps: stats.maxReps,
          setsCount: stats.setsCount,
        };
      });
    });
  });

  const exerciseList = Object.values(exerciseMap);

  // Compare previous week with current selected week or last two weeks
  const currentWeekIdx = weeks.findIndex((w) => w.id === selectedWeekId);
  const prevWeek = currentWeekIdx > 0 ? weeks[currentWeekIdx - 1] : null;
  const currentWeek = weeks[currentWeekIdx] || weeks[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#18181d] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#141418] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  Wochen-Zentrale
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-xs text-zinc-300 font-bold">{currentWeek?.name} ({currentWeek?.phase || "Aufbau"})</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
                WOCHENÜBERSICHT & PROGRESSION
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-[#121215] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("progression")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "progression"
                  ? "bg-cyan-500 text-black shadow-sm font-extrabold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Übungs-Progression (Steigerung)</span>
            </button>

            <button
              onClick={() => setActiveTab("weight")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "weight"
                  ? "bg-purple-500 text-white shadow-sm font-extrabold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Gewichtsverlauf</span>
            </button>

            <button
              onClick={() => setActiveTab("weeks")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "weeks"
                  ? "bg-emerald-500 text-black shadow-sm font-extrabold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Alle Wochen ({weeks.length})</span>
            </button>
          </div>

          <button
            onClick={onAddWeek}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold transition-all cursor-pointer border border-cyan-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Neue Woche starten</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: EXERCISE PROGRESSION (Steigerung in den Übungen) */}
          {activeTab === "progression" && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-3 text-xs text-zinc-300">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Automatische Steigerungs-Erkennung:</strong> Das System vergleicht deine Gewichte und Wiederholungen zwischen den Trainingswochen.
                  {prevWeek ? (
                    <span className="block mt-1 text-cyan-300 font-semibold">
                      Vergleich: <strong>{prevWeek.name}</strong> ➔ <strong>{currentWeek.name}</strong>
                    </span>
                  ) : (
                    <span className="block mt-1 text-zinc-400">
                      Aktuell ist <strong>{currentWeek.name}</strong> ausgewählt (Basis-Woche). Sobald du weitere Wochen absolvierst, wird hier deine Steigerung (+ kg / + Wdh.) visualisiert!
                    </span>
                  )}
                </div>
              </div>

              {/* Progression Table */}
              <div className="bg-[#141418] border border-white/10 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#101013] text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10">
                      <th className="py-2.5 px-3">Übung</th>
                      <th className="py-2.5 px-3">Tag</th>
                      {prevWeek && <th className="py-2.5 px-3 text-zinc-400">{prevWeek.name}</th>}
                      <th className="py-2.5 px-3 text-cyan-400 font-bold">{currentWeek.name}</th>
                      <th className="py-2.5 px-3 text-center">Trend / Steigerung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {exerciseList.map((ex) => {
                      const currData = ex.byWeek[currentWeek.id];
                      const prevData = prevWeek ? ex.byWeek[prevWeek.id] : null;

                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-zinc-400 font-sans">
                          Basis erfasst
                        </span>
                      );

                      if (prevData && currData && prevData.maxWeight > 0 && currData.maxWeight > 0) {
                        const weightDiff = currData.maxWeight - prevData.maxWeight;
                        const repsDiff = currData.maxReps - prevData.maxReps;

                        if (weightDiff > 0) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span>+{weightDiff} kg</span>
                            </span>
                          );
                        } else if (weightDiff === 0 && repsDiff > 0) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span>+{repsDiff} Wdh.</span>
                            </span>
                          );
                        } else if (weightDiff === 0 && repsDiff === 0) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold text-[10px] border border-amber-500/25">
                              <Minus className="w-3 h-3 text-amber-400" />
                              <span>Gehalten</span>
                            </span>
                          );
                        } else if (weightDiff < 0) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[11px] border border-rose-500/30">
                              <TrendingDown className="w-3 h-3 text-rose-400" />
                              <span>{weightDiff} kg</span>
                            </span>
                          );
                        }
                      }

                      return (
                        <tr key={ex.name} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-sans font-bold text-white">
                            {ex.name}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-zinc-400 text-[11px]">
                            {ex.dayLabel}
                          </td>
                          {prevWeek && (
                            <td className="py-2.5 px-3 text-zinc-400">
                              {prevData?.raw || "—"}
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-cyan-300 font-bold">
                            {currData?.raw || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })}

                    {exerciseList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500 font-sans text-xs">
                          Noch keine Übungen mit Gewicht eingetragen. Trage Übungen in Tabelle 1 (Gym-Training) ein!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: WEIGHT PROGRESSION (Gewichtsverlauf) */}
          {activeTab === "weight" && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {weekWeightStats.map((stat, idx) => {
                  const isSelected = stat.week.id === selectedWeekId;
                  const prevStat = idx > 0 ? weekWeightStats[idx - 1] : null;
                  let deltaStr: string | null = null;
                  if (prevStat?.avg && stat.avg) {
                    const diff = stat.avg - prevStat.avg;
                    deltaStr = diff > 0 ? `+${diff.toFixed(2)} kg` : `${diff.toFixed(2)} kg`;
                  }

                  return (
                    <div
                      key={stat.week.id}
                      onClick={() => onSelectWeek(stat.week.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-purple-950/30 border-purple-500/50 shadow-md ring-1 ring-purple-400/40"
                          : "bg-[#141418] border-white/10 hover:border-white/20 hover:bg-[#1a1a20]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-extrabold text-white text-sm">{stat.week.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                          {stat.week.phase || "AUFBAU"}
                        </span>
                      </div>

                      <div className="text-2xl font-black text-purple-300 font-mono mb-1">
                        {stat.avg ? `${stat.avg.toFixed(1)} kg` : "—"}
                        <span className="text-xs font-normal text-zinc-400 ml-1.5">Ø Woche</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-2 border-t border-white/5">
                        <span>{stat.count}/7 Tage gewogen</span>
                        {deltaStr && (
                          <span className={`font-bold ${deltaStr.startsWith("+") ? "text-emerald-400" : "text-amber-400"}`}>
                            Trend: {deltaStr}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Daily Weight Comparison Table */}
              <div className="bg-[#141418] border border-white/10 rounded-xl overflow-hidden shadow-lg mt-4">
                <div className="p-3 bg-[#101013] border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-400" />
                    <span>Tägliche Wiege-Werte im Vergleich</span>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-black/30 text-zinc-400 border-b border-white/5 text-[11px]">
                        <th className="py-2.5 px-3">Tag</th>
                        {weeks.map((w) => (
                          <th key={w.id} className="py-2.5 px-3 text-center">
                            {w.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {["MO", "DI", "MI", "DO", "FR", "SA", "SO"].map((shortDay, dayIdx) => (
                        <tr key={shortDay} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-sans font-bold text-zinc-300">
                            {shortDay}
                          </td>
                          {weeks.map((w) => {
                            const row = w.weightRows?.[dayIdx];
                            const wVal = row ? parseGermanOrEnglishNumber(row.weight) : 0;
                            return (
                              <td key={w.id} className="py-2 px-3 text-center">
                                {wVal > 0 ? (
                                  <span className="font-bold text-white">{wVal.toFixed(1)} kg</span>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEEKS MANAGEMENT (Alle Wochen) */}
          {activeTab === "weeks" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weeks.map((w, idx) => {
                  const isSelected = w.id === selectedWeekId;
                  const stat = weekWeightStats[idx];

                  return (
                    <div
                      key={w.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isSelected
                          ? "bg-cyan-950/30 border-cyan-500/50 shadow-md ring-1 ring-cyan-400/40"
                          : "bg-[#141418] border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-base font-black text-white">{w.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-bold">
                            {w.phase || "AUFBAU"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">
                          {stat.avg ? `Ø Gewicht: ${stat.avg.toFixed(1)} kg • ` : ""}
                          {stat.count} Tage eingetragen • 7 Tage Plan
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aktive Woche</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectWeek(w.id);
                              onClose();
                            }}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
                          >
                            Zu dieser Woche wechseln
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Cards */}
              <div className="p-4 rounded-xl bg-[#121215] border border-white/10 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Neue Trainingswoche anlegen</h4>
                  <p className="text-xs text-zinc-400">
                    Erstellt die nächste Woche und übernimmt deine Übungen und Trainingsstruktur.
                  </p>
                </div>
                <button
                  onClick={onAddWeek}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Woche {weeks.length + 1} hinzufügen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#141418] border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Aktive Woche: <strong className="text-white">{currentWeek?.name}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
