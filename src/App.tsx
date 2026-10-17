import React, { useState, useEffect, useRef } from "react";
import { WeekPlan, DayPlan, parseGermanOrEnglishNumber, SavedWorkout, GymTableRow } from "./types";
import { 
  getInitialWeek, 
  createNewWeekPlan, 
  normalizeWeekPlan, 
  getTodayDayId, 
  getCurrentWeekDates,
  sanitizeForFirestore,
  getBrustRueckenGymRows,
  getArmeSchulternGymRows,
  getRestdayGymRows,
  getRestdayCardioRows,
  getTrainingDayCardioRows
} from "./initialData";
import GymExcelTable from "./components/GymExcelTable";
import CardioExcelTable from "./components/CardioExcelTable";
import NutritionExcelTable from "./components/NutritionExcelTable";
import WeightExcelTable from "./components/WeightExcelTable";
import { SettingsModal, WorkoutPresetType } from "./components/SettingsModal";
import { WeekHubModal } from "./components/WeekHubModal";
import { WorkoutPlanManagerModal } from "./components/WorkoutPlanManagerModal";
import { 
  Cloud, 
  Loader2, 
  Plus, 
  CheckCircle2, 
  Table,
  Dumbbell,
  Activity,
  Utensils,
  Scale,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  ChevronDown
} from "lucide-react";
import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

