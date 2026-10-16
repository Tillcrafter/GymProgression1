import React from "react";
import { DayPlan, NutritionTableRow } from "../types";
import { Plus, Trash2, Utensils, Flame, Sparkles, RotateCcw } from "lucide-react";
import { getInitialNutritionRows } from "../initialData";

interface NutritionExcelTableProps {
  currentDay: DayPlan;
  onUpdateDay: (updatedDay: DayPlan) => void;
}

const COMMON_MEALS = ["Frühstück", "Pre-Workout", "Post-Workout", "Abendessen", "Snacks"];

/**
 * Extracts first positive number from a string (e.g. "50 g" -> 50, "110g" -> 110, "0.5 l" -> 0.5)
 */
function extractNumber(val: string): number | null {
  if (!val) return null;
  const match = String(val).replace(",", ".").match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) || num <= 0 ? null : num;
}

/**
 * Parses numeric value safely from string or number, tolerating empty string or german comma
 */
function parseNum(val: any): number {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.,-]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export default function NutritionExcelTable({ currentDay, onUpdateDay }: NutritionExcelTableProps) {
  const rows = currentDay.nutritionRows || [];

  const updateRow = (id: string, field: keyof NutritionTableRow, value: any) => {
    const updated = rows.map((r) => {
      if (r.id !== id) return r;

      // Smart Menge (Amount) auto-scaling:
      // If user changes Menge from e.g. 50g to 100g, proportionally scale Kcal & Makros!
      if (field === "amount") {
        const oldNum = extractNumber(String(r.amount));
        const newNum = extractNumber(String(value));

        if (oldNum && newNum && oldNum > 0 && newNum !== oldNum) {
          const factor = newNum / oldNum;
          const currentCal = parseNum(r.calories);
          const currentProt = parseNum(r.protein);
          const currentCarb = parseNum(r.carbs);
          const currentFat = parseNum(r.fat);

          return {
            ...r,
            amount: value,
            calories: currentCal > 0 ? Math.round(currentCal * factor) : r.calories,
            protein: currentProt > 0 ? Math.round(currentProt * factor * 10) / 10 : r.protein,
            carbs: currentCarb > 0 ? Math.round(currentCarb * factor * 10) / 10 : r.carbs,
            fat: currentFat > 0 ? Math.round(currentFat * factor * 10) / 10 : r.fat,
          };
        }
        return { ...r, amount: value };
      }

      // Nutrient direct input:
      if (field === "calories" || field === "protein" || field === "carbs" || field === "fat") {
        if (value === "") {
          return { ...r, [field]: "" };
        }
        const cleaned = String(value).replace(",", ".");
        const num = parseFloat(cleaned);
        return {
          ...r,
          [field]: isNaN(num) ? "" : Math.round(num * 10) / 10,
        };
      }

      return { ...r, [field]: value };
    });

    onUpdateDay({ ...currentDay, nutritionRows: updated });
  };

  const addRow = (suggestedMeal?: string) => {
    const lastRow = rows[rows.length - 1];
    const newRow: NutritionTableRow = {
      id: `nut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      meal: suggestedMeal || lastRow?.meal || "Snacks",
      food: "",
      amount: "100 g",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: "",
    };
    onUpdateDay({ ...currentDay, nutritionRows: [...rows, newRow] });
  };

  const deleteRow = (id: string) => {
    onUpdateDay({ ...currentDay, nutritionRows: rows.filter((r) => r.id !== id) });
  };

  const resetToStandard = () => {
    if (window.confirm("Möchtest du den Ernährungsplan für diesen Tag auf den Standard-Plan (3.340 kcal) zurücksetzen?")) {
      onUpdateDay({ ...currentDay, nutritionRows: getInitialNutritionRows() });
    }
  };

  // Live Excel Sums for the entire day (Tagesgesamt)
  const totalCalories = Math.round(rows.reduce((sum, r) => sum + parseNum(r.calories), 0));
  const totalProtein = Math.round(rows.reduce((sum, r) => sum + parseNum(r.protein), 0) * 10) / 10;
  const totalCarbs = Math.round(rows.reduce((sum, r) => sum + parseNum(r.carbs), 0) * 10) / 10;
  const totalFat = Math.round(rows.reduce((sum, r) => sum + parseNum(r.fat), 0) * 10) / 10;

  return (
    <div className="flex flex-col h-full bg-[#161619] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Table Header Bar with Live Totals */}
      <div className="p-4 sm:px-6 sm:py-4 bg-gradient-to-r from-[#1c1c21] to-[#161619] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
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
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-2">
              <span>ERNÄHRUNGSPLAN & MAKRO-BERECHNUNG</span>
            </h2>
          </div>
        </div>

        {/* Macro Totals & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-300 font-bold shadow-sm">
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

          <button
            onClick={() => addRow()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold transition-all cursor-pointer border border-emerald-500/30 ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Zeile</span>
          </button>

          <button
            onClick={resetToStandard}
            title="Auf Standard-Plan zurücksetzen"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Excel Sheet Table Grid */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-[#101013] text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 select-none">
              <th className="py-2.5 px-3 w-10 text-center text-zinc-600 font-mono border-r border-white/5">#</th>
              <th className="py-2.5 px-3 w-32 border-r border-white/5">Mahlzeit</th>
              <th className="py-2.5 px-3 min-w-[190px] border-r border-white/5">Lebensmittel / Zutat</th>
              <th className="py-2.5 px-3 w-28 text-center border-r border-white/5">Menge</th>
              <th className="py-2.5 px-3 w-24 text-center border-r border-white/5 text-emerald-400 font-black">Kcal</th>
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
              const currentMeal = (row.meal || "").trim().toLowerCase();
              const nextMeal = idx < rows.length - 1 ? (rows[idx + 1].meal || "").trim().toLowerCase() : null;
              const isLastInMealBlock = currentMeal !== "" && (idx === rows.length - 1 || currentMeal !== nextMeal);

              // Calculate subtotal for this meal block
              let subCal = 0;
              let subProt = 0;
              let subCarb = 0;
              let subFat = 0;

              if (isLastInMealBlock) {
                let startIdx = idx;
                while (startIdx >= 0 && (rows[startIdx].meal || "").trim().toLowerCase() === currentMeal) {
                  const r = rows[startIdx];
                  subCal += parseNum(r.calories);
                  subProt += parseNum(r.protein);
                  subCarb += parseNum(r.carbs);
                  subFat += parseNum(r.fat);
                  startIdx--;
                }
              }

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
                        onChange={(e) => updateRow(row.id, "meal", e.target.value)}
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
                        onChange={(e) => updateRow(row.id, "food", e.target.value)}
                        placeholder="Lebensmittel eintragen..."
                        className="w-full bg-transparent px-2 py-1.5 rounded text-white font-medium focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600 font-sans text-xs sm:text-sm"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        value={row.amount}
                        onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                        placeholder="100g"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-zinc-200 font-medium focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </td>

                    {/* Calories */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.calories}
                        onChange={(e) => updateRow(row.id, "calories", e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-emerald-400 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </td>

                    {/* Protein */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.protein}
                        onChange={(e) => updateRow(row.id, "protein", e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-cyan-300 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </td>

                    {/* Carbs */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.carbs}
                        onChange={(e) => updateRow(row.id, "carbs", e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-amber-300 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </td>

                    {/* Fat */}
                    <td className="py-1 px-1.5 border-r border-white/5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.fat}
                        onChange={(e) => updateRow(row.id, "fat", e.target.value)}
                        placeholder="0"
                        className="w-full text-center bg-transparent px-1 py-1.5 rounded text-rose-300 font-bold focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </td>

                    {/* Notes */}
                    <td className="py-1 px-2 border-r border-white/5">
                      <input
                        type="text"
                        value={row.notes || ""}
                        onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                        placeholder="Notiz..."
                        className="w-full bg-transparent px-2 py-1.5 rounded text-zinc-400 focus:bg-[#101014] focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-zinc-600 font-sans text-xs"
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

                  {/* Excel Subtotal Row (Zwischensumme für diesen Mahlzeitenblock) */}
                  {isLastInMealBlock && (
                    <tr className="bg-emerald-950/20 border-y-2 border-emerald-500/30 text-emerald-200 font-bold select-none text-[11px]">
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-black border-r border-emerald-500/20">
                        ∑
                      </td>
                      <td className="py-2.5 px-3 uppercase tracking-wider text-emerald-300 font-extrabold border-r border-emerald-500/20" colSpan={2}>
                        Zwischensumme {row.meal}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400/80 font-mono border-r border-emerald-500/20 text-[10px]">
                        =TEILSUMME
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-300 font-black font-mono border-r border-emerald-500/20">
                        {Math.round(subCal)} kcal
                      </td>
                      <td className="py-2.5 px-3 text-center text-cyan-300 font-black font-mono border-r border-emerald-500/20">
                        {Math.round(subProt * 10) / 10} g
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-300 font-black font-mono border-r border-emerald-500/20">
                        {Math.round(subCarb * 10) / 10} g
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-300 font-black font-mono border-r border-emerald-500/20">
                        {Math.round(subFat * 10) / 10} g
                      </td>
                      <td colSpan={2} className="py-2.5 px-3 text-zinc-400 font-sans text-[10px] font-normal italic">
                        {row.meal}-Makros berechnet
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-zinc-500 text-xs">
                  Keine Mahlzeiten eingetragen. Klicke auf "+ Lebensmittel" oder setze den Standardplan zurück.
                </td>
              </tr>
            )}
          </tbody>

          {/* Grand Total Footer (TAGESGESAMT) */}
          <tfoot className="border-t-2 border-emerald-500/40 bg-[#121216] select-none text-xs font-mono font-bold">
            <tr className="border-b border-white/5">
              <td className="py-3 px-3 text-center text-emerald-400 font-black border-r border-white/5 bg-emerald-500/10">
                ∑∑
              </td>
              <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-white font-black border-r border-white/5 text-sm">
                TAGESGESAMT
              </td>
              <td className="py-3 px-3 text-center text-zinc-500 border-r border-white/5 font-mono text-[11px]">
                {rows.length} Einträge
              </td>
              <td className="py-3 px-3 text-center text-emerald-400 font-black text-sm border-r border-white/5 bg-emerald-500/10">
                {totalCalories.toLocaleString("de-DE")} kcal
              </td>
              <td className="py-3 px-3 text-center text-cyan-300 font-black text-sm border-r border-white/5 bg-cyan-500/5">
                {totalProtein} g
              </td>
              <td className="py-3 px-3 text-center text-amber-300 font-black text-sm border-r border-white/5 bg-amber-500/5">
                {totalCarbs} g
              </td>
              <td className="py-3 px-3 text-center text-rose-300 font-black text-sm border-r border-white/5 bg-rose-500/5">
                {totalFat} g
              </td>
              <td colSpan={2} className="py-3 px-3 text-zinc-400 font-sans text-[11px] font-normal">
                Ziel: 3.340 kcal • 175g P • 445g KH • 65g F
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
