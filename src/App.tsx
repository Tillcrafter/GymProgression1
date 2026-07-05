import React, { useState, useEffect } from "react";
import { WeekData } from "./types";
import { getInitialWeek } from "./initialData";
import Dashboard from "./components/Dashboard";
import DayFocusView from "./components/DayFocusView";
import AnalyticsView from "./components/AnalyticsView";
import DataManagement from "./components/DataManagement";
import NutritionView from "./components/NutritionView";
import { 
  Dumbbell, Timer, TrendingUp, Settings, 
  Calendar, Sun, Moon, Apple, Cloud, CloudOff, Loader2, AlertTriangle
} from "lucide-react";
import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("gym_progression_theme");
    return saved ? saved === "dark" : true; // Default to dark mode for rich aesthetics
  });

  // 1. Core weekly training state
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("woche_1");
  const [syncStatus, setSyncStatus] = useState<"loading" | "saved" | "saving" | "error">("loading");
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"nutrition" | "focus" | "analytics" | "data">("focus");
  const [activeDayId, setActiveDayId] = useState<string>("montag");

  // Load weeks from Firestore on mount
  useEffect(() => {
    async function loadWeeks() {
      try {
        setSyncStatus("loading");
        setSyncErrorMsg(null);
        const querySnapshot = await getDocs(collection(db, "weeks"));
        const loadedWeeks: WeekData[] = [];
        
        querySnapshot.forEach((doc) => {
          loadedWeeks.push(doc.data() as WeekData);
        });

        if (loadedWeeks.length > 0) {
          // Sort weeks numerically to maintain exact chronologic order
          loadedWeeks.sort((a, b) => {
            const numA = parseInt(a.id.replace(/\D/g, ""), 10) || 0;
            const numB = parseInt(b.id.replace(/\D/g, ""), 10) || 0;
            return numA - numB;
          });
          setWeeks(loadedWeeks);
          
          // Select week from local storage if valid, otherwise first week
          const savedSel = localStorage.getItem("gym_progression_selected_week");
          if (savedSel && loadedWeeks.some(w => w.id === savedSel)) {
            setSelectedWeekId(savedSel);
          } else {
            setSelectedWeekId(loadedWeeks[0].id);
          }
        } else {
          // Firestore collection is empty - initialize with default week
          const defaultWeek = getInitialWeek();
          await setDoc(doc(db, "weeks", defaultWeek.id), defaultWeek);
          setWeeks([defaultWeek]);
          setSelectedWeekId(defaultWeek.id);
        }
        setSyncStatus("saved");
      } catch (error) {
        console.error("Error loading weeks from Firestore:", error);
        setSyncStatus("error");
        setSyncErrorMsg(error instanceof Error ? error.message : String(error));
        
        // Fallback to local storage if Firestore connection fails
        const saved = localStorage.getItem("gym_progression_weeks");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setWeeks(parsed);
              const savedSel = localStorage.getItem("gym_progression_selected_week");
              if (savedSel) setSelectedWeekId(savedSel);
              return;
            }
          } catch (e) {
            console.error("Local storage fallback parsed error:", e);
          }
        }
        setWeeks([getInitialWeek()]);
      }
    }
    loadWeeks();
  }, []);

  // Apply Theme Mode class on HTML document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("gym_progression_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("gym_progression_theme", "light");
    }
  }, [darkMode]);

  // Synchronize with local storage as a quick backup
  useEffect(() => {
    if (weeks.length > 0) {
      localStorage.setItem("gym_progression_weeks", JSON.stringify(weeks));
    }
  }, [weeks]);

  useEffect(() => {
    localStorage.setItem("gym_progression_selected_week", selectedWeekId);
  }, [selectedWeekId]);

  // Find currently active week data
  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || weeks[0];

  // Handler to update the current week's state
  const handleCurrentWeekChange = async (updatedWeek: WeekData) => {
    const updatedWeeks = weeks.map((w) => (w.id === updatedWeek.id ? updatedWeek : w));
    setWeeks(updatedWeeks);

    try {
      setSyncStatus("saving");
      setSyncErrorMsg(null);
      await setDoc(doc(db, "weeks", updatedWeek.id), updatedWeek);
      setSyncStatus("saved");
    } catch (error) {
      console.error("Error saving week change to Firestore:", error);
      setSyncStatus("error");
      setSyncErrorMsg(error instanceof Error ? error.message : String(error));
    }
  };

  // Helper to change the active week from the dropdown
  const handleWeekSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWeekId(e.target.value);
  };

  // Handler to update the phase description (e.g. "Lean Bulk")
  const handlePhaseChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedValue = e.target.value;
    const updatedWeeks = weeks.map((w) => {
      if (w.id === selectedWeekId) {
        return { ...w, phase: updatedValue };
      }
      return w;
    });
    setWeeks(updatedWeeks);

    const activeWeek = updatedWeeks.find(w => w.id === selectedWeekId);
    if (activeWeek) {
      try {
        setSyncStatus("saving");
        setSyncErrorMsg(null);
        await setDoc(doc(db, "weeks", activeWeek.id), activeWeek);
        setSyncStatus("saved");
      } catch (error) {
        console.error("Error saving phase to Firestore:", error);
        setSyncStatus("error");
        setSyncErrorMsg(error instanceof Error ? error.message : String(error));
      }
    }
  };

  // Synchronize full list changes from DataManagement tab
  const handleWeeksChange = async (updatedWeeks: WeekData[]) => {
    const oldWeeks = [...weeks];
    setWeeks(updatedWeeks);

    try {
      setSyncStatus("saving");
      setSyncErrorMsg(null);
      
      // Save all current weeks
      for (const week of updatedWeeks) {
        await setDoc(doc(db, "weeks", week.id), week);
      }

      // Find and delete any weeks that are no longer in the list
      const newIds = new Set(updatedWeeks.map(w => w.id));
      const deletedWeeks = oldWeeks.filter(w => !newIds.has(w.id));
      for (const dw of deletedWeeks) {
        await deleteDoc(doc(db, "weeks", dw.id));
      }

      setSyncStatus("saved");
    } catch (error) {
      console.error("Error syncing bulk weeks list:", error);
      setSyncStatus("error");
      setSyncErrorMsg(error instanceof Error ? error.message : String(error));
    }
  };

  if (weeks.length === 0 && syncStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-550 dark:text-indigo-500 animate-spin mx-auto" />
          <h2 className="text-lg font-black text-slate-850 dark:text-slate-100">Lade Trainingsdaten...</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Verbindung zu Firestore wird aufgebaut</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col antialiased transition-colors duration-300">
      {/* 1. Header Section */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 shadow-2xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Dumbbell className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Gym Progression</h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Dein intelligenter Trainingspartner</p>
            </div>
          </div>

          {/* Quick config options: Week selector & Training phase */}
          <div className="flex flex-wrap items-center gap-3 sm:self-center">
            {/* Cloud Sync Status Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-slate-800/80 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/30">
              {syncStatus === "loading" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  <span className="text-indigo-600 dark:text-indigo-400">Verbinde...</span>
                </>
              )}
              {syncStatus === "saving" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin" />
                  <span className="text-sky-600 dark:text-sky-400">Speichert...</span>
                </>
              )}
              {syncStatus === "saved" && (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Synchronisiert</span>
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span className="text-rose-600 dark:text-rose-400">Sync-Fehler</span>
                </>
              )}
            </div>

            {/* Week Selector */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <select
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none outline-none cursor-pointer"
                value={selectedWeekId}
                onChange={handleWeekSelect}
              >
                {weeks.map((week) => (
                  <option key={week.id} value={week.id} className="dark:bg-slate-800">
                    {week.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Phase (Goal) Input */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Phase:</span>
              <input
                type="text"
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 w-24 focus:outline-none outline-none"
                value={currentWeek?.phase || ""}
                onChange={handlePhaseChange}
                placeholder="Lean Bulk"
                title="Aktuelle Phase (z.B. Lean Bulk, Cut)"
              />
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
              title={darkMode ? "Licht-Modus aktivieren" : "Dunkel-Modus aktivieren"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* Firebase sync error troubleshooting assistance */}
        {syncStatus === "error" && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-5 rounded-2xl flex flex-col md:flex-row items-start justify-between gap-4 shadow-xs transition-colors duration-300">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Verbindungsproblem mit der Firebase-Datenbank (Firestore)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Die App konnte keine Daten mit deinem Firestore-Projekt synchronisieren. Keine Sorge: Deine Änderungen wurden als Backup im lokalen Browser-Speicher gesichert!
              </p>
              {syncErrorMsg && (
                <div className="text-[11px] font-mono bg-white/70 dark:bg-black/35 border border-red-150 dark:border-red-950/60 p-2.5 rounded-lg text-red-800 dark:text-red-350 select-all leading-normal">
                  <strong>Fehler-Details:</strong> {syncErrorMsg}
                </div>
              )}
              <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1 font-medium">
                <p className="font-bold text-slate-700 dark:text-slate-300">🛠️ So behebst du diesen Fehler in deiner Firebase-Konsole:</p>
                <ul className="list-disc list-inside space-y-1">
                  {syncErrorMsg?.toLowerCase().includes("permission") || syncErrorMsg?.toLowerCase().includes("rechte") ? (
                    <li>
                      <strong>Datenbank-Regeln sperren den Zugriff:</strong> Gehe in deiner Firebase-Konsole unter <em>Firestore Database</em> auf den Reiter <strong>Regeln (Rules)</strong> und ändere die Regeln so, dass öffentlicher Zugriff erlaubt ist (z.B. im Testmodus: <code>allow read, write: if true;</code>).
                    </li>
                  ) : syncErrorMsg?.toLowerCase().includes("not-found") || syncErrorMsg?.toLowerCase().includes("exist") ? (
                    <li>
                      <strong>Datenbank wurde nicht erstellt:</strong> Gehe in deiner Firebase-Konsole unter <em>Firestore Database</em> und klicke auf den Button <strong>'Datenbank erstellen' (Create Database)</strong>.
                    </li>
                  ) : (
                    <>
                      <li>
                        <strong>Datenbank nicht erstellt?</strong> Gehe im Firebase Console Menü auf <strong>Firestore Database</strong> und klicke auf <strong>Datenbank erstellen</strong>.
                      </li>
                      <li>
                        <strong>Zugriffsregeln prüfen:</strong> Gehe im Firebase Menü unter <em>Firestore Database</em> auf den Reiter <strong>Regeln (Rules)</strong> und stelle sicher, dass Lese-/Schreibrechte für Testmodus aktiv sind (z.B. <code>allow read, write: if true;</code>).
                      </li>
                    </>
                  )}
                  <li>
                    <strong>Netzwerk/Offline:</strong> Prüfe deine Internetverbindung.
                  </li>
                </ul>
              </div>
            </div>
            <button 
              onClick={() => {
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white dark:bg-red-800 dark:hover:bg-red-700 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 mt-2 md:mt-0"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Weekly Dashboard Metrics (Dynamic calculated values) */}
        {currentWeek && <Dashboard weekData={currentWeek} />}

        {/* 3. Navigation Workspaces Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px gap-1">
          <button
            onClick={() => setActiveTab("focus")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === "focus"
                ? "border-slate-850 dark:border-indigo-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-t-xl"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-t-xl"
            }`}
          >
            <Timer className="w-4 h-4" />
            Tages-Fokus (Gym Mode)
          </button>
          <button
            onClick={() => setActiveTab("nutrition")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === "nutrition"
                ? "border-slate-850 dark:border-indigo-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-t-xl"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-t-xl"
            }`}
          >
            <Apple className="w-4 h-4" />
            Ernährungsplan
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === "analytics"
                ? "border-slate-850 dark:border-indigo-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-t-xl"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-t-xl"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Analysen & Fortschritt
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === "data"
                ? "border-slate-850 dark:border-indigo-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-t-xl"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-t-xl"
            }`}
          >
            <Settings className="w-4 h-4" />
            Daten & Backups
          </button>
        </div>

        {/* 4. Active Workspace Workspace Component */}
        <div className="pt-2">
          {activeTab === "focus" && currentWeek && (
            <DayFocusView
              weekData={currentWeek}
              onChange={handleCurrentWeekChange}
              activeDayId={activeDayId}
              setActiveDayId={setActiveDayId}
            />
          )}

          {activeTab === "nutrition" && (
            <NutritionView />
          )}

          {activeTab === "analytics" && weeks.length > 0 && (
            <AnalyticsView allWeeks={weeks} />
          )}

          {activeTab === "data" && (
            <DataManagement
              allWeeks={weeks}
              selectedWeekId={selectedWeekId}
              onWeeksChange={handleWeeksChange}
              onSelectedWeekChange={setSelectedWeekId}
            />
          )}
        </div>
      </main>

      {/* 5. Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-6 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center sm:px-6 lg:px-8 space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Gym Progression • Cloud-Synchronisiert mit Firestore
          </p>
          <p className="text-[10px] text-slate-350 dark:text-slate-600">
            Deine Daten werden live in deiner Firestore-Datenbank gespeichert, sodass du von jedem Gerät darauf zugreifen kannst.
          </p>
        </div>
      </footer>
    </div>
  );
}
