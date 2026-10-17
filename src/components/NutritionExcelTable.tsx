import React, { useState, useRef } from "react";
import { DayPlan, NutritionTableRow, parseGermanOrEnglishNumber } from "../types";
import { 
  Plus, 
  Trash2, 
  Utensils, 
  Flame, 
  Sparkles, 
  RotateCcw, 
  Calculator, 
  Check, 
  AlertCircle, 
  Info,
  ChevronDown,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { getInitialNutritionRows } from "../initialData";

interface NutritionExcelTableProps {
  currentDay: DayPlan;
  onUpdateDay: (updatedDay: DayPlan) => void;
}

const COMMON_MEALS = ["Frühstück", "Pre-Workout", "Post-Workout", "Abendessen", "Snacks"];

/**
 * Extracts positive number and unit from an amount string (e.g. "50 g" -> { num: 50, unit: "g" })
 */
function parseAmountWithUnit(val: any): { num: number; unit: string } | null {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).trim();
  // Find first number (can have comma or dot, e.g. "50", "0,5", "100.5")
  const match = str.replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return null;

  // Extract unit if present (e.g. "g", "ml", "Stück", "EL")
  const afterNum = str.slice(str.indexOf(match[0]) + match[0].length).trim();
  const unit = afterNum || (str.toLowerCase().includes("ml") ? "ml" : "g");
  return { num, unit };
}

