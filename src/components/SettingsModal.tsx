import React, { useState } from "react";
import { DayPlan, WorkoutPresetType } from "../types";
export type { WorkoutPresetType };
import {
  X,
  Settings,
  Dumbbell,
  Footprints,
  Coffee,
  RotateCcw,
  Sparkles,
  Check,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  Trash2
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayPlan[];
  activeDayId: string;
  onSelectDay: (dayId: string) => void;
  currentWeekName: string;
  onUpdateDayTraining: (dayId: string, preset: WorkoutPresetType, customTitle?: string) => void;
  onClearWeekTrainings: () => void;
  onResetEntirePlan: () => void;
  onApplyTTRepeatPattern: () => void;
}

export const WORKOUT_PRESETS: {
  id: WorkoutPresetType;
  label: string;
  shortLabel: string;
  badge: string;
  colorClass: string;
  description: string;
}[] = [
  {
    id: "offen",
    label: "⚪ Noch kein Training festgelegt (Offen / Frei)",
    shortLabel: "Offen",
    badge: "OFFEN",
    colorClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
    description: "Tag ist noch frei – Übungen oder Ruhetag können später eingetragen werden.",
  },
  {
    id: "brust_ruecken",
    label: "🏋️ Brust / Rücken (Training 1)",
    shortLabel: "Brust / Rücken",
    badge: "TRAINING 1",
    colorClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    description: "Latzug 2, Incline Bench smith 3, Upper back row 3, Butterfly 2, SA Lat highrow 2, RDL 1, Leg curl 2",
  },
  {
    id: "arme_schultern",
    label: "🏋️ Arme / Schultern (Training 2)",
    shortLabel: "Arme / Schultern",
    badge: "TRAINING 2",
    colorClass: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    description: "Schulterdrücken KH 2, Seitheben 3, Preacher curl 3, Pushdowns 3, Hammer curl 2, Reverse curl 1",
  },
  {
    id: "rest_run",
    label: "🏃 Restday: Laufen (Restday)",
    shortLabel: "Restday: Laufen",
    badge: "RESTDAY",
    colorClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    description: "Erholungstag mit Zone 2 Laufen (30-45 min, 6k-8k Schritte) im Cardio-Tab",
  },
  {
    id: "krank_pause",
    label: "🛌 Krank / Pause / Schonung",
    shortLabel: "Krank / Pause",
    badge: "PAUSE",
    colorClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    description: "Komplette Ruhe & Regeneration (kein Krafttraining, nur Erholung)",
  },
];

export function getPresetFromFocusTitle(title: string): WorkoutPresetType {
  const t = (title || "").toLowerCase().trim();
  if (t.includes("offen") || t.includes("kein training") || t === "" || t.includes("noch kein")) {
    return "offen";
  }
  if (t.includes("brust") || t.includes("rücken") || t.includes("ruecken")) {
    return "brust_ruecken";
  }
  if (t.includes("arm") || t.includes("schulter")) {
    return "arme_schultern";
  }
  if (t.includes("krank") || t.includes("schonung") || t.includes("pause") || t.includes("bettruhe")) {
    return "krank_pause";
  }
  if (t.includes("rest") || t.includes("lauf") || t.includes("erhol")) {
    return "rest_run";
  }
  return "custom";
}

