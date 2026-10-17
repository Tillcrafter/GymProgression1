import React, { useState, useEffect } from "react";
import { DayPlan, GymTableRow, WeekPlan, SavedWorkout } from "../types";
import { 
  X, 
  Dumbbell, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  FolderPlus,
  Play,
  Copy,
  Info,
  Bookmark,
  Calendar,
  Save,
  Edit2
} from "lucide-react";
import { getSavedWorkouts, saveWorkoutsToStorage } from "../savedWorkoutsData";

interface WorkoutPlanManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: WeekPlan;
  activeDayId?: string;
  onApplyPlanToWeek: (newDays: DayPlan[], planName: string) => void;
  onApplyWorkoutToDay?: (dayId: string, workout: SavedWorkout) => void;
}

interface SplitPreset {
  id: string;
  name: string;
  shortDesc: string;
  badge: string;
  colorClass: string;
  days: {
    dayId: string;
    dayName: string;
    focusTitle: string;
    exercises: { name: string; setsAndWeight: string; notes?: string }[];
  }[];
}

const PRESET_PLANS: SplitPreset[] = [
  {
    id: "push_pull_legs",
    name: "Push / Pull / Beine (PPL 3er-Split)",
    shortDesc: "Der beliebteste Split für Muskelaufbau & Progression mit optimaler Frequenz.",
    badge: "HYPERTROPHIE",
    colorClass: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30",
    days: [
      {
        dayId: "mo",
        dayName: "Montag",
        focusTitle: "PUSH 1 (Brust / Vordere & Seitl. Schulter / Trizeps)",
        exercises: [
          { name: "Incline Bench Press Smith", setsAndWeight: "70x8, 70x8, 70x7", notes: "2-3 min Pause" },
          { name: "Butterfly / Cable Flys", setsAndWeight: "55x10, 55x10", notes: "Voller Stretch" },
          { name: "Schulterdrücken KH", setsAndWeight: "26x8, 26x8", notes: "Kontrollierte Exzentrik" },
          { name: "Seitheben am Kabel", setsAndWeight: "12x12, 12x11, 12x10", notes: "90s Pause" },
          { name: "Trizeps Pushdowns", setsAndWeight: "35x10, 35x10, 35x9", notes: "Peak Contraction" },
        ],
      },
      {
        dayId: "di",
        dayName: "Dienstag",
        focusTitle: "PULL 1 (Rückenbreite / Tiefe / Hintere Schulter / Bizeps)",
        exercises: [
          { name: "Latzug zur Brust", setsAndWeight: "75x8, 75x8, 75x7", notes: "Schulterblätter fixieren" },
          { name: "Upper Back Row (Brustgestützt)", setsAndWeight: "65x8, 65x8, 65x8", notes: "Ellenbogen 45-60°" },
          { name: "SA Lat Highrow Kabel", setsAndWeight: "40x9, 40x8", notes: "Latissimus-Fokus" },
          { name: "Reverse Flys / Facepulls", setsAndWeight: "25x12, 25x12", notes: "Hintere Schulter" },
          { name: "Preacher Curls", setsAndWeight: "32x9, 32x8, 32x8", notes: "Voller Bewegungsumfang" },
          { name: "Hammer Curls KH", setsAndWeight: "16x10, 16x9", notes: "Brachialis-Fokus" },
        ],
      },
      {
        dayId: "mi",
        dayName: "Mittwoch",
        focusTitle: "BEINE & BAUCH (Quads / Hamstrings / Waden)",
        exercises: [
          { name: "Beinpresse 45° / Kniebeugen", setsAndWeight: "180x8, 180x8, 180x8", notes: "Tiefe Beugung" },
          { name: "Rumänisches Kreuzheben (RDL)", setsAndWeight: "100x8, 100x8", notes: "Hamstrings dehnen" },
          { name: "Beinstrecker (Leg Extension)", setsAndWeight: "60x10, 60x10, 60x10", notes: "1s Pause oben" },
          { name: "Liegender Beinbeuger (Leg Curl)", setsAndWeight: "50x10, 50x9", notes: "Hamstring Peak" },
          { name: "Wadenheben stehend", setsAndWeight: "80x12, 80x12", notes: "Voller Stretch unten" },
        ],
      },
      {
        dayId: "do",
        dayName: "Donnerstag",
        focusTitle: "RESTDAY: LAUFEN & REGENERATION",
        exercises: [],
      },
      {
        dayId: "fr",
        dayName: "Freitag",
        focusTitle: "PUSH 2 (Fokus Obere Brust & Schultern)",
        exercises: [
          { name: "Kurzhantel Schrägbankdrücken", setsAndWeight: "32x8, 32x8, 32x7", notes: "30° Bankwinkel" },
          { name: "Dips / Brustpresse", setsAndWeight: "80x9, 80x8", notes: "Tiefe Dehnung" },
          { name: "Seitheben Kurzhanteln", setsAndWeight: "14x12, 14x11, 14x10", notes: "Streng ohne Schwung" },
          { name: "Overhead Triceps Extension", setsAndWeight: "30x10, 30x10", notes: "Langer Trizepskopf" },
        ],
      },
      {
        dayId: "sa",
        dayName: "Samstag",
        focusTitle: "PULL 2 (Rücken & Arme Fokus)",
        exercises: [
          { name: "Klimmzüge / Latzug eng", setsAndWeight: "80x7, 80x7, 80x6", notes: "Untergriff / Neutral" },
          { name: "T-Bar Row / Kurzhantelrudern", setsAndWeight: "60x9, 60x8", notes: "Rückendichte" },
          { name: "Incline Dumbbell Curl", setsAndWeight: "14x9, 14x9", notes: "Bizeps langer Kopf" },
          { name: "Reverse Curls Sz-Stange", setsAndWeight: "25x12, 25x11", notes: "Unterarme & Brachioradialis" },
        ],
      },
      {
        dayId: "so",
        dayName: "Sonntag",
        focusTitle: "RESTDAY: ERHOLUNG / LAUFEN",
        exercises: [],
      },
    ],
  },
  {
    id: "ok_uk_split",
    name: "Oberkörper / Unterkörper (2er-Split)",
    shortDesc: "Perfekt für 4 Trainingstage die Woche mit 2 Restdays zur maximalen Regeneration.",
    badge: "EFFIZIENT (4 TAGE)",
    colorClass: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30",
    days: [
      {
        dayId: "mo",
        dayName: "Montag",
        focusTitle: "OBERKÖRPER A (Brust / Rücken Fokus)",
        exercises: [
          { name: "Incline Bench Press Smith", setsAndWeight: "70x8, 70x8, 70x7", notes: "2 min Pause" },
          { name: "Latzug zur Brust", setsAndWeight: "75x8, 75x8, 75x7", notes: "Lat Fokus" },
          { name: "Upper Back Row", setsAndWeight: "65x8, 65x8", notes: "Oberer Rücken" },
          { name: "Seitheben am Kabel", setsAndWeight: "12x12, 12x11", notes: "Seitliche Schulter" },
          { name: "Trizeps Pushdowns", setsAndWeight: "35x10, 35x9", notes: "Trizeps" },
          { name: "Preacher Curls", setsAndWeight: "32x9, 32x8", notes: "Bizeps" },
        ],
      },
      {
        dayId: "di",
        dayName: "Dienstag",
        focusTitle: "UNTERKÖRPER A (Quads & Waden)",
        exercises: [
          { name: "Kniebeugen / Beinpresse", setsAndWeight: "160x8, 160x8, 160x8", notes: "Oberschenkel" },
          { name: "Liegender Beinbeuger", setsAndWeight: "50x10, 50x10", notes: "Hamstrings" },
          { name: "Beinstrecker", setsAndWeight: "60x11, 60x10", notes: "Quad Burnout" },
          { name: "Wadenheben stehend", setsAndWeight: "80x12, 80x12", notes: "Waden" },
        ],
      },
      {
        dayId: "mi",
        dayName: "Mittwoch",
        focusTitle: "RESTDAY: LAUFEN & ERHOLUNG",
        exercises: [],
      },
      {
        dayId: "do",
        dayName: "Donnerstag",
        focusTitle: "OBERKÖRPER B (Schultern & Arme Fokus)",
        exercises: [
          { name: "Schulterdrücken KH", setsAndWeight: "26x8, 26x8, 26x7", notes: "Schulterkraft" },
          { name: "SA Lat Highrow Kabel", setsAndWeight: "40x9, 40x8", notes: "Latissimus" },
          { name: "Butterfly", setsAndWeight: "55x10, 55x10", notes: "Brust" },
          { name: "Seitheben Kurzhanteln", setsAndWeight: "14x12, 14x11", notes: "Seitl. Delt" },
          { name: "Hammer Curls KH", setsAndWeight: "16x10, 16x9", notes: "Arme" },
          { name: "Overhead Triceps Cable", setsAndWeight: "30x10, 30x10", notes: "Trizeps" },
        ],
      },
      {
        dayId: "fr",
        dayName: "Freitag",
        focusTitle: "UNTERKÖRPER B (Hamstrings & Gesäß)",
        exercises: [
          { name: "Rumänisches Kreuzheben (RDL)", setsAndWeight: "100x8, 100x8, 100x8", notes: "Hamstrings" },
          { name: "Beinpresse (Füße hoch)", setsAndWeight: "170x9, 170x8", notes: "Glutes & Hamstrings" },
          { name: "Beinstrecker", setsAndWeight: "55x12, 55x11", notes: "Quads" },
          { name: "Bauchpresse / Hanging Leg Raises", setsAndWeight: "15, 15, 12", notes: "Core" },
        ],
      },
      {
        dayId: "sa",
        dayName: "Samstag",
        focusTitle: "RESTDAY: LAUFEN (ZONE 2)",
        exercises: [],
      },
      {
        dayId: "so",
        dayName: "Sonntag",
        focusTitle: "RESTDAY: SCHONUNG",
        exercises: [],
      },
    ],
  },
  {
    id: "tt_repeat_current",
    name: "Brust/Rücken & Arme/Schultern (Aktueller Split)",
    shortDesc: "Das bewährte 2-Tage Training, 1-Tag Rest (Laufen) Rotationsprinzip.",
    badge: "AKTUELLER PLAN",
    colorClass: "from-cyan-500/20 to-emerald-500/20 text-emerald-300 border-emerald-500/30",
    days: [
      {
        dayId: "mo",
        dayName: "Montag",
        focusTitle: "BRUST / RÜCKEN (TRAINING 1)",
        exercises: [
          { name: "Latzug 2", setsAndWeight: "35x7, 35x7, 35x6", notes: "2 min Pause, Schultern tief" },
          { name: "Incline Bench smith 3", setsAndWeight: "70x8, 70x8, 70x7", notes: "3 min Pause, Brust voll dehnen" },
          { name: "Upper back row 3", setsAndWeight: "60x8, 60x8, 60x7", notes: "2 min Pause, oberer Rücken" },
          { name: "Butterfly 2", setsAndWeight: "50x9, 50x8", notes: "90s Pause, Stretch halten" },
          { name: "SA Lat highrow 2", setsAndWeight: "30x8, 30x8", notes: "2 min Pause, Latissimus" },
          { name: "RDL 1", setsAndWeight: "90x8", notes: "3 min Pause, Hamstrings" },
          { name: "Leg curl 2", setsAndWeight: "45x8, 45x7", notes: "90s Pause, Beinbeuger" },
        ],
      },
      {
        dayId: "di",
        dayName: "Dienstag",
        focusTitle: "ARME / SCHULTERN (TRAINING 2)",
        exercises: [
          { name: "Schulterdrücken KH 2", setsAndWeight: "24x8, 24x7", notes: "2-3 min Pause" },
          { name: "Seitheben 3", setsAndWeight: "12x12, 12x11, 12x10", notes: "90s Pause, kein Schwung" },
          { name: "Preacher curl 3", setsAndWeight: "30x8, 30x8, 30x7", notes: "2 min Pause, volle Streckung" },
          { name: "Pushdowns 3", setsAndWeight: "35x9, 35x8, 35x8", notes: "90s Pause, Trizeps Peak" },
          { name: "Hammer curl 2", setsAndWeight: "14x10, 14x9", notes: "90s Pause, Brachialis" },
          { name: "Reverse curl 1", setsAndWeight: "20x12", notes: "Unterarme & Griffkraft" },
        ],
      },
      {
        dayId: "mi",
        dayName: "Mittwoch",
        focusTitle: "RESTDAY: LAUFEN (CARDIO)",
        exercises: [],
      },
      {
        dayId: "do",
        dayName: "Donnerstag",
        focusTitle: "BRUST / RÜCKEN (TRAINING 1)",
        exercises: [
          { name: "Latzug 2", setsAndWeight: "35x7, 35x7, 35x7", notes: "2 min Pause, Schultern tief" },
          { name: "Incline Bench smith 3", setsAndWeight: "70x8, 70x8, 70x8", notes: "3 min Pause, Brust voll dehnen" },
          { name: "Upper back row 3", setsAndWeight: "60x8, 60x8, 60x8", notes: "2 min Pause, oberer Rücken" },
          { name: "Butterfly 2", setsAndWeight: "50x9, 50x9", notes: "90s Pause, Stretch halten" },
          { name: "SA Lat highrow 2", setsAndWeight: "30x8, 30x8", notes: "2 min Pause, Latissimus" },
          { name: "RDL 1", setsAndWeight: "90x8", notes: "3 min Pause, Hamstrings" },
          { name: "Leg curl 2", setsAndWeight: "45x8, 45x8", notes: "90s Pause, Beinbeuger" },
        ],
      },
      {
        dayId: "fr",
        dayName: "Freitag",
        focusTitle: "ARME / SCHULTERN (TRAINING 2)",
        exercises: [
          { name: "Schulterdrücken KH 2", setsAndWeight: "24x8, 24x8", notes: "2-3 min Pause" },
          { name: "Seitheben 3", setsAndWeight: "12x12, 12x12, 12x11", notes: "90s Pause, kein Schwung" },
          { name: "Preacher curl 3", setsAndWeight: "30x8, 30x8, 30x8", notes: "2 min Pause, volle Streckung" },
          { name: "Pushdowns 3", setsAndWeight: "35x9, 35x9, 35x8", notes: "90s Pause, Trizeps Peak" },
          { name: "Hammer curl 2", setsAndWeight: "14x10, 14x10", notes: "90s Pause, Brachialis" },
          { name: "Reverse curl 1", setsAndWeight: "20x12", notes: "Unterarme & Griffkraft" },
        ],
      },
      {
        dayId: "sa",
        dayName: "Samstag",
        focusTitle: "RESTDAY: LAUFEN (CARDIO)",
        exercises: [],
      },
      {
        dayId: "so",
        dayName: "Sonntag",
        focusTitle: "BRUST / RÜCKEN (TRAINING 1)",
        exercises: [
          { name: "Latzug 2", setsAndWeight: "35x7, 35x7, 35x7", notes: "2 min Pause" },
          { name: "Incline Bench smith 3", setsAndWeight: "70x8, 70x8, 70x8", notes: "3 min Pause" },
          { name: "Upper back row 3", setsAndWeight: "60x8, 60x8, 60x8", notes: "2 min Pause" },
          { name: "Butterfly 2", setsAndWeight: "50x9, 50x9", notes: "90s Pause" },
          { name: "SA Lat highrow 2", setsAndWeight: "30x8, 30x8", notes: "2 min Pause" },
          { name: "RDL 1", setsAndWeight: "90x8", notes: "3 min Pause" },
          { name: "Leg curl 2", setsAndWeight: "45x8, 45x8", notes: "90s Pause" },
        ],
      },
    ],
  },
];