export default function NutritionExcelTable({ currentDay, onUpdateDay }: NutritionExcelTableProps) {
  const rows = currentDay.nutritionRows || [];
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Debounce ref for amount typing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store baseline values when user begins editing amount to prevent drift or division by unscaled amount
  const inputBaselineRef = useRef<Record<string, { amt: number; cal: number; p: number; c: number; f: number }>>({});

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  /**
   * Captures the baseline numbers when focusing on the amount field
   */
  const handleAmountFocus = (row: NutritionTableRow) => {
    const curAmt = parseAmountWithUnit(row.amount)?.num || 100;
    inputBaselineRef.current[row.id] = {
      amt: curAmt,
      cal: parseGermanOrEnglishNumber(row.calories),
      p: parseGermanOrEnglishNumber(row.protein),
      c: parseGermanOrEnglishNumber(row.carbs),
      f: parseGermanOrEnglishNumber(row.fat),
    };
  };

  /**
   * Scales a row to a new amount in grams using the captured baseline.
   * Rock-solid: no rounding drift, completely independent of keystroke delays!
   */
  const scaleRowToGrams = (rowId: string, newAmountVal: string, commitFormat: boolean = false) => {
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow) return;

    const parsed = parseAmountWithUnit(newAmountVal);
    if (!parsed || parsed.num <= 0) {
      // Just update text if not a valid number
      const updated = rows.map((r) => (r.id === rowId ? { ...r, amount: newAmountVal } : r));
      onUpdateDay({ ...currentDay, nutritionRows: updated });
      return;
    }

    // Retrieve or establish baseline
    let baseline = inputBaselineRef.current[rowId];
    if (!baseline || baseline.amt <= 0) {
      const curAmt = parseAmountWithUnit(targetRow.amount)?.num || 100;
      baseline = {
        amt: curAmt,
        cal: parseGermanOrEnglishNumber(targetRow.calories),
        p: parseGermanOrEnglishNumber(targetRow.protein),
        c: parseGermanOrEnglishNumber(targetRow.carbs),
        f: parseGermanOrEnglishNumber(targetRow.fat),
      };
      inputBaselineRef.current[rowId] = baseline;
    }

    const factor = parsed.num / baseline.amt;
    const newCal = Math.round(baseline.cal * factor);
    const newProt = Math.round(baseline.p * factor * 10) / 10;
    const newCarb = Math.round(baseline.c * factor * 10) / 10;
    const newFat = Math.round(baseline.f * factor * 10) / 10;
    const unit = parsed.unit || "g";

    const formattedAmount = commitFormat ? `${parsed.num} ${unit}` : newAmountVal;

    const updated = rows.map((r) => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        amount: formattedAmount,
        calories: newCal,
        protein: newProt,
        carbs: newCarb,
        fat: newFat,
      };
    });

    onUpdateDay({ ...currentDay, nutritionRows: updated });

    if (commitFormat) {
      // Update baseline to the new values for subsequent adjustments
      inputBaselineRef.current[rowId] = {
        amt: parsed.num,
        cal: newCal,
        p: newProt,
        c: newCarb,
        f: newFat,
      };
      showToast(`${targetRow.food || "Mahlzeit"}: auf ${parsed.num}${unit} angepasst (${newCal} kcal)`);
    }
  };

  /**
   * Handle user typing in the amount input with responsive typing + 400ms debounced live scaling
   */
  const handleAmountInputChange = (row: NutritionTableRow, val: string) => {
    // 1. Ensure baseline exists
    if (!inputBaselineRef.current[row.id]) {
      handleAmountFocus(row);
    }

    // 2. Immediately update text in table so typing never lags or flickers
    const updated = rows.map((r) => (r.id === row.id ? { ...r, amount: val } : r));
    onUpdateDay({ ...currentDay, nutritionRows: updated });

    // 3. Debounce: if user pauses typing for 400ms with a valid number, scale live!
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      scaleRowToGrams(row.id, val, false);
    }, 400);
  };

  /**
   * When user leaves the amount field (onBlur) or presses Enter, scale immediately and format cleanly
   */
  const handleAmountBlur = (row: NutritionTableRow) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    scaleRowToGrams(row.id, row.amount, true);
  };

  /**
   * Quick portion modifiers: 0.5x, 1.5x, 2x, +50g, -50g
   */
  const adjustPortion = (rowId: string, type: "multiply" | "add", val: number) => {
    const targetRow = rows.find((r) => r.id === rowId);
    if (!targetRow) return;

    const currentParsed = parseAmountWithUnit(targetRow.amount) || { num: 100, unit: "g" };
    let newNum: number;
    if (type === "multiply") {
      newNum = Math.round(currentParsed.num * val);
    } else {
      newNum = Math.max(10, currentParsed.num + val);
    }

    // Set baseline from current row before adjusting
    inputBaselineRef.current[rowId] = {
      amt: currentParsed.num,
      cal: parseGermanOrEnglishNumber(targetRow.calories),
      p: parseGermanOrEnglishNumber(targetRow.protein),
      c: parseGermanOrEnglishNumber(targetRow.carbs),
      f: parseGermanOrEnglishNumber(targetRow.fat),
    };

    scaleRowToGrams(rowId, `${newNum} ${currentParsed.unit}`, true);
  };

  /**
   * Direct editing of calories, protein, carbs, fat, food, meal, notes
   */
  const updateRowField = (id: string, field: keyof NutritionTableRow, value: any) => {
    const updated = rows.map((r) => {
      if (r.id !== id) return r;

      if (field === "calories" || field === "protein" || field === "carbs" || field === "fat") {
        if (value === "") {
          return { ...r, [field]: "" };
        }
        // Retain user's commas and decimals as they type (e.g. "12," or "12,5" or "250")
        const sanitized = String(value).replace(/[^0-9.,]/g, "");
        const numVal = parseGermanOrEnglishNumber(sanitized);

        // Update baseline so future amount scaling uses the user's updated numbers
        const currentAmountNum = parseAmountWithUnit(r.amount)?.num || 100;
        inputBaselineRef.current[id] = {
          amt: currentAmountNum,
          cal: field === "calories" ? numVal : parseGermanOrEnglishNumber(r.calories),
          p: field === "protein" ? numVal : parseGermanOrEnglishNumber(r.protein),
          c: field === "carbs" ? numVal : parseGermanOrEnglishNumber(r.carbs),
          f: field === "fat" ? numVal : parseGermanOrEnglishNumber(r.fat),
        };

        return { 
          ...r, 
          [field]: sanitized,
        };
      }

      return { ...r, [field]: value };
    });

    onUpdateDay({ ...currentDay, nutritionRows: updated });
  };

  /**
   * Calculate calories for a single row based on P*4 + KH*4 + F*9
   */
  const calculateRowCalories = (id: string) => {
    const target = rows.find((r) => r.id === id);
    if (!target) return;

    const p = parseGermanOrEnglishNumber(target.protein);
    const c = parseGermanOrEnglishNumber(target.carbs);
    const f = parseGermanOrEnglishNumber(target.fat);
    const calculated = Math.round(p * 4 + c * 4 + f * 9);

    const currentAmountNum = parseAmountWithUnit(target.amount)?.num || 100;
    inputBaselineRef.current[id] = {
      amt: currentAmountNum,
      cal: calculated,
      p,
      c,
      f,
    };

    const updated = rows.map((r) => (r.id === id ? { ...r, calories: calculated } : r));
    onUpdateDay({ ...currentDay, nutritionRows: updated });
    showToast(`${target.food || "Eintrag"}: Kcal auf ${calculated} gesetzt (${p}g P × 4 + ${c}g KH × 4 + ${f}g F × 9)`);
  };

  /**
   * Recalculates calories for all rows in the table where protein/carbs/fat are present
   */
  const calculateAllCaloriesFromMacros = () => {
    let changed = 0;
    const updated = rows.map((r) => {
      const p = parseGermanOrEnglishNumber(r.protein);
      const c = parseGermanOrEnglishNumber(r.carbs);
      const f = parseGermanOrEnglishNumber(r.fat);

      if (p > 0 || c > 0 || f > 0) {
        const calculated = Math.round(p * 4 + c * 4 + f * 9);
        changed++;
        const currentAmountNum = parseAmountWithUnit(r.amount)?.num || 100;
        inputBaselineRef.current[r.id] = {
          amt: currentAmountNum,
          cal: calculated,
          p,
          c,
          f,
        };
        return { 
          ...r, 
          calories: calculated,
        };
      }
      return r;
    });

    onUpdateDay({ ...currentDay, nutritionRows: updated });
    showToast(`${changed} Einträge: Kalorien exakt nach Nährwertformel (P×4 + KH×4 + F×9) berechnet!`);
  };

  const addRow = (suggestedMeal?: string) => {
    const lastRow = rows[rows.length - 1];
    const newRow: NutritionTableRow = {
      id: `nut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      meal: suggestedMeal || lastRow?.meal || "Snacks",
      food: "",
      amount: "100 g",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      notes: "",
    };
    onUpdateDay({ ...currentDay, nutritionRows: [...rows, newRow] });
  };

  const deleteRow = (id: string) => {
    onUpdateDay({ ...currentDay, nutritionRows: rows.filter((r) => r.id !== id) });
  };

  const resetToStandard = () => {
    onUpdateDay({ ...currentDay, nutritionRows: getInitialNutritionRows() });
    setShowResetConfirm(false);
    inputBaselineRef.current = {};
    showToast("Verifizierter Standard-Plan (3.316 kcal | 192g Protein | 427g KH | 83g Fett) geladen!");
  };

  // Live Excel Sums for the entire day (Tagesgesamt) using parseGermanOrEnglishNumber
  const totalCalories = Math.round(rows.reduce((sum, r) => sum + parseGermanOrEnglishNumber(r.calories), 0));
  const totalProtein = Math.round(rows.reduce((sum, r) => sum + parseGermanOrEnglishNumber(r.protein), 0) * 10) / 10;
  const totalCarbs = Math.round(rows.reduce((sum, r) => sum + parseGermanOrEnglishNumber(r.carbs), 0) * 10) / 10;
  const totalFat = Math.round(rows.reduce((sum, r) => sum + parseGermanOrEnglishNumber(r.fat), 0) * 10) / 10;

  // Exact macro formula sum: 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
  const macroCalculatedCal = Math.round(totalProtein * 4 + totalCarbs * 4 + totalFat * 9);
  const macroDiff = Math.abs(totalCalories - macroCalculatedCal);

  return (
    <div className="flex flex-col h-full bg-[#161619] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-500 text-black px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Reset Confirmation Banner */}
      {showResetConfirm && (
        <div className="bg-rose-950/90 border-b border-rose-500/30 p-3 px-6 flex items-center justify-between text-xs text-rose-200 z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="font-bold">
              Möchtest du den Ernährungsplan auf den offiziell geprüften & korrigierten Standard-Plan (3.316 kcal) zurücksetzen?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToStandard}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg cursor-pointer"
            >
              Ja, korrigierten Plan laden (3.316 kcal)
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Table Header Bar with Live Totals & Action Controls */}
      <div className="p-4 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[#1c1c21] to-[#161619] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Tabelle 3
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs text-zinc-300 font-bold uppercase">{currentDay.name} ({currentDay.date || currentDay.label})</span>
            </div>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white uppercase flex items-center gap-2">
              ERNÄHRUNGSPLAN & MAKRO-BERECHNUNG
            </h2>
          </div>
        </div>

        {/* Live Macro Totals & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 font-bold shadow-sm">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">{totalCalories.toLocaleString("de-DE")} kcal</span>
          </div>
          <div className="bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1.5 rounded-xl text-cyan-300 font-semibold">
            P: <span className="font-bold text-white">{totalProtein}g</span>
          </div>
          <div className="bg-amber-950/50 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-amber-300 font-semibold">
            KH: <span className="font-bold text-white">{totalCarbs}g</span>
          </div>
          <div className="bg-rose-950/50 border border-rose-500/30 px-2.5 py-1.5 rounded-xl text-rose-300 font-semibold">
            F: <span className="font-bold text-white">{totalFat}g</span>
          </div>

          {/* Smart Calculator Action */}
          <button
            onClick={calculateAllCaloriesFromMacros}
            title="Berechnet für alle Zeilen die Kcal exakt nach Nährwertformel: (Protein × 4) + (KH × 4) + (Fett × 9)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold transition-all cursor-pointer border border-cyan-500/30 shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kcal aus Makros</span>
          </button>

          <button
            onClick={() => addRow()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold transition-all cursor-pointer border border-emerald-500/30 ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Zeile</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            title="Auf geprüften Standard-Plan (3.316 kcal) zurücksetzen"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Tip for Gram Scaling */}
      <div className="bg-[#121215] px-4 sm:px-6 py-2 border-b border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Proportionale Berechnung aktiv:</strong> Wenn du die Grammanzahl änderst (z. B. auf 150g oder 50g), berechnen sich Kcal, Protein, KH und Fett sofort exakt prozentual mit!
          </span>
        </div>
        {macroDiff > 20 && (
          <button
            onClick={calculateAllCaloriesFromMacros}
            className="hidden md:flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
          >
            <Calculator className="w-3 h-3" />
            <span>Makro-Formel ergibt {macroCalculatedCal} kcal ({macroDiff > 0 ? `+${macroCalculatedCal - totalCalories}` : macroCalculatedCal - totalCalories} kcal) → Synchronisieren</span>
          </button>
        )}
      </div>

      {/* Excel Sheet Table Grid */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="bg-[#101013] text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 select-none">
              <th className="py-2.5 px-3 w-10 text-center text-zinc-600 font-mono border-r border-white/5">#</th>
              <th className="py-2.5 px-3 w-32 border-r border-white/5">Mahlzeit</th>
              <th className="py-2.5 px-3 min-w-[200px] border-r border-white/5">Lebensmittel / Zutat</th>
              <th className="py-2.5 px-3 w-40 text-center border-r border-white/5">
                <span className="text-zinc-200">Menge</span>
                <span className="text-[9px] text-emerald-400 font-normal block">auto-skalierend</span>
              </th>
              <th className="py-2.5 px-3 w-28 text-center border-r border-white/5 text-emerald-400 font-black">Kcal</th>
              <th className="py-2.5 px-3 w-24 text-center border-r border-white/5 text-cyan-400 font-black">Protein</th>
              <th className="py-2.5 px-3 w-24 text-center border-r border-white/5 text-amber-400 font-black">KH</th>
              <th className="py-2.5 px-3 w-24 text-center border-r border-white/5 text-rose-400 font-black">Fett</th>
              <th className="py-2.5 px-3 min-w-[120px] border-r border-white/5">Notizen</th>
              <th className="py-2.5 px-2 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs font-mono">
            {rows.map((row, idx) => {
              // Check if last row of contiguous meal block
              const isLastOfMeal = idx === rows.length - 1 || rows[idx + 1].meal !== row.meal;
              
              // Calculate Subtotal for this meal block
              let subtotalCal = 0;
              let subtotalProt = 0;
              let subtotalCarb = 0;
              let subtotalFat = 0;
              if (isLastOfMeal) {
                const mealRows = rows.filter((r) => r.meal === row.meal);
                subtotalCal = Math.round(mealRows.reduce((acc, r) => acc + parseGermanOrEnglishNumber(r.calories), 0));
                subtotalProt = Math.round(mealRows.reduce((acc, r) => acc + parseGermanOrEnglishNumber(r.protein), 0) * 10) / 10;
                subtotalCarb = Math.round(mealRows.reduce((acc, r) => acc + parseGermanOrEnglishNumber(r.carbs), 0) * 10) / 10;
                subtotalFat = Math.round(mealRows.reduce((acc, r) => acc + parseGermanOrEnglishNumber(r.fat), 0) * 10) / 10;
              }

              // Row macro formula check
              const rowP = parseGermanOrEnglishNumber(row.protein);
              const rowC = parseGermanOrEnglishNumber(row.carbs);
              const rowF = parseGermanOrEnglishNumber(row.fat);
              const rowCal = parseGermanOrEnglishNumber(row.calories);
              const formulaCal = Math.round(rowP * 4 + rowC * 4 + rowF * 9);
              const hasDiscrepancy = (rowP > 0 || rowC > 0 || rowF > 0) && Math.abs(formulaCal - rowCal) > 8;

              return (
                <React.Fragment key={row.id}>
                  <tr className="group hover:bg-white/[0.03] transition-colors focus-within:bg-emerald-950/20">
                    {/* Row Index */}
                    <td className="py-2 px-3 text-center text-zinc-500 font-mono text-[11px] bg-black/20 border-r border-white/5 select-none">
                      {idx + 1}
                    </td>

                    {/* Meal name */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        list={`meals-list-${row.id}`}
                        value={row.meal}
                        onChange={(e) => updateRowField(row.id, "meal", e.target.value)}
                        placeholder="z.B. Frühstück"
                        className="w-full bg-transparent px-2 py-1.5 rounded text-emerald-300 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-sans text-xs"
                      />
                      <datalist id={`meals-list-${row.id}`}>
                        {COMMON_MEALS.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </td>

                    {/* Food name */}
                    <td className="py-1 px-2 border-r border-white/5">
                      <input
                        type="text"
                        value={row.food}
                        onChange={(e) => updateRowField(row.id, "food", e.target.value)}
                        placeholder="Lebensmittel eintragen..."
                        className="w-full bg-transparent px-2 py-1.5 rounded text-white font-medium focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600 font-sans text-xs sm:text-sm"
                      />
                    </td>

                    {/* Menge (Amount with Smart Proportional Auto-Scaling & Quick Modifiers) */}
                    <td className="py-1 px-1.5 border-r border-white/5 relative group/amt">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={row.amount}
                          onFocus={() => handleAmountFocus(row)}
                          onChange={(e) => handleAmountInputChange(row, e.target.value)}
                          onBlur={() => handleAmountBlur(row)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="100 g"
                          title="Ändere die Gramm-Zahl (z. B. 150g oder 50g) — Kcal und Makros passen sich sofort proportional an!"
                          className="w-full text-center bg-transparent px-1 py-1.5 rounded text-zinc-200 font-semibold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                        />
                        
                        {/* Quick Modifiers on Hover */}
                        <div className="hidden group-hover/amt:flex items-center gap-0.5 shrink-0 bg-[#121215] p-0.5 rounded border border-white/10">
                          <button
                            type="button"
                            onClick={() => adjustPortion(row.id, "multiply", 0.5)}
                            title="Menge halbieren (½): Skaliert Kcal & Makros auf 50%"
                            className="px-1 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 text-[10px] font-bold cursor-pointer"
                          >
                            ½
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustPortion(row.id, "multiply", 2)}
                            title="Menge verdoppeln (×2): Verdoppelt Kcal & Makros"
                            className="px-1 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 text-[10px] font-bold cursor-pointer"
                          >
                            ×2
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustPortion(row.id, "add", 50)}
                            title="+50 Gramm hinzufügen"
                            className="px-1 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-300 text-[10px] font-bold cursor-pointer"
                          >
                            +50
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Calories */}
                    <td className="py-1 px-1.5 border-r border-white/5 relative group/cal">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.calories}
                          onChange={(e) => updateRowField(row.id, "calories", e.target.value)}
                          placeholder="0"
                          className="w-full text-center bg-transparent px-1 py-1.5 rounded text-emerald-400 font-black focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                        />
                        {hasDiscrepancy && (
                          <button
                            type="button"
                            onClick={() => calculateRowCalories(row.id)}
                            title={`Kcal weichen von Makros ab (${formulaCal} nach P*4 + KH*4 + F*9). Klicke hier zum Berechnen!`}
                            className="hidden group-hover/cal:block absolute right-1 p-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 text-[9px] cursor-pointer"
                          >
                            ={formulaCal}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Protein */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.protein}
                        onChange={(e) => updateRowField(row.id, "protein", e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-cyan-400 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                      />
                    </td>

                    {/* Carbs */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.carbs}
                        onChange={(e) => updateRowField(row.id, "carbs", e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-amber-400 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                      />
                    </td>

                    {/* Fat */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.fat}
                        onChange={(e) => updateRowField(row.id, "fat", e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-rose-400 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                      />
                    </td>

                    {/* Notes */}
                    <td className="py-1 px-2 border-r border-white/5">
                      <input
                        type="text"
                        value={row.notes || ""}
                        onChange={(e) => updateRowField(row.id, "notes", e.target.value)}
                        placeholder="Notizen..."
                        className="w-full bg-transparent px-2 py-1.5 rounded text-zinc-400 font-sans focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-xs"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-1 px-1 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-1.5 text-zinc-600 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Zeile löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Zwischensumme Row for each meal block */}
                  {isLastOfMeal && (
                    <tr className="bg-emerald-950/25 border-y border-emerald-500/20 text-emerald-300 font-black text-xs select-none">
                      <td className="py-2 px-3 text-center text-emerald-500 font-mono text-[10px] bg-black/30 border-r border-white/5">
                        ∑
                      </td>
                      <td className="py-2 px-3 font-sans uppercase tracking-wider text-[11px] text-emerald-300 border-r border-white/5">
                        Zwischensumme
                      </td>
                      <td className="py-2 px-3 text-zinc-400 font-sans text-[11px] font-normal border-r border-white/5">
                        {row.meal}
                      </td>
                      <td className="py-2 px-3 text-center text-zinc-500 font-mono text-[10px] border-r border-white/5">
                        —
                      </td>
                      <td className="py-2 px-3 text-center text-emerald-400 font-mono text-sm border-r border-white/5 font-black">
                        {subtotalCal.toLocaleString("de-DE")} kcal
                      </td>
                      <td className="py-2 px-3 text-center text-cyan-300 font-mono border-r border-white/5">
                        {subtotalProt} g
                      </td>
                      <td className="py-2 px-3 text-center text-amber-300 font-mono border-r border-white/5">
                        {subtotalCarb} g
                      </td>
                      <td className="py-2 px-3 text-center text-rose-300 font-mono border-r border-white/5">
                        {subtotalFat} g
                      </td>
                      <td className="py-2 px-3 text-zinc-500 font-sans text-[11px] italic border-r border-white/5">
                        Mahlzeit-Summe
                      </td>
                      <td className="py-2 px-1 text-center">
                        <button
                          onClick={() => addRow(row.meal)}
                          title={`Weitere Zutat zu ${row.meal} hinzufügen`}
                          className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Table Footer: TAGESGESAMT (Grand Total) */}
          <tfoot>
            <tr className="bg-gradient-to-r from-emerald-950/70 via-black to-emerald-950/70 border-t-2 border-emerald-500/50 text-white font-black text-xs sm:text-sm select-none">
              <td className="py-3 px-3 text-center text-emerald-400 font-mono bg-black/40 border-r border-white/5">
                ★
              </td>
              <td className="py-3 px-3 uppercase tracking-wider text-emerald-400 font-black border-r border-white/5">
                TAGESGESAMT
              </td>
              <td className="py-3 px-3 text-zinc-300 font-sans text-xs border-r border-white/5">
                Gesamte Nährwerte ({rows.length} Lebensmittel)
              </td>
              <td className="py-3 px-3 text-center text-zinc-500 font-mono text-xs border-r border-white/5">
                100% Tag
              </td>
              <td className="py-3 px-3 text-center text-emerald-300 font-mono text-base font-black border-r border-white/5 shadow-inner">
                {totalCalories.toLocaleString("de-DE")} kcal
              </td>
              <td className="py-3 px-3 text-center text-cyan-300 font-mono text-sm font-black border-r border-white/5">
                {totalProtein} g
              </td>
              <td className="py-3 px-3 text-center text-amber-300 font-mono text-sm font-black border-r border-white/5">
                {totalCarbs} g
              </td>
              <td className="py-3 px-3 text-center text-rose-300 font-mono text-sm font-black border-r border-white/5">
                {totalFat} g
              </td>
              <td className="py-3 px-3 text-zinc-400 font-sans text-xs font-normal border-r border-white/5">
                Formel: {macroCalculatedCal} kcal
              </td>
              <td className="py-3 px-1 text-center"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Quick Add Row Button in Table Footer */}
      <div className="p-3 bg-[#111114] border-t border-white/10 flex items-center justify-between text-xs">
        <button
          onClick={() => addRow()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold transition-all cursor-pointer border border-white/5"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ Lebensmittel hinzufügen</span>
        </button>

        <div className="text-[11px] text-zinc-500 font-mono hidden sm:block">
          Honig • Haferflocken • Magerquark • ESN Rice Pudding • Basic Whey • Hähnchenbrust • Nudeln
        </div>
      </div>
    </div>
  );
}