export function SettingsModal({
  isOpen,
  onClose,
  days,
  activeDayId,
  onSelectDay,
  currentWeekName,
  onUpdateDayTraining,
  onClearWeekTrainings,
  onResetEntirePlan,
  onApplyTTRepeatPattern,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"days" | "split" | "general">("days");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#18181d] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#141418] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  Plan-Einstellungen
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white font-bold font-mono">
                  {currentWeekName}
                </span>
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Trainingstage für diese Woche festlegen
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 bg-[#16161a] border-b border-white/5 flex gap-2">
          <button
            onClick={() => setActiveTab("days")}
            className={`px-3.5 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === "days"
                ? "bg-[#18181d] text-cyan-300 border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5"
            }`}
          >
            Tage dieser Woche anpassen (MO - SO)
          </button>
          <button
            onClick={() => setActiveTab("split")}
            className={`px-3.5 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === "split"
                ? "bg-[#18181d] text-cyan-300 border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5"
            }`}
          >
            Muster & Vorlagen
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`px-3.5 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              activeTab === "general"
                ? "bg-[#18181d] text-cyan-300 border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/5"
            }`}
          >
            Standard-Plan & Reset
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "days" && (
            <div className="space-y-4">
              {/* Clarification & Confirmation Banner */}
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-zinc-300 space-y-1.5">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Jede Woche ist vollkommen flexibel:</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  An einer neuen Woche sind standardmäßig keine Trainings unveränderlich festgeschrieben. 
                  Du stellst hier für jeden Wochentag selbst ein, welches Training stattfinden soll. 
                  Du kannst Tage auch auf <strong className="text-white">"Noch kein Training festgelegt"</strong> setzen 
                  und erst spontan entscheiden!
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      onClearWeekTrainings();
                      showFeedback(`Alle 7 Tage von ${currentWeekName} auf "Noch kein Training" gesetzt!`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[11px] font-bold cursor-pointer transition-all"
                  >
                    ⚪ Ganze Woche leeren (Alle Tage auf "Offen")
                  </button>
                  <button
                    onClick={() => {
                      onApplyTTRepeatPattern();
                      showFeedback(`Woche ${currentWeekName} auf Training-Training-Rest-Repeat gesetzt!`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold cursor-pointer transition-all"
                  >
                    ⚡ TT-Repeat Rhythmus anwenden
                  </button>
                </div>
              </div>

              {/* Day List */}
              <div className="space-y-2.5">
                {days.map((day) => {
                  const isCurrentActiveDay = day.id === activeDayId;
                  const currentPreset = getPresetFromFocusTitle(day.focusTitle);

                  return (
                    <div
                      key={day.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isCurrentActiveDay
                          ? "bg-[#202028] border-cyan-500/40 shadow-sm ring-1 ring-cyan-500/20"
                          : "bg-[#1b1b21] border-white/5 hover:border-white/15"
                      }`}
                    >
                      {/* Left: Day Badge & Info */}
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => {
                            onSelectDay(day.id);
                            showFeedback(`${day.name} als aktiver Tag ausgewählt.`);
                          }}
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 border ${
                            isCurrentActiveDay
                              ? "bg-cyan-500 text-black border-cyan-400 font-black shadow"
                              : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                          }`}
                          title="Klicken, um diesen Tag in der Hauptansicht anzuzeigen"
                        >
                          <span className="text-xs font-black">{day.label}</span>
                          <span className={`text-[9px] font-mono ${isCurrentActiveDay ? "text-black/80" : "text-zinc-400"}`}>
                            {day.date || ""}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white">{day.name}</span>
                            {isCurrentActiveDay && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                                Aktiver Tag
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            <span>Festgelegt als:</span>
                            <span className="font-semibold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {day.focusTitle}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions & Dropdown */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Day View Select Button */}
                        {!isCurrentActiveDay && (
                          <button
                            onClick={() => {
                              onSelectDay(day.id);
                              showFeedback(`${day.name} geöffnet!`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                            title="Diesen Tag in den Tabellen anzeigen"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Öffnen</span>
                          </button>
                        )}

                        {/* Dropdown selector for this day's workout */}
                        <div className="relative">
                          <select
                            value={currentPreset}
                            onChange={(e) => {
                              const val = e.target.value as WorkoutPresetType;
                              onUpdateDayTraining(day.id, val);
                              const match = WORKOUT_PRESETS.find((p) => p.id === val);
                              showFeedback(`${day.name} auf "${match?.shortLabel || val}" geändert!`);
                            }}
                            className="w-full sm:w-auto bg-[#131317] border border-cyan-500/30 hover:border-cyan-400 rounded-xl px-3 py-2 text-xs font-bold text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer shadow-inner"
                          >
                            <option value="offen">⚪ Noch kein Training (Offen / Frei)</option>
                            <option value="brust_ruecken">🏋️ Brust / Rücken (Training 1)</option>
                            <option value="arme_schultern">🏋️ Arme / Schultern (Training 2)</option>
                            <option value="rest_run">🏃 Restday: Laufen (Restday)</option>
                            <option value="krank_pause">🛌 Krank / Pause / Schonung</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "split" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-zinc-300">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Standard Training-Training-Rest-Repeat Prinzip</span>
                </div>
                <div className="text-zinc-400 text-[11px] mb-2">
                  Belegt die Wochentage im Rhythmus 2 Tage Krafttraining, 1 Tag Restday (Laufen), Repeat:
                </div>
                <div className="bg-[#121216] border border-white/5 rounded-xl p-3 font-mono text-[11px] text-zinc-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>MO: <span className="text-cyan-400 font-bold">Brust/Rücken</span></div>
                  <div>DI: <span className="text-blue-400 font-bold">Arme/Schultern</span></div>
                  <div>MI: <span className="text-amber-400 font-bold">Laufen (Rest)</span></div>
                  <div>DO: <span className="text-cyan-400 font-bold">Brust/Rücken</span></div>
                  <div>FR: <span className="text-blue-400 font-bold">Arme/Schultern</span></div>
                  <div>SA: <span className="text-amber-400 font-bold">Laufen (Rest)</span></div>
                  <div>SO: <span className="text-cyan-400 font-bold">Brust/Rücken</span></div>
                </div>
                <button
                  onClick={() => {
                    onApplyTTRepeatPattern();
                    showFeedback(`Woche ${currentWeekName} erfolgreich auf TT-Repeat gesetzt!`);
                  }}
                  className="mt-3 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow"
                >
                  Dieses Muster jetzt auf {currentWeekName} anwenden
                </button>
              </div>

              {/* Clear Week Option */}
              <div className="p-4 rounded-xl bg-zinc-800/40 border border-white/10 text-xs text-zinc-300">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                  <Trash2 className="w-4 h-4 text-zinc-400" />
                  <span>Woche leeren (Alles auf "Noch kein Training festgelegt")</span>
                </div>
                <div className="text-zinc-400 text-[11px] mb-3">
                  Setzt alle 7 Tage dieser Woche auf den Status "Offen", sodass du deine Trainings völlig frei von Hand oder nach Tagesform festlegen kannst.
                </div>
                <button
                  onClick={() => {
                    onClearWeekTrainings();
                    showFeedback(`Alle Tage von ${currentWeekName} auf "Noch kein Training" gesetzt!`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
                >
                  Alle 7 Tage leeren (Offen lassen)
                </button>
              </div>

              {/* Sick / Recovery Week Option */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-300">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5 text-sm">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Krankheits- / Deload-Woche</span>
                </div>
                <div className="text-zinc-400 text-[11px] mb-3">
                  Du bist krank, verletzt oder brauchst eine Ruhewoche? Setzt alle Tage von MO bis SO auf Pause & Schonung.
                </div>
                <button
                  onClick={() => {
                    days.forEach((d) => onUpdateDayTraining(d.id, "krank_pause"));
                    showFeedback(`Alle Tage von ${currentWeekName} auf 'Krank / Schonung' gesetzt!`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
                >
                  Ganze Woche auf Pause / Krank setzen
                </button>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="font-bold text-white">Bestätigung der Wochenplanung</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  ✓ <strong>Wochenunabhängig:</strong> Jede Woche kann unabhängig gestaltet werden.
                  <br />
                  ✓ <strong>Selbst einstellbar:</strong> Ob du 2, 4 oder 6 Mal trainierst, entscheidest du in den Einstellungen oder direkt in der Tabelle.
                  <br />
                  ✓ <strong>Automatische Sicherung:</strong> Alle Einstellungen werden sofort in der Cloud gesichert.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Kompletten Plan auf Werkseinstellung zurücksetzen</span>
                </div>
                <p className="text-zinc-400 text-[11px] mb-3">
                  Setzt alle Tabellen (Gym-Übungen, Ernährungsplan 3.340 kcal, Cardio, Gewichtstrack) auf den Ursprungszustand zurück.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("Bist du sicher? Alle Änderungen werden auf den Standardplan zurückgesetzt.")) {
                      onResetEntirePlan();
                      showFeedback("Plan wurde auf Werkseinstellungen zurückgesetzt!");
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Auf Standard zurücksetzen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#141418] border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 hidden sm:block">
            Tipp: Du kannst auch auf den Tag-Button klicken, um direkt dorthin zu springen.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md"
          >
            Fertig & Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