export function WorkoutPlanManagerModal({
  isOpen,
  onClose,
  currentWeek,
  activeDayId = "mo",
  onApplyPlanToWeek,
  onApplyWorkoutToDay,
}: WorkoutPlanManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"saved" | "presets" | "custom">("saved");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("push_pull_legs");
  const [notification, setNotification] = useState<string | null>(null);

  // Saved Workouts state
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<SavedWorkout | null>(null);
  const [isCreatingNewWorkout, setIsCreatingNewWorkout] = useState(false);

  // Custom week plan editor state
  const [customPlanName, setCustomPlanName] = useState<string>("Mein individueller Trainingsplan");
  const [customDays, setCustomDays] = useState(
    currentWeek.days.map((d) => ({
      id: d.id,
      name: d.name,
      focusTitle: d.focusTitle || "Noch kein Training festgelegt",
      gymRows: [...(d.gymRows || [])],
    }))
  );
  const [editingDayId, setEditingDayId] = useState<string>(activeDayId);

  // Load saved workouts from localStorage on open
  useEffect(() => {
    if (isOpen) {
      setSavedWorkouts(getSavedWorkouts());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDay = currentWeek.days.find((d) => d.id === activeDayId) || currentWeek.days[0];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const activePreset = PRESET_PLANS.find((p) => p.id === selectedPresetId) || PRESET_PLANS[0];

  /**
   * Apply a single saved workout to a specific target day
   */
  const handleApplySavedWorkoutToDay = (targetDayId: string, workout: SavedWorkout) => {
    const targetDay = currentWeek.days.find((d) => d.id === targetDayId);
    const dayLabel = targetDay ? targetDay.name : targetDayId;

    if (onApplyWorkoutToDay) {
      onApplyWorkoutToDay(targetDayId, workout);
    } else {
      // Fallback: update week days directly
      const updatedDays: DayPlan[] = currentWeek.days.map((d) => {
        if (d.id !== targetDayId) return d;
        const newGymRows: GymTableRow[] = workout.exercises.map((ex, i) => ({
          id: `g_${targetDayId}_${i}_${Date.now()}`,
          name: ex.name,
          setsAndWeight: ex.setsAndWeight,
          notes: ex.notes || "",
        }));
        return {
          ...d,
          focusTitle: workout.focusTitle || workout.name,
          gymRows: newGymRows,
        };
      });
      onApplyPlanToWeek(updatedDays, currentWeek.name);
    }

    showToast(`✓ "${workout.name}" erfolgreich auf ${dayLabel} angewendet!`);
  };

  /**
   * Save the current day's training as a new reusable workout
   */
  const handleSaveCurrentDayAsWorkout = () => {
    const validRows = (currentDay.gymRows || []).filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      alert(`Am ${currentDay.name} sind noch keine Übungen eingetragen. Trage zuerst Übungen ein oder wähle eine Vorlage.`);
      return;
    }

    const newWorkout: SavedWorkout = {
      id: `sw_custom_${Date.now()}`,
      name: currentDay.focusTitle.replace(" (TRAINING 1)", "").replace(" (TRAINING 2)", "") || `${currentDay.name} Workout`,
      focusTitle: currentDay.focusTitle || `${currentDay.name} Workout`,
      badge: "CUSTOM",
      exercises: validRows.map((r, i) => ({
        id: `sw_ex_${i}_${Date.now()}`,
        name: r.name,
        setsAndWeight: r.setsAndWeight || "3x8",
        notes: r.notes || "",
      })),
      createdAt: new Date().toLocaleDateString("de-DE"),
    };

    const updated = [newWorkout, ...savedWorkouts];
    setSavedWorkouts(updated);
    saveWorkoutsToStorage(updated);
    showToast(`✓ Training "${newWorkout.name}" erfolgreich gespeichert! Du kannst es jetzt auf jeden beliebigen Tag anwenden.`);
  };

  /**
   * Create or update a custom saved workout
   */
  const handleSaveWorkoutEditor = (workout: SavedWorkout) => {
    let updated: SavedWorkout[];
    const exists = savedWorkouts.some((w) => w.id === workout.id);
    if (exists) {
      updated = savedWorkouts.map((w) => (w.id === workout.id ? workout : w));
    } else {
      updated = [workout, ...savedWorkouts];
    }
    setSavedWorkouts(updated);
    saveWorkoutsToStorage(updated);
    setEditingWorkout(null);
    setIsCreatingNewWorkout(false);
    showToast(`✓ Workout "${workout.name}" erfolgreich gespeichert!`);
  };

  /**
   * Delete a saved workout
   */
  const handleDeleteSavedWorkout = (id: string, name: string) => {
    if (window.confirm(`Möchtest du das gespeicherte Training "${name}" wirklich löschen?`)) {
      const updated = savedWorkouts.filter((w) => w.id !== id);
      setSavedWorkouts(updated);
      saveWorkoutsToStorage(updated);
      showToast(`Training "${name}" gelöscht.`);
    }
  };

  /**
   * Apply selected Preset Plan to current week
   */
  const handleApplyPreset = (preset: SplitPreset) => {
    const updatedDays: DayPlan[] = currentWeek.days.map((existingDay) => {
      const presetDay = preset.days.find((pd) => pd.dayId === existingDay.id);
      if (!presetDay) return existingDay;

      const newGymRows: GymTableRow[] = presetDay.exercises.map((ex, i) => ({
        id: `g_${existingDay.id}_${i}_${Date.now()}`,
        name: ex.name,
        setsAndWeight: ex.setsAndWeight,
        notes: ex.notes || "",
      }));

      return {
        ...existingDay,
        focusTitle: presetDay.focusTitle,
        gymRows: newGymRows,
      };
    });

    onApplyPlanToWeek(updatedDays, preset.name);
    showToast(`✓ Trainingsplan "${preset.name}" erfolgreich auf ${currentWeek.name} angewendet!`);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  /**
   * Apply Custom Plan to current week
   */
  const handleApplyCustomPlan = () => {
    const updatedDays: DayPlan[] = currentWeek.days.map((existingDay) => {
      const customDay = customDays.find((cd) => cd.id === existingDay.id);
      if (!customDay) return existingDay;

      return {
        ...existingDay,
        focusTitle: customDay.focusTitle,
        gymRows: customDay.gymRows,
      };
    });

    onApplyPlanToWeek(updatedDays, customPlanName);
    showToast(`✓ Eigener Plan "${customPlanName}" erfolgreich auf ${currentWeek.name} angewendet!`);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-[#151518] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 relative"
        role="dialog"
      >
        {/* Toast */}
        {notification && (
          <div className="absolute top-4 right-4 z-50 bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#1a1a1f] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-400">
                  Trainingsplan-Manager
                </span>
                <span className="text-zinc-500 text-xs">•</span>
                <span className="text-xs font-bold text-white uppercase">{currentWeek.name}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
                TRAININGS SPEICHERN, VERWALTEN & ÖFTER ANWENDEN
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#161619] px-4 sm:px-6">
          <button
            onClick={() => setActiveTab("saved")}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "saved"
                ? "border-purple-400 text-purple-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Gespeicherte Trainings ({savedWorkouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "presets"
                ? "border-purple-400 text-purple-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ganze Splits (PPL, OK/UK, TT)</span>
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={`py-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "custom"
                ? "border-purple-400 text-purple-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Neuen Wochenplan bauen</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: GESPEICHERTE TRAININGS (WORKOUT-LIBRARY) */}
          {activeTab === "saved" && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                <div>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Trainings speichern und beliebig oft auf Tage anwenden</span>
                  </span>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Wähle ein Training und klicke auf einen Wochentag (z.B. MO, MI, FR), um es sofort dorthin zu übertragen!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCurrentDayAsWorkout}
                    title={`Speichert das aktuelle Training von ${currentDay.name} als neue Vorlage`}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
                  >
                    <Save className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentDay.name} als Vorlage speichern</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingWorkout({
                        id: `sw_custom_${Date.now()}`,
                        name: "Neues Workout",
                        focusTitle: "NEUES WORKOUT",
                        badge: "CUSTOM",
                        exercises: [
                          { id: `ex_1`, name: "Übung 1", setsAndWeight: "3x8", notes: "" },
                        ],
                      });
                      setIsCreatingNewWorkout(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Neues Workout erstellen</span>
                  </button>
                </div>
              </div>

              {/* Workout Editor Modal / Form if editing */}
              {(editingWorkout || isCreatingNewWorkout) && editingWorkout && (
                <div className="p-4 rounded-xl bg-[#1c1c22] border border-purple-500/30 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-black text-sm text-white">
                      {isCreatingNewWorkout ? "Neues Training anlegen" : `Training bearbeiten: ${editingWorkout.name}`}
                    </span>
                    <button
                      onClick={() => {
                        setEditingWorkout(null);
                        setIsCreatingNewWorkout(false);
                      }}
                      className="text-zinc-400 hover:text-white text-xs font-bold"
                    >
                      ✕ Abbrechen
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">Workout-Name:</label>
                      <input
                        type="text"
                        value={editingWorkout.name}
                        onChange={(e) => setEditingWorkout({ ...editingWorkout, name: e.target.value })}
                        placeholder="z.B. Brust & Trizeps Hypertrophie"
                        className="w-full bg-[#111113] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">Fokus-Titel:</label>
                      <input
                        type="text"
                        value={editingWorkout.focusTitle}
                        onChange={(e) => setEditingWorkout({ ...editingWorkout, focusTitle: e.target.value })}
                        placeholder="z.B. BRUST / TRIZEPS"
                        className="w-full bg-[#111113] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  {/* Exercises List in Editor */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                      <span>Übungen ({editingWorkout.exercises.length}):</span>
                      <button
                        onClick={() =>
                          setEditingWorkout({
                            ...editingWorkout,
                            exercises: [
                              ...editingWorkout.exercises,
                              { id: `ex_${Date.now()}`, name: "", setsAndWeight: "3x8", notes: "" },
                            ],
                          })
                        }
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Übung hinzufügen</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {editingWorkout.exercises.map((ex, exIdx) => (
                        <div key={ex.id || exIdx} className="flex items-center gap-2 p-1.5 bg-[#121215] rounded border border-white/5 text-xs">
                          <span className="w-4 text-center text-zinc-500 font-mono text-[11px]">{exIdx + 1}</span>
                          <input
                            type="text"
                            value={ex.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingWorkout({
                                ...editingWorkout,
                                exercises: editingWorkout.exercises.map((x, i) => (i === exIdx ? { ...x, name: val } : x)),
                              });
                            }}
                            placeholder="Übungsname (z.B. Bankdrücken)"
                            className="flex-1 bg-transparent border-none text-white focus:outline-none text-xs"
                          />
                          <input
                            type="text"
                            value={ex.setsAndWeight}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingWorkout({
                                ...editingWorkout,
                                exercises: editingWorkout.exercises.map((x, i) => (i === exIdx ? { ...x, setsAndWeight: val } : x)),
                              });
                            }}
                            placeholder="Sätze & Wdh. (z.B. 70x8, 70x8)"
                            className="w-36 bg-transparent border-none text-cyan-300 font-mono text-xs focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              setEditingWorkout({
                                ...editingWorkout,
                                exercises: editingWorkout.exercises.filter((_, i) => i !== exIdx),
                              })
                            }
                            className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        setEditingWorkout(null);
                        setIsCreatingNewWorkout(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-bold cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleSaveWorkoutEditor(editingWorkout)}
                      className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-black font-extrabold text-xs cursor-pointer shadow"
                    >
                      Workout speichern
                    </button>
                  </div>
                </div>
              )}

              {/* List of Saved Workouts */}
              <div className="space-y-3">
                {savedWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                          <Dumbbell className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-white">{workout.name}</h4>
                            {workout.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                                {workout.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {workout.exercises.length} Übungen
                          </span>
                        </div>
                      </div>

                      {/* Edit & Delete actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingWorkout(workout);
                            setIsCreatingNewWorkout(false);
                          }}
                          title="Workout bearbeiten"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSavedWorkout(workout.id, workout.name)}
                          title="Workout löschen"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Exercise pills preview */}
                    <div className="text-[11px] text-zinc-400 font-mono bg-black/30 p-2.5 rounded-lg border border-white/5 flex flex-wrap gap-1.5">
                      {workout.exercises.map((e, idx) => (
                        <span key={idx} className="bg-white/5 px-2 py-0.5 rounded text-zinc-300">
                          {e.name} <strong className="text-cyan-300">({e.setsAndWeight})</strong>
                        </span>
                      ))}
                    </div>

                    {/* Quick Apply to Day Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                      <span className="text-zinc-500 font-bold uppercase text-[10px]">
                        Diesen Trainingsplan anwenden auf:
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          onClick={() => handleApplySavedWorkoutToDay(currentDay.id, workout)}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-[11px] border border-purple-500/30 cursor-pointer"
                        >
                          Aktueller Tag ({currentDay.name.slice(0, 2)})
                        </button>
                        {currentWeek.days.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => handleApplySavedWorkoutToDay(d.id, workout)}
                            title={`Auf ${d.name} anwenden`}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white font-bold text-[11px] border border-white/5 cursor-pointer"
                          >
                            {d.name.slice(0, 2).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GANZE SPLITS (PRESETS) */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRESET_PLANS.map((preset) => {
                  const isSelected = preset.id === selectedPresetId;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-400/40 shadow-md`
                          : "bg-white/5 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-white">
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <span className="text-purple-400 text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Ausgewählt
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-white mb-1.5">{preset.name}</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                          {preset.shortDesc}
                        </p>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 pt-2 border-t border-white/5">
                        {preset.days.filter((d) => d.exercises.length > 0).length} Trainingstage / Woche
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Preview of Selected Preset */}
              <div className="border border-white/10 rounded-xl overflow-hidden bg-[#18181c]">
                <div className="p-3.5 px-4 bg-[#1e1e24] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                      Vorschau & Konfiguration
                    </span>
                    <h3 className="text-sm font-black text-white">{activePreset.name}</h3>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(activePreset)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-95 text-black font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Diesen Plan auf {currentWeek.name} anwenden</span>
                  </button>
                </div>

                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {activePreset.days.map((day) => (
                    <div key={day.dayId} className="p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02]">
                      <div className="sm:w-1/3">
                        <span className="text-xs font-black text-white">{day.dayName}: </span>
                        <span className="text-xs font-bold text-cyan-300">{day.focusTitle}</span>
                      </div>
                      <div className="sm:w-2/3 text-[11px] text-zinc-400 font-mono">
                        {day.exercises.length > 0 ? (
                          day.exercises.map((e) => `${e.name} (${e.setsAndWeight})`).join(" • ")
                        ) : (
                          <span className="text-zinc-600 font-sans italic">Keine Gym-Übungen (Restday / Cardio)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM PLAN EDITOR */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              {/* Plan Name & Apply Bar */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">Plan Name:</span>
                  <input
                    type="text"
                    value={customPlanName}
                    onChange={(e) => setCustomPlanName(e.target.value)}
                    placeholder="z.B. Mein 4er-Split Aufbau"
                    className="w-full bg-[#111113] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>

                <button
                  onClick={handleApplyCustomPlan}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Eigenen Plan auf {currentWeek.name} anwenden</span>
                </button>
              </div>

              {/* Day Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {customDays.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setEditingDayId(d.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center border ${
                      editingDayId === d.id
                        ? "bg-purple-500 text-black border-purple-400 shadow font-black"
                        : "bg-white/5 text-zinc-300 hover:text-white border-white/5"
                    }`}
                  >
                    <span>{d.name.slice(0, 2).toUpperCase()}</span>
                    <span className="text-[10px] opacity-80">{d.gymRows.length} Üb.</span>
                  </button>
                ))}
              </div>

              {/* Active Day Detail Editor */}
              <div className="border border-white/10 rounded-xl overflow-hidden bg-[#18181c] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {customDays.find((d) => d.id === editingDayId)?.name}:
                    </span>
                    <input
                      type="text"
                      value={customDays.find((d) => d.id === editingDayId)?.focusTitle || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomDays((prev) =>
                          prev.map((d) => (d.id === editingDayId ? { ...d, focusTitle: val } : d))
                        );
                      }}
                      placeholder="Fokus / Workout-Name (z.B. Brust / Rücken)"
                      className="bg-[#111113] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-bold focus:outline-none focus:ring-1 focus:ring-purple-400 w-64"
                    />
                  </div>

                  <button
                    onClick={() =>
                      setCustomDays((prev) =>
                        prev.map((d) => {
                          if (d.id !== editingDayId) return d;
                          return {
                            ...d,
                            gymRows: [
                              ...d.gymRows,
                              {
                                id: `custom_ex_${Date.now()}`,
                                name: "Neue Übung",
                                setsAndWeight: "50x8, 50x8, 50x8",
                                notes: "2 min Pause",
                              },
                            ],
                          };
                        })
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Übung hinzufügen</span>
                  </button>
                </div>

                {/* Exercises Table */}
                {(customDays.find((d) => d.id === editingDayId)?.gymRows || []).length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    Für diesen Tag sind noch keine Übungen eingetragen. Klicke auf <strong>+ Übung hinzufügen</strong>, um Übungen festzulegen.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(customDays.find((d) => d.id === editingDayId)?.gymRows || []).map((row, idx) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
                      >
                        <span className="w-5 text-center text-zinc-500 font-mono">{idx + 1}</span>
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomDays((prev) =>
                              prev.map((d) =>
                                d.id === editingDayId
                                  ? {
                                      ...d,
                                      gymRows: d.gymRows.map((r) => (r.id === row.id ? { ...r, name: val } : r)),
                                    }
                                  : d
                              )
                            );
                          }}
                          placeholder="Übungsname (z.B. Incline Bench)"
                          className="flex-1 min-w-[160px] bg-[#111113] border border-white/10 rounded px-2 py-1 text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                        <input
                          type="text"
                          value={row.setsAndWeight}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomDays((prev) =>
                              prev.map((d) =>
                                d.id === editingDayId
                                  ? {
                                      ...d,
                                      gymRows: d.gymRows.map((r) => (r.id === row.id ? { ...r, setsAndWeight: val } : r)),
                                    }
                                  : d
                              )
                            );
                          }}
                          placeholder="Sätze & Gewicht (z.B. 70x8, 70x8)"
                          className="w-44 bg-[#111113] border border-white/10 rounded px-2 py-1 text-cyan-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
                        <button
                          onClick={() => {
                            setCustomDays((prev) =>
                              prev.map((d) =>
                                d.id === editingDayId
                                  ? { ...d, gymRows: d.gymRows.filter((r) => r.id !== row.id) }
                                  : d
                              )
                            );
                          }}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-[#111114] border-t border-white/10 flex items-center justify-between text-xs text-zinc-500">
          <span>Gespeicherte Trainings bleiben dauerhaft auf deinem Gerät und in der Cloud gesichert.</span>
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