export default function App() {
  const todayDayId = getTodayDayId();
  const weekDates = getCurrentWeekDates();

  const [weeks, setWeeks] = useState<WeekPlan[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("woche_1");
  const [activeDayId, setActiveDayId] = useState<string>(todayDayId);
  const [activeTab, setActiveTab] = useState<"gym" | "cardio" | "nutrition" | "weight" | "all">("gym");
  
  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<"loading" | "saved" | "saving" | "local" | "error">("loading");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string>("");
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showWeekHubModal, setShowWeekHubModal] = useState<boolean>(false);
  const [showPlanManagerModal, setShowPlanManagerModal] = useState<boolean>(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load from LocalStorage & Firestore
  useEffect(() => {
    async function initData() {
      setSyncStatus("loading");
      let localDataLoaded = false;

      // Check LocalStorage v5 for instant 0ms render
      const cached = localStorage.getItem("fittracker_excel_plans_v5");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = parsed.map((w: any) => normalizeWeekPlan(w));
            setWeeks(normalized);
            setSelectedWeekId(normalized[0].id);
            setActiveDayId(todayDayId);
            localDataLoaded = true;
          }
        } catch (e) {
          console.warn("Local storage parse error:", e);
        }
      }

      if (!localDataLoaded) {
        const defaultWeek = getInitialWeek();
        setWeeks([defaultWeek]);
        setSelectedWeekId(defaultWeek.id);
        setActiveDayId(todayDayId);
        localStorage.setItem("fittracker_excel_plans_v5", JSON.stringify([defaultWeek]));
      }

      // Connect to Firestore
      try {
        const querySnapshot = await getDocs(collection(db, "weeks"));
        const cloudWeeks: WeekPlan[] = [];
        querySnapshot.forEach((d) => {
          const raw = d.data();
          if (raw && (raw.days || raw.id)) {
            cloudWeeks.push(normalizeWeekPlan({ ...raw, id: raw.id || d.id }));
          }
        });

        if (cloudWeeks.length > 0) {
          cloudWeeks.sort((a, b) => {
            const numA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
            const numB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
            return numA - numB;
          });
          setWeeks(cloudWeeks);
          setSelectedWeekId(cloudWeeks[0].id);
          setActiveDayId(todayDayId);
          localStorage.setItem("fittracker_excel_plans_v5", JSON.stringify(cloudWeeks));
          
          // Write normalized data back so Firestore is up-to-date
          await setDoc(doc(db, "weeks", cloudWeeks[0].id), sanitizeForFirestore(cloudWeeks[0]));
          setSyncStatus("saved");
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } else {
          // Push initial data to cloud
          const defaultWeek = getInitialWeek();
          await setDoc(doc(db, "weeks", defaultWeek.id), sanitizeForFirestore(defaultWeek));
          setWeeks([defaultWeek]);
          setSelectedWeekId(defaultWeek.id);
          setActiveDayId(todayDayId);
          localStorage.setItem("fittracker_excel_plans_v5", JSON.stringify([defaultWeek]));
          setSyncStatus("saved");
          setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        }
      } catch (err: any) {
        console.warn("Firestore sync notice:", err);
        setSyncStatus("error");
        setSyncErrorMessage(err?.message || "Cloud offline oder Firestore Berechtigungen erforderlich.");
      }
    }

    initData();
  }, []);

  // Save to LocalStorage whenever weeks change
  useEffect(() => {
    if (weeks.length > 0) {
      localStorage.setItem("fittracker_excel_plans_v5", JSON.stringify(weeks));
    }
  }, [weeks]);

  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || weeks[0] || getInitialWeek();
  const currentDay = currentWeek?.days.find((d) => d.id === activeDayId) || currentWeek?.days[0];

  // Save changes to Firestore with debounce and sanitized payload
  const triggerCloudSave = (updatedWeek: WeekPlan) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setSyncStatus("saving");

    saveTimerRef.current = setTimeout(async () => {
      try {
        const sanitized = sanitizeForFirestore(updatedWeek);
        await setDoc(doc(db, "weeks", updatedWeek.id), sanitized);
        setSyncStatus("saved");
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setSyncErrorMessage("");
      } catch (err: any) {
        console.warn("Cloud save error:", err);
        setSyncStatus("error");
        setSyncErrorMessage(err?.message || "Konnte nicht in Firestore schreiben.");
      }
    }, 700);
  };

  // Handler for Day Updates from child excel tables
  const handleUpdateDay = (updatedDay: DayPlan) => {
    const updatedDays = currentWeek.days.map((d) => (d.id === updatedDay.id ? updatedDay : d));
    const updatedWeek: WeekPlan = {
      ...currentWeek,
      days: updatedDays,
    };

    setWeeks((prev) => prev.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
    triggerCloudSave(updatedWeek);
  };

  // Handler for Week Updates (Weight tracker rows)
  const handleUpdateWeek = (updatedWeek: WeekPlan) => {
    setWeeks((prev) => prev.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
    triggerCloudSave(updatedWeek);
  };

  // Add new Week (Duplicates current structure for new week)
  const handleAddWeek = () => {
    const nextNum = weeks.length + 1;
    const newWeek = createNewWeekPlan(nextNum, currentWeek);
    const updatedWeeks = [...weeks, newWeek];
    setWeeks(updatedWeeks);
    setSelectedWeekId(newWeek.id);
    setActiveDayId(todayDayId);
    triggerCloudSave(newWeek);
  };

  // Edit current week phase
  const handleUpdatePhase = (phaseVal: string) => {
    const updated: WeekPlan = { ...currentWeek, phase: phaseVal };
    setWeeks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    triggerCloudSave(updated);
  };

  // Rename a week
  const handleRenameWeek = (weekId: string, newName: string) => {
    const updatedWeeks = weeks.map((w) => (w.id === weekId ? { ...w, name: newName } : w));
    setWeeks(updatedWeeks);
    const target = updatedWeeks.find((w) => w.id === weekId);
    if (target) {
      triggerCloudSave(target);
    }
  };

  // Delete a week
  const handleDeleteWeek = async (weekId: string) => {
    if (weeks.length <= 1) return;
    const remainingWeeks = weeks.filter((w) => w.id !== weekId);
    setWeeks(remainingWeeks);

    if (selectedWeekId === weekId) {
      setSelectedWeekId(remainingWeeks[0].id);
      setActiveDayId(todayDayId);
    }

    localStorage.setItem("fittracker_excel_plans_v5", JSON.stringify(remainingWeeks));

    try {
      await deleteDoc(doc(db, "weeks", weekId));
    } catch (e) {
      console.warn("Error deleting week from Firestore:", e);
    }
  };

  // Apply a newly created or preset workout plan to the current week
  const handleApplyPlanToWeek = (newDays: DayPlan[], planName: string) => {
    if (!currentWeek) return;
    const updatedWeek: WeekPlan = {
      ...currentWeek,
      days: newDays,
    };
    setWeeks((prev) => prev.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
    triggerCloudSave(updatedWeek);
  };

  // Apply a single saved workout routine to a specific day
  const handleApplyWorkoutToDay = (dayId: string, workout: SavedWorkout) => {
    if (!currentWeek) return;
    const updatedDays = currentWeek.days.map((d) => {
      if (d.id !== dayId) return d;
      const newGymRows: GymTableRow[] = workout.exercises.map((ex, i) => ({
        id: `g_${dayId}_${i}_${Date.now()}`,
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
    const updatedWeek: WeekPlan = {
      ...currentWeek,
      days: updatedDays,
    };
    setWeeks((prev) => prev.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
    triggerCloudSave(updatedWeek);
  };

  // Manual trigger to re-save immediately
  const handleManualSync = async () => {
    setSyncStatus("saving");
    try {
      const sanitized = sanitizeForFirestore(currentWeek);
      await setDoc(doc(db, "weeks", currentWeek.id), sanitized);
      setSyncStatus("saved");
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSyncErrorMessage("");
    } catch (err: any) {
      setSyncStatus("error");
      setSyncErrorMessage(err?.message || "Fehler beim Cloud-Speichern.");
    }
  };

  // Reset to default
  const handleReset = () => {
    if (window.confirm("Möchtest du den gesamten Plan auf den Standard-Trainings- & Ernährungsplan zurücksetzen?")) {
      const initial = getInitialWeek();
      setWeeks([initial]);
      setSelectedWeekId(initial.id);
      setActiveDayId(todayDayId);
      localStorage.setItem("fittracker_excel_plans_v5", JSON.stringify([initial]));
      triggerCloudSave(initial);
    }
  };

  // Settings Handler: Update which training happens on which day
  const handleUpdateDayTraining = (dayId: string, preset: WorkoutPresetType, customTitle?: string) => {
    const updatedDays = currentWeek.days.map((d) => {
      if (d.id !== dayId) return d;

      if (preset === "offen") {
        return {
          ...d,
          focusTitle: "NOCH KEIN TRAINING FESTGELEGT",
          gymRows: [
            { id: `g_open_${d.id}`, name: "", setsAndWeight: "", notes: "Noch kein Training festgelegt" }
          ],
          cardioRows: [
            { id: `c_open_${d.id}`, activity: "", duration: "", intensity: "", steps: "", calories: "", notes: "" }
          ],
        };
      }
      if (preset === "brust_ruecken") {
        return {
          ...d,
          focusTitle: "BRUST / RÜCKEN (TRAINING 1)",
          gymRows: getBrustRueckenGymRows(),
          cardioRows: getTrainingDayCardioRows(),
        };
      }
      if (preset === "arme_schultern") {
        return {
          ...d,
          focusTitle: "ARME / SCHULTERN (TRAINING 2)",
          gymRows: getArmeSchulternGymRows(),
          cardioRows: getTrainingDayCardioRows(),
        };
      }
      if (preset === "rest_run") {
        return {
          ...d,
          focusTitle: "RESTDAY (LAUFEN & ERHOLUNG)",
          gymRows: getRestdayGymRows(),
          cardioRows: getRestdayCardioRows(),
        };
      }
      if (preset === "krank_pause") {
        return {
          ...d,
          focusTitle: "KRANK / SCHONUNG (PAUSE)",
          gymRows: [
            { id: `g_sick_${d.id}`, name: "Krankheit / Pause / Erholung", setsAndWeight: "Pause", notes: "Volle Regeneration, viel trinken & schlafen" }
          ],
          cardioRows: [
            { id: `c_sick_${d.id}`, activity: "Schonung / Bettruhe", duration: "Ganztägig", intensity: "Keine Belastung", steps: "Nach Befinden", calories: "0 kcal", notes: "Gute Besserung!" }
          ],
        };
      }
      if (customTitle) {
        return { ...d, focusTitle: customTitle };
      }
      return d;
    });

    const updatedWeek = { ...currentWeek, days: updatedDays };
    setWeeks((prev) => prev.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
    triggerCloudSave(updatedWeek);
  };

  // Settings Handler: Clear all trainings for the current week to "offen"
  const handleClearWeekTrainings = () => {
    const updatedDays = currentWeek.days.map((d) => ({
      ...d,
      focusTitle: "NOCH KEIN TRAINING FESTGELEGT",
      gymRows: [
        { id: `g_open_${d.id}`, name: "", setsAndWeight: "", notes: "Noch kein Training festgelegt" }
      ],
      cardioRows: [
        { id: `c_open_${d.id}`, activity: "", duration: "", intensity: "", steps: "", calories: "", notes: "" }
      ],
    }));

    const updatedWeek = { ...currentWeek, days: updatedDays };
    setWeeks((prev) => prev.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
    triggerCloudSave(updatedWeek);
  };

  // Settings Handler: Apply Training-Training-Rest-Repeat pattern across current week
  const handleApplyTTRepeatPattern = () => {
    const patterns: { preset: WorkoutPresetType }[] = [
      { preset: "brust_ruecken" }, // MO
      { preset: "arme_schultern" }, // DI
      { preset: "rest_run" },      // MI
      { preset: "brust_ruecken" }, // DO
      { preset: "arme_schultern" }, // FR
      { preset: "rest_run" },      // SA
      { preset: "brust_ruecken" }, // SO
    ];

    const updatedDays = currentWeek.days.map((d, idx) => {
      const pattern = patterns[idx % 7];
      if (pattern.preset === "brust_ruecken") {
        return {
          ...d,
          focusTitle: "BRUST / RÜCKEN (TRAINING 1)",
          gymRows: getBrustRueckenGymRows(),
          cardioRows: getTrainingDayCardioRows(),
        };
      }
      if (pattern.preset === "arme_schultern") {
        return {
          ...d,
          focusTitle: "ARME / SCHULTERN (TRAINING 2)",
          gymRows: getArmeSchulternGymRows(),
          cardioRows: getTrainingDayCardioRows(),
        };
      }
      return {
        ...d,
        focusTitle: "RESTDAY (LAUFEN & ERHOLUNG)",
        gymRows: getRestdayGymRows(),
        cardioRows: getRestdayCardioRows(),
      };
    });

    const updatedWeek = { ...currentWeek, days: updatedDays };
    setWeeks((prev) => prev.map((w) => (w.id === updatedWeek.id ? updatedWeek : w)));
    triggerCloudSave(updatedWeek);
  };

  // Download backup JSON
  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(weeks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fittracker_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Compute weekly weight average for badge in tab (supports comma numbers)
  const validWeights = (currentWeek?.weightRows || [])
    .map((r) => parseGermanOrEnglishNumber(r.weight))
    .filter((w) => !isNaN(w) && w > 0);
  const weeklyAvgStr =
    validWeights.length > 0
      ? `${(validWeights.reduce((a, b) => a + b, 0) / validWeights.length).toFixed(1)} kg`
      : "";

  return (
    <div className="min-h-screen bg-[#111113] text-white flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* 1. Slim Clean Header with Logo, Week/Phase & Settings Button */}
      <header className="w-full px-4 sm:px-8 py-2.5 border-b border-white/10 bg-[#151518]/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-3">
          
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#107c41] via-[#00c8ff] to-[#a855f7] flex items-center justify-center font-bold text-white shadow-sm">
              <Table className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-black text-lg tracking-tight uppercase">
                FITTRACKER
              </span>
              <span className="text-[#00c8ff] font-black text-lg tracking-tight uppercase">
                SHEETS
              </span>
            </div>
          </div>

          {/* Center Info: Week & Current Context */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowWeekHubModal(true)}
              title="Wochen-Hub öffnen: Übersicht, Übungs-Steigerung & Gewichtsverlauf"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 font-bold text-cyan-300 transition-all cursor-pointer group"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>{currentWeek?.name || "Woche 1"}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-cyan-300" />
            </button>
            <span className="text-zinc-600">•</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold text-[11px]">
              Phase: {currentWeek?.phase || "AUFBAU"}
            </span>
            {currentDay?.id === todayDayId && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Heute: {currentDay?.name}
                </span>
              </>
            )}
          </div>

          {/* Right Header: Plan Manager & Settings Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlanManagerModal(true)}
              title="Neuen Trainingsplan erstellen oder Vorlage (PPL, OK/UK, TT-Repeat) wählen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm group"
            >
              <Dumbbell className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Neuer Trainingsplan</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              title="Einstellungen & Trainingstage (z.B. bei Krankheit oder Verschiebungen)"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer shadow-sm group"
            >
              <Settings className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 group-hover:rotate-45 transition-all duration-200" />
              <span>Einstellungen</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Compact Weekday Selector (MO, DI, MI, DO, FR, SA, SO) */}
      <div className="w-full bg-[#161619] border-b border-white/10 px-4 sm:px-8 py-2">
        <div className="max-w-[1720px] mx-auto">
          {/* Compact 7-Day Bar */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {currentWeek?.days.map((day) => {
              const isActive = day.id === activeDayId;
              const isToday = day.id === todayDayId;
              const dateStr = day.date || weekDates[day.id] || "";
              const isRest = day.focusTitle?.toUpperCase().includes("REST");
              const isKrank = day.focusTitle?.toUpperCase().includes("KRANK");
              const isOpen = day.focusTitle?.toUpperCase().includes("OFFEN") || day.focusTitle?.toUpperCase().includes("NOCH KEIN") || !day.focusTitle;

              // Short workout label
              let shortWorkout = day.focusTitle.replace(" (TRAINING 1)", "").replace(" (TRAINING 2)", "");
              if (isRest) shortWorkout = "Laufen";
              if (isKrank) shortWorkout = "Pause";
              if (isOpen) shortWorkout = "Offen";

              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  type="button"
                  title={`${day.name} - ${day.focusTitle}`}
                  className={`group relative py-2 px-1 sm:px-2 rounded-xl text-center transition-all duration-150 cursor-pointer border flex flex-col items-center justify-center ${
                    isActive
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-md font-bold ring-1 ring-cyan-300"
                      : "bg-[#1d1d23] hover:bg-[#26262e] text-zinc-300 hover:text-white border-white/5 hover:border-white/15"
                  }`}
                >
                  {/* Day Label & Today Dot */}
                  <div className="flex items-center gap-1 justify-center">
                    <span className={`text-sm sm:text-base font-black tracking-tight ${
                      isActive ? "text-black" : "text-white"
                    }`}>
                      {day.label}
                    </span>
                    {isToday && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-black" : "bg-cyan-400"}`} title="Heute" />
                    )}
                  </div>

                  {/* Date */}
                  <div className={`text-[10px] sm:text-[11px] font-mono leading-tight ${
                    isActive ? "text-black/80 font-bold" : "text-zinc-400"
                  }`}>
                    {dateStr}
                  </div>

                  {/* Tiny workout focus */}
                  <div className={`text-[9px] sm:text-[10px] font-semibold truncate max-w-full mt-0.5 px-1 rounded ${
                    isActive
                      ? "text-black/90 font-bold bg-black/10"
                      : isRest
                        ? "text-amber-400"
                        : isKrank
                          ? "text-rose-400"
                          : isOpen
                            ? "text-zinc-500"
                            : "text-zinc-400 group-hover:text-cyan-300"
                  }`}>
                    {shortWorkout}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* 3. Excel Spreadsheet Tab Navigation (4 Tabs) */}
      <div className="w-full bg-[#131316] border-b border-white/5 px-4 sm:px-8 py-2">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between flex-wrap gap-2">
          
          {/* 4 Main Table Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Tab 1: Gym */}
            <button
              onClick={() => setActiveTab("gym")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "gym"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "bg-[#1c1c20] hover:bg-[#25252c] text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <span>Tabelle 1: Gym-Training</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-white/10 text-zinc-300 font-mono">
                {currentDay?.gymRows?.length || 0}
              </span>
            </button>

            {/* Tab 2: Cardio */}
            <button
              onClick={() => setActiveTab("cardio")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "cardio"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "bg-[#1c1c20] hover:bg-[#25252c] text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Tabelle 2: Cardio & Laufen</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-white/10 text-zinc-300 font-mono">
                {currentDay?.cardioRows?.length || 0}
              </span>
            </button>

            {/* Tab 3: Nutrition */}
            <button
              onClick={() => setActiveTab("nutrition")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "nutrition"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "bg-[#1c1c20] hover:bg-[#25252c] text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Utensils className="w-4 h-4 text-emerald-400" />
              <span>Tabelle 3: Ernährungsplan</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-white/10 text-zinc-300 font-mono">
                {currentDay?.nutritionRows?.length || 0}
              </span>
            </button>

            {/* Tab 4: Weight Tracker */}
            <button
              onClick={() => setActiveTab("weight")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "weight"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "bg-[#1c1c20] hover:bg-[#25252c] text-zinc-400 hover:text-zinc-200 border border-white/5"
              }`}
            >
              <Scale className="w-4 h-4 text-purple-400" />
              <span>Tabelle 4: Gewichtstrack</span>
              {weeklyAvgStr ? (
                <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-purple-500/30 text-purple-200 font-mono font-bold">
                  Ø {weeklyAvgStr}
                </span>
              ) : (
                <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-white/10 text-zinc-300 font-mono">
                  {currentWeek?.weightRows?.length || 0}
                </span>
              )}
            </button>
          </div>

          {/* Toggle: View all 4 tables */}
          <div className="flex items-center">
            <button
              onClick={() => setActiveTab(activeTab === "all" ? "gym" : "all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border-white/30"
                  : "bg-[#1c1c20] hover:bg-[#25252c] text-zinc-400 hover:text-white border-white/5"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Alle Tabellen anzeigen</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Tables Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentDay && (
          <>
            {/* View Mode: SINGLE TAB (Full Focus Excel View) */}
            {activeTab === "gym" && (
              <div className="w-full">
                <GymExcelTable 
                  currentDay={currentDay} 
                  onUpdateDay={handleUpdateDay}
                  onSwitchTab={(tab) => setActiveTab(tab)}
                  onApplyPreset={handleUpdateDayTraining}
                  onOpenSettings={() => setShowSettingsModal(true)}
                  onOpenPlanManager={() => setShowPlanManagerModal(true)}
                />
              </div>
            )}

            {activeTab === "cardio" && (
              <div className="w-full">
                <CardioExcelTable currentDay={currentDay} onUpdateDay={handleUpdateDay} />
              </div>
            )}

            {activeTab === "nutrition" && (
              <div className="w-full">
                <NutritionExcelTable currentDay={currentDay} onUpdateDay={handleUpdateDay} />
              </div>
            )}

            {activeTab === "weight" && (
              <div className="w-full">
                <WeightExcelTable currentWeek={currentWeek} onUpdateWeek={handleUpdateWeek} />
              </div>
            )}

            {/* View Mode: ALL TABLES (Full Overview) */}
            {activeTab === "all" && (
              <div className="flex flex-col gap-8">
                <GymExcelTable 
                  currentDay={currentDay} 
                  onUpdateDay={handleUpdateDay}
                  onSwitchTab={(tab) => setActiveTab(tab)}
                  onApplyPreset={handleUpdateDayTraining}
                  onOpenSettings={() => setShowSettingsModal(true)}
                  onOpenPlanManager={() => setShowPlanManagerModal(true)}
                />
                <WeightExcelTable currentWeek={currentWeek} onUpdateWeek={handleUpdateWeek} />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <CardioExcelTable currentDay={currentDay} onUpdateDay={handleUpdateDay} />
                  <NutritionExcelTable currentDay={currentDay} onUpdateDay={handleUpdateDay} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 5. Bottom Bar: Wochenauswahl, Phase & Cloud-Sicherung NACH UNTEN VERLEGT */}
      <footer className="w-full bg-[#141417] border-t border-white/10 px-4 sm:px-8 py-3 mt-auto shadow-2xl">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          {/* Left: Wochen-Menü Button (öffnet Übersicht mit Steigerungen & Gewichtsverlauf) & Phase */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Week Hub Trigger Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWeekHubModal(true)}
                title="Wochen-Menü öffnen: Übersicht aller Wochen, Übungs-Steigerungen & Gewichtsverlauf"
                className="flex items-center gap-2 bg-[#1d1d23] hover:bg-[#272730] border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-cyan-300 transition-all cursor-pointer shadow-sm group"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-zinc-500 text-[11px] font-bold uppercase">Woche:</span>
                <span className="text-white font-extrabold group-hover:text-cyan-300">
                  {currentWeek?.name || "Woche 1"}
                </span>
                <span className="text-purple-300 text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20">
                  {currentWeek?.phase || "AUFBAU"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={handleAddWeek}
                title="Neue Woche hinzufügen (z.B. Woche 2)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all cursor-pointer border border-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Neue Woche</span>
              </button>
            </div>

            {/* Phase Tag */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
              <span className="text-zinc-500 uppercase text-[10px]">Phase:</span>
              <input
                type="text"
                value={currentWeek?.phase || "AUFBAU"}
                onChange={(e) => handleUpdatePhase(e.target.value)}
                className="bg-transparent text-purple-300 font-bold focus:outline-none w-24 text-xs"
              />
            </div>
          </div>

          {/* Right: Cloud Status, Schnell-Sichern & Reset */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Cloud Status Badge Button */}
            <button
              onClick={() => setShowSyncModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                syncStatus === "saved"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                  : syncStatus === "saving"
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                  : syncStatus === "error"
                  ? "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                  : "bg-blue-500/10 text-blue-300 border-blue-500/30"
              }`}
            >
              {syncStatus === "saved" && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>In Cloud gesichert</span>
                  {lastSyncTime && <span className="text-[10px] text-zinc-400 font-mono">({lastSyncTime})</span>}
                </>
              )}
              {syncStatus === "saving" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Speichert...</span>
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cloud prüfen</span>
                </>
              )}
              {syncStatus === "loading" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Wird geladen...</span>
                </>
              )}
            </button>

            {/* Quick Sync Button */}
            <button
              onClick={handleManualSync}
              title="Jetzt manuell in Cloud sichern"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Jetzt sichern</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              title="Auf Standard-Plan zurücksetzen"
              className="flex items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Modal (Zahnrad für Tage & Trainingszuweisung) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        days={currentWeek?.days || []}
        activeDayId={activeDayId}
        onSelectDay={setActiveDayId}
        currentWeekName={currentWeek?.name || "Woche 1"}
        onUpdateDayTraining={handleUpdateDayTraining}
        onClearWeekTrainings={handleClearWeekTrainings}
        onResetEntirePlan={handleReset}
        onApplyTTRepeatPattern={handleApplyTTRepeatPattern}
        onOpenPlanManager={() => setShowPlanManagerModal(true)}
      />

      {/* Week Hub Modal (Übersicht der Wochen, Übungs-Steigerungen & Gewichtsverlauf) */}
      <WeekHubModal
        isOpen={showWeekHubModal}
        onClose={() => setShowWeekHubModal(false)}
        weeks={weeks}
        selectedWeekId={selectedWeekId}
        onSelectWeek={(wId) => {
          setSelectedWeekId(wId);
          setActiveDayId(todayDayId);
        }}
        onAddWeek={handleAddWeek}
        onRenameWeek={handleRenameWeek}
        onDeleteWeek={handleDeleteWeek}
        onUpdatePhase={handleUpdatePhase}
        onOpenPlanManager={() => setShowPlanManagerModal(true)}
      />

      {/* Workout Plan Manager & Creator Modal (PPL, OK/UK, TT-Repeat oder gespeicherte Workouts) */}
      {currentWeek && (
        <WorkoutPlanManagerModal
          isOpen={showPlanManagerModal}
          onClose={() => setShowPlanManagerModal(false)}
          currentWeek={currentWeek}
          activeDayId={activeDayId}
          onApplyPlanToWeek={handleApplyPlanToWeek}
          onApplyWorkoutToDay={handleApplyWorkoutToDay}
        />
      )}

      {/* Cloud Sync Status & Help Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181c] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-sm uppercase tracking-wide">Cloud-Synchronisation</h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white mb-0.5">Automatisches Speichern</div>
                  <div>Jede Änderung in den Tabellen wird in Echtzeit im Browser gespeichert und sicher mit Firebase Firestore synchronisiert.</div>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Firestore Projekt:</span>
                  <span className="text-zinc-200">gym-progression-79e69</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span className={
                    syncStatus === "saved" 
                      ? "text-emerald-400 font-bold" 
                      : syncStatus === "saving" 
                      ? "text-amber-400" 
                      : syncStatus === "error"
                      ? "text-rose-400 font-bold"
                      : "text-blue-400"
                  }>
                    {syncStatus === "saved" && "Verbunden & Gesichert ✓"}
                    {syncStatus === "saving" && "Wird gespeichert..."}
                    {syncStatus === "error" && "Fehler beim Sync"}
                    {syncStatus === "loading" && "Wird initialisiert..."}
                  </span>
                </div>
                {lastSyncTime && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Letzter Sync:</span>
                    <span className="text-zinc-300">{lastSyncTime}</span>
                  </div>
                )}
                {syncErrorMessage && (
                  <div className="pt-2 text-rose-400 text-[10px] break-all border-t border-white/10">
                    Meldung: {syncErrorMessage}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={async () => {
                    await handleManualSync();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:opacity-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Jetzt in Cloud sichern</span>
                </button>

                <button
                  onClick={handleDownloadBackup}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup als JSON herunterladen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
