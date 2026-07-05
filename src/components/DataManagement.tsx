import React, { useRef, useState } from "react";
import { WeekData } from "../types";
import { getInitialWeek, cloneWeekStructure } from "../initialData";
import { 
  Download, Upload, RotateCcw, Plus, Trash2, Check, AlertCircle, FileSpreadsheet 
} from "lucide-react";

interface DataManagementProps {
  allWeeks: WeekData[];
  selectedWeekId: string;
  onWeeksChange: (updatedWeeks: WeekData[]) => void;
  onSelectedWeekChange: (weekId: string) => void;
}

export default function DataManagement({
  allWeeks,
  selectedWeekId,
  onWeeksChange,
  onSelectedWeekChange,
}: DataManagementProps) {
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg("");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg("");
    setTimeout(() => setErrorMsg(""), 5000);
  };

  // Add a new week, cloning the structure of the last week in the list
  const handleAddNewWeek = () => {
    const lastWeek = allWeeks[allWeeks.length - 1];
    const newWeekNum = allWeeks.length + 1;
    const newWeek = cloneWeekStructure(lastWeek, newWeekNum);
    
    const updatedWeeks = [...allWeeks, newWeek];
    onWeeksChange(updatedWeeks);
    onSelectedWeekChange(newWeek.id);
    triggerSuccess(`Woche ${newWeekNum} erfolgreich hinzugefügt und als aktiv ausgewählt!`);
  };

  // Delete current week
  const handleDeleteWeek = (weekId: string) => {
    const weekToDelete = allWeeks.find((w) => w.id === weekId);
    if (!weekToDelete) return;

    if (allWeeks.length <= 1) {
      triggerError("Du kannst die letzte verbleibende Woche nicht löschen.");
      return;
    }

    if (!confirm(`Möchtest du "${weekToDelete.name}" wirklich unwiderruflich löschen?`)) {
      return;
    }

    const updatedWeeks = allWeeks.filter((w) => w.id !== weekId);
    onWeeksChange(updatedWeeks);
    
    // Select another active week
    const currentIndex = allWeeks.findIndex((w) => w.id === weekId);
    const fallbackIndex = currentIndex === 0 ? 0 : currentIndex - 1;
    onSelectedWeekChange(updatedWeeks[fallbackIndex].id);
    triggerSuccess(`"${weekToDelete.name}" wurde erfolgreich gelöscht.`);
  };

  // Export all data to JSON
  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(allWeeks, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `gym_progression_backup_${new Date().toISOString().substring(0, 10)}.json`;
      
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      
      triggerSuccess("Backup-Datei erfolgreich heruntergeladen!");
    } catch (e) {
      triggerError("Fehler beim Exportieren des Backups.");
    }
  };

  // Parse and validate imported JSON
  const processImportedData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Basic structure validation
      if (!Array.isArray(parsed)) {
        throw new Error("Daten müssen ein Array von Wochen sein.");
      }

      if (parsed.length === 0) {
        throw new Error("Das Backup-Array darf nicht leer sein.");
      }

      const isValid = parsed.every((week: any) => {
        return (
          week.id &&
          week.name &&
          Array.isArray(week.days) &&
          week.days.every((day: any) => {
            return (
              day.id &&
              day.name &&
              day.workoutName !== undefined &&
              Array.isArray(day.exercises)
            );
          })
        );
      });

      if (!isValid) {
        throw new Error("Das Dateiformat entspricht nicht dem erwarteten Gym Progression Schema.");
      }

      onWeeksChange(parsed);
      onSelectedWeekChange(parsed[0].id);
      triggerSuccess("Backup erfolgreich eingelesen! Alle deine Daten wurden aktualisiert.");
    } catch (e: any) {
      triggerError(`Fehler beim Import: ${e.message || "Ungültiges JSON-Format."}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImportedData(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        triggerError("Nur .json Backup-Dateien werden unterstützt.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImportedData(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset to original template
  const handleResetToDefault = () => {
    if (!confirm("Bist du sicher? Alle eingetragenen Werte werden auf die Standard-Excel Vorlage zurückgesetzt und alle zusätzlichen Wochen gelöscht!")) {
      return;
    }
    const defaultWeek = getInitialWeek();
    onWeeksChange([defaultWeek]);
    onSelectedWeekChange(defaultWeek.id);
    triggerSuccess("Anwendung erfolgreich auf die Standard-Excel-Vorlage zurückgesetzt.");
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Weeks Administration */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4 transition-colors duration-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Wochen & Periodisierung verwalten
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Füge eine neue Woche hinzu, um deine Progression fortzuführen. Die Struktur deiner Übungen (inkl. Bezeichnungen und Reihenfolge) wird automatisch aus der Vorwoche geklont, damit du dich ganz aufs Training konzentrieren kannst.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={handleAddNewWeek}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-850 hover:bg-slate-950 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nächste Woche hinzufügen
            </button>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-2">Erstellte Wochen löschen:</span>
              <div className="grid grid-cols-2 gap-2">
                {allWeeks.map((week) => (
                  <div key={week.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{week.name}</span>
                    {allWeeks.length > 1 ? (
                      <button
                        onClick={() => handleDeleteWeek(week.id)}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title={`${week.name} löschen`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Standard</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Reset to default */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Zurücksetzen
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Möchtest du alles auf den Anfangszustand zurücksetzen? Dadurch werden alle deine erfassten Daten, zusätzlichen Wochen und Trainingsprotokolle gelöscht und durch die Standarddaten der Excel-Vorlage (Woche 1 mit Bankdrücken-Musterdaten) ersetzt.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleResetToDefault}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-450 rounded-xl font-bold text-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Auf Standard-Excel zurücksetzen
            </button>
          </div>
        </div>

        {/* Box 3: Backup Export & Import */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-4 md:col-span-2 transition-colors duration-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-500" />
            Backup & Datensicherung (Export / Import)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Deine Daten werden sicher in deinem Browser gespeichert. Um deine Fortschritte dauerhaft zu sichern, auf ein anderes Gerät zu übertragen oder mit deinem Trainer zu teilen, kannst du hier Backups erstellen und laden.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Download panel */}
            <div className="bg-sky-50/40 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-900/40 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Daten sichern</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Lade eine Sicherungsdatei (.json) mit all deinen Wochen, Sätzen und Körperwerten herunter.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-900 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Backup herunterladen
              </button>
            </div>

            {/* Drag & Drop Import panel */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`lg:col-span-2 border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging 
                  ? "border-sky-500 bg-sky-50/20 dark:bg-sky-950/20 scale-101" 
                  : "border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden" 
              />
              <Upload className={`w-8 h-8 mb-2 ${isDragging ? "text-sky-500" : "text-slate-400 dark:text-slate-500"}`} />
              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-200">Backup einspielen</h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Ziehe deine Backup-Datei (.json) hierher, oder klicke, um sie manuell auszuwählen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
