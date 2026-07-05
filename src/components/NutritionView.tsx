import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Sliders, Check, RefreshCw, 
  Sparkles, FileText, ShoppingBag, Eye, Edit3, Save, Info, Cloud, CloudOff, Loader2, AlertTriangle
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface NutritionItem {
  id: string;
  meal: "Frühstück" | "Pre-Workout" | "Post-Workout" | "Abendessen" | "Snacks";
  food: string;
  amount: number; // in grams/ml
  calories: number; // kcal
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  isEaten?: boolean;
}

const INITIAL_NUTRITION: NutritionItem[] = [
  // Frühstück
  { id: "f1", meal: "Frühstück", food: "Honig", amount: 20, calories: 62, protein: 0, carbs: 16, fat: 0 },
  { id: "f2", meal: "Frühstück", food: "Haferflocken", amount: 65, calories: 242, protein: 8, carbs: 38, fat: 5 },
  { id: "f3", meal: "Frühstück", food: "Magerquark / Speisequark Magerstufe", amount: 250, calories: 165, protein: 30, carbs: 10, fat: 1 },
  
  // Pre-Workout
  { id: "pre1", meal: "Pre-Workout", food: "ESN Rice Pudding", amount: 75, calories: 280, protein: 6, carbs: 60, fat: 1 },
  { id: "pre2", meal: "Pre-Workout", food: "Instant Oats", amount: 25, calories: 93, protein: 3, carbs: 15, fat: 2 },
  { id: "pre3", meal: "Pre-Workout", food: "Fettarme H-Milch laktosefrei 1,5%", amount: 60, calories: 28, protein: 2, carbs: 3, fat: 0 },
  { id: "pre4", meal: "Pre-Workout", food: "Protein Complex Vanilla Flavour", amount: 30, calories: 109, protein: 10, carbs: 14, fat: 2 },
  { id: "pre5", meal: "Pre-Workout", food: "Olivenöl", amount: 0, calories: 0, protein: 0, carbs: 0, fat: 0 },
  
  // Post-Workout
  { id: "post1", meal: "Post-Workout", food: "Hähnchenbrustfilet", amount: 200, calories: 220, protein: 46, carbs: 0, fat: 2 },
  { id: "post2", meal: "Post-Workout", food: "Nudeln, roh (aus Hartweizengrieß)", amount: 220, calories: 786, protein: 26, carbs: 156, fat: 3 },
  { id: "post3", meal: "Post-Workout", food: "Curryketchup", amount: 20, calories: 22, protein: 0, carbs: 5, fat: 0 },
  { id: "post4", meal: "Post-Workout", food: "Olivenöl", amount: 5, calories: 44, protein: 0, carbs: 0, fat: 5 },
  
  // Abendessen
  { id: "ab1", meal: "Abendessen", food: "Eiweißbrot mit 13% Ölsaaten", amount: 110, calories: 268, protein: 22, carbs: 13, fat: 13 },
  { id: "ab2", meal: "Abendessen", food: "Toastbrot Vollkorn", amount: 125, calories: 302, protein: 10, carbs: 57, fat: 3 },
  { id: "ab3", meal: "Abendessen", food: "Putenbrust", amount: 32, calories: 50, protein: 7, carbs: 0, fat: 0 },
  { id: "ab4", meal: "Abendessen", food: "Curryketchup", amount: 15, calories: 17, protein: 0, carbs: 4, fat: 0 },
  
  // Snacks
  { id: "sn1", meal: "Snacks", food: "Banane (ohne Schale), frisch", amount: 150, calories: 140, protein: 2, carbs: 35, fat: 0 },
  { id: "sn2", meal: "Snacks", food: "Walnüsse", amount: 30, calories: 196, protein: 5, carbs: 2, fat: 20 },
  { id: "sn3", meal: "Snacks", food: "Cashewkerne", amount: 50, calories: 288, protein: 7, carbs: 23, fat: 13 }
];

export default function NutritionView() {
  const [foods, setFoods] = useState<NutritionItem[]>([]);
  const [scale, setScale] = useState<number>(100); // percentage scaler
  const [isNutritionLoading, setIsNutritionLoading] = useState<boolean>(true);
  const [nutritionSyncStatus, setNutritionSyncStatus] = useState<"saved" | "saving" | "error">("saved");
  const [nutritionErrorMsg, setNutritionErrorMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "Frühstück" | "Pre-Workout" | "Post-Workout" | "Abendessen" | "Snacks">("all");

  // Form states for new food
  const [newMeal, setNewMeal] = useState<NutritionItem["meal"]>("Frühstück");
  const [newFood, setNewFood] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCalories, setNewCalories] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [newCarbs, setNewCarbs] = useState("");
  const [newFat, setNewFat] = useState("");

  // Load plan from Firestore on mount
  useEffect(() => {
    async function loadNutrition() {
      try {
        setIsNutritionLoading(true);
        setNutritionErrorMsg(null);
        const planDoc = await getDoc(doc(db, "nutrition", "plan"));
        if (planDoc.exists()) {
          const data = planDoc.data();
          if (data.foods) setFoods(data.foods);
          if (data.scale !== undefined) setScale(data.scale);
        } else {
          // Initialize in Firestore
          await setDoc(doc(db, "nutrition", "plan"), {
            foods: INITIAL_NUTRITION,
            scale: 100
          });
          setFoods(INITIAL_NUTRITION);
          setScale(100);
        }
        setNutritionSyncStatus("saved");
      } catch (error) {
        console.error("Error loading nutrition from Firestore:", error);
        setNutritionSyncStatus("error");
        setNutritionErrorMsg(error instanceof Error ? error.message : String(error));
        
        // Fallback to local storage if Firestore connection fails
        const saved = localStorage.getItem("gym_progression_nutrition_v2");
        if (saved) {
          try {
            setFoods(JSON.parse(saved));
          } catch (e) {
            setFoods(INITIAL_NUTRITION);
          }
        } else {
          setFoods(INITIAL_NUTRITION);
        }
        setScale(100);
      } finally {
        setIsNutritionLoading(false);
      }
    }
    loadNutrition();
  }, []);

  const isFirstRender = useRef(true);

  // Auto-sync back to Firestore on any plan modifications (debounced to save operations)
  useEffect(() => {
    if (isNutritionLoading) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const saveNutrition = async () => {
      try {
        setNutritionSyncStatus("saving");
        setNutritionErrorMsg(null);
        await setDoc(doc(db, "nutrition", "plan"), {
          foods,
          scale
        });
        setNutritionSyncStatus("saved");
        localStorage.setItem("gym_progression_nutrition_v2", JSON.stringify(foods));
      } catch (e) {
        console.error("Error saving nutrition plan to Firestore:", e);
        setNutritionSyncStatus("error");
        setNutritionErrorMsg(e instanceof Error ? e.message : String(e));
      }
    };

    const delayDebounce = setTimeout(saveNutrition, 400);
    return () => clearTimeout(delayDebounce);
  }, [foods, scale, isNutritionLoading]);

  // Reset to default spreadsheet
  const handleReset = () => {
    if (window.confirm("Möchtest du den Ernährungsplan wirklich auf die Standard-Excel-Vorlage zurücksetzen?")) {
      setFoods(INITIAL_NUTRITION);
      setScale(100);
    }
  };

  // Add new item
  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFood.trim()) return;

    const newItem: NutritionItem = {
      id: "custom_" + Date.now(),
      meal: newMeal,
      food: newFood,
      amount: parseFloat(newAmount) || 0,
      calories: parseFloat(newCalories) || 0,
      protein: parseFloat(newProtein) || 0,
      carbs: parseFloat(newCarbs) || 0,
      fat: parseFloat(newFat) || 0,
      isEaten: false
    };

    setFoods([...foods, newItem]);
    setNewFood("");
    setNewAmount("");
    setNewCalories("");
    setNewProtein("");
    setNewCarbs("");
    setNewFat("");
    setShowAddForm(false);
  };

  // Delete item
  const handleDelete = (id: string) => {
    setFoods(foods.filter(item => item.id !== id));
  };

  // Toggle item eaten status
  const toggleEaten = (id: string) => {
    setFoods(foods.map(item => item.id === id ? { ...item, isEaten: !item.isEaten } : item));
  };

  // Edit fields directly
  const handleCellChange = (id: string, field: keyof NutritionItem, value: any) => {
    setFoods(foods.map(item => {
      if (item.id === id) {
        let parsedVal = value;
        if (field === "amount" || field === "calories" || field === "protein" || field === "carbs" || field === "fat") {
          parsedVal = parseFloat(value) || 0;
        }

        // If amount changes, scale other nutrients proportionally
        if (field === "amount" && item.amount > 0 && parsedVal > 0) {
          const ratio = parsedVal / item.amount;
          return {
            ...item,
            amount: parsedVal,
            calories: parseFloat((item.calories * ratio).toFixed(1)),
            protein: parseFloat((item.protein * ratio).toFixed(1)),
            carbs: parseFloat((item.carbs * ratio).toFixed(1)),
            fat: parseFloat((item.fat * ratio).toFixed(1))
          };
        }

        return { ...item, [field]: parsedVal };
      }
      return item;
    }));
  };

  const getPortionInfo = (foodName: string) => {
    const lower = foodName.toLowerCase();
    if (lower.includes("banane")) {
      return { name: "1 Banane", size: 150, label: "+1 Banane (150g)" };
    }
    if (lower.includes("toast")) {
      return { name: "1 Scheibe", size: 25, label: "+1 Scheibe (25g)" };
    }
    if (lower.includes("eiweißbrot") || lower.includes("eiweissbrot")) {
      return { name: "1 Scheibe", size: 55, label: "+1 Scheibe (55g)" };
    }
    if (lower.includes("brot")) {
      return { name: "1 Scheibe", size: 50, label: "+1 Scheibe (50g)" };
    }
    return null;
  };

  const addOrIncrementFood = (preset: {
    food: string;
    meal: NutritionItem["meal"];
    amount: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    const existing = foods.find(
      (item) => item.food.toLowerCase().includes(preset.food.toLowerCase()) && item.meal === preset.meal
    );

    if (existing) {
      // Increment existing item
      const newAmount = existing.amount + preset.amount;
      handleCellChange(existing.id, "amount", newAmount);
    } else {
      // Add new item
      const newItem: NutritionItem = {
        id: "custom_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        meal: preset.meal,
        food: preset.food,
        amount: preset.amount,
        calories: preset.calories,
        protein: preset.protein,
        carbs: preset.carbs,
        fat: preset.fat,
        isEaten: false,
      };
      setFoods((prev) => [...prev, newItem]);
    }
  };

  const mealsList: NutritionItem["meal"][] = ["Frühstück", "Pre-Workout", "Post-Workout", "Abendessen", "Snacks"];

  // Calculate totals and subtotals (using the current scaler - ONLY carbohydrate sources scale!)
  const multiplier = scale / 100;

  const isCarbSource = (item: NutritionItem) => {
    const name = item.food.toLowerCase();
    const keywords = [
      "nudeln", "reis", "kartoffel", "haferflocken", "brot", "toast", 
      "banane", "grieß", "griess", "spaghetti", "brötchen", "broetchen", 
      "müsli", "muesli", "tortilla", "wrap", "honig", "marmelade", 
      "apfel", "obst", "gummy", "bärchen", "zucker", "cornflakes", 
      "dextrose", "maltodextrin", "beeren", "himbeer", "erdbeer", 
      "heidelbeer", "blaubeer", "nockerl", "klöße", "knoedel", "knödel"
    ];
    const matchesKeyword = keywords.some(kw => name.includes(kw));
    const totalMacros = item.protein + item.fat + item.carbs;
    const isDominantCarb = totalMacros > 0 && (item.carbs / totalMacros) > 0.45;
    return matchesKeyword || isDominantCarb;
  };

  const getScaledItem = (item: NutritionItem) => {
    if (isCarbSource(item)) {
      return {
        ...item,
        amount: item.amount * multiplier,
        protein: item.protein * multiplier,
        fat: item.fat * multiplier,
        carbs: item.carbs * multiplier,
        calories: item.calories * multiplier
      };
    }
    return {
      ...item
    };
  };

  const calculateSubtotal = (mealName: NutritionItem["meal"]) => {
    const mealItems = foods.filter(item => item.meal === mealName);
    return {
      amount: mealItems.reduce((acc, item) => acc + item.amount, 0), // unscaled
      calories: mealItems.reduce((acc, item) => acc + getScaledItem(item).calories, 0),
      protein: mealItems.reduce((acc, item) => acc + item.protein, 0), // unscaled
      carbs: mealItems.reduce((acc, item) => acc + getScaledItem(item).carbs, 0),
      fat: mealItems.reduce((acc, item) => acc + item.fat, 0) // unscaled
    };
  };

  const totalCalories = foods.reduce((acc, item) => acc + getScaledItem(item).calories, 0);
  const totalProtein = foods.reduce((acc, item) => acc + item.protein, 0); // unscaled
  const totalCarbs = foods.reduce((acc, item) => acc + getScaledItem(item).carbs, 0);
  const totalFat = foods.reduce((acc, item) => acc + item.fat, 0); // unscaled

  // Eaten portion status for dynamic tracking
  const eatenItems = foods.filter(item => item.isEaten);
  const eatenCalories = eatenItems.reduce((acc, item) => acc + getScaledItem(item).calories, 0);
  const eatenProtein = eatenItems.reduce((acc, item) => acc + item.protein, 0); // unscaled
  const eatenCarbs = eatenItems.reduce((acc, item) => acc + getScaledItem(item).carbs, 0);
  const eatenFat = eatenItems.reduce((acc, item) => acc + item.fat, 0); // unscaled

  // Macro calorie ratios
  const proteinCals = totalProtein * 4.1;
  const carbsCals = totalCarbs * 4.1;
  const fatCals = totalFat * 9.3;
  const calculatedTotalCals = proteinCals + carbsCals + fatCals;

  if (isNutritionLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-2xs">
        <Loader2 className="w-10 h-10 text-indigo-550 dark:text-indigo-500 animate-spin" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Lade Ernährungsplan...</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500">Daten werden mit Firestore synchronisiert</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Nutrition Sync Error Diagnostics */}
      {nutritionSyncStatus === "error" && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-5 rounded-2xl flex flex-col md:flex-row items-start justify-between gap-4 shadow-xs transition-colors duration-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-extrabold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Ernährungsplan-Synchronisierungsfehler</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Der Ernährungsplan konnte nicht mit Firestore abgeglichen werden. Die Änderungen werden lokal im Browser zwischengespeichert.
            </p>
            {nutritionErrorMsg && (
              <div className="text-[11px] font-mono bg-white/70 dark:bg-black/35 border border-red-150 dark:border-red-950/60 p-2.5 rounded-lg text-red-800 dark:text-red-350 select-all leading-normal">
                <strong>Fehler-Details:</strong> {nutritionErrorMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Control center & Quick summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar column containing Scale & Quick select */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dynamic Scale control & General settings */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/80 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                Plan-Skalierung (Carbs)
              </h3>
              <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-black px-2.5 py-1 rounded-lg">
                {scale}%
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Passe die Kohlenhydrate des gesamten Tages dynamisch an dein Energie- und Leistungsziel an. Proteine und Fette bleiben unberührt.
            </p>

            <div className="space-y-2">
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>50% (Defizit/Cut)</span>
                <span>100% (Standard)</span>
                <span>150% (Masse/Bulk)</span>
              </div>
            </div>

            {/* Quick scalers */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setScale(85)}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  scale === 85
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                -15% Cut
              </button>
              <button
                onClick={() => setScale(100)}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  scale === 100
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setScale(115)}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  scale === 115
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                +15% Bulk
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex-1 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-850 dark:hover:bg-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Nahrung hinzufügen
              </button>
              <button
                onClick={handleReset}
                title="Ernährungsplan zurücksetzen"
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 p-2 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Schnell-Hinzufügen (Ganze Portionen) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/80 shadow-2xs space-y-3.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                Schnell-Auswahl (Portionen)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Füge mit einem Klick eine ganze Portion zu deinem Ernährungsplan hinzu oder erhöhe die Menge.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => addOrIncrementFood({
                  food: "Banane (ohne Schale), frisch",
                  meal: "Snacks",
                  amount: 150,
                  calories: 140,
                  protein: 2,
                  carbs: 35,
                  fat: 0
                })}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🍌</span>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">1 Banane</span>
                    <span className="text-[10px] text-slate-400 font-bold">150g • Snacks</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">35g Carbs</span>
                  <span className="text-[10px] text-slate-400 font-bold">140 kcal</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => addOrIncrementFood({
                  food: "Toastbrot Vollkorn",
                  meal: "Abendessen",
                  amount: 25,
                  calories: 60,
                  protein: 2,
                  carbs: 11,
                  fat: 1
                })}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🍞</span>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">1 Scheibe Toastbrot</span>
                    <span className="text-[10px] text-slate-400 font-bold">25g • Abendessen</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">11g Carbs</span>
                  <span className="text-[10px] text-slate-400 font-bold">60 kcal</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => addOrIncrementFood({
                  food: "Eiweißbrot mit 13% Ölsaaten",
                  meal: "Abendessen",
                  amount: 55,
                  calories: 134,
                  protein: 11,
                  carbs: 6.5,
                  fat: 6.5
                })}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🍞</span>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">1 Scheibe Eiweißbrot</span>
                    <span className="text-[10px] text-slate-400 font-bold">55g • Abendessen</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">6.5g Carbs</span>
                  <span className="text-[10px] text-slate-400 font-bold">134 kcal</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Nutritional values summary (Total plan vs logged eaten foods) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-150 dark:border-slate-700/80 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Calorie Dial Card */}
          <div className="md:col-span-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl flex flex-col justify-between border border-slate-100 dark:border-slate-700/50">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">Gesamt-Energie</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {Math.round(totalCalories).toLocaleString("de-DE")} <span className="text-xs font-medium">kcal</span>
              </p>
            </div>
            {eatenCalories > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>Gegessen:</span>
                  <span>{Math.round(eatenCalories)} kcal ({Math.round((eatenCalories / totalCalories) * 100)}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min((eatenCalories / totalCalories) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Sollwert laut Excel
            </div>
          </div>

          {/* Protein progress card */}
          <div className="md:col-span-1 bg-emerald-50/40 dark:bg-emerald-950/10 p-4 rounded-xl flex flex-col justify-between border border-emerald-100/60 dark:border-emerald-900/30">
            <div>
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">Proteine</p>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                  {Math.round(totalProtein * 4.1)} kcal
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {Math.round(totalProtein)} <span className="text-xs font-medium text-slate-500">g</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                <span>Ist: {Math.round(eatenProtein)}g</span>
                <span>Anteil: {calculatedTotalCals > 0 ? Math.round((proteinCals / calculatedTotalCals) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200/60 dark:bg-slate-850 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${calculatedTotalCals > 0 ? (proteinCals / calculatedTotalCals) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Carbs progress card */}
          <div className="md:col-span-1 bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-xl flex flex-col justify-between border border-amber-100/60 dark:border-amber-900/30">
            <div>
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">Carbs</p>
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  {Math.round(totalCarbs * 4.1)} kcal
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {Math.round(totalCarbs)} <span className="text-xs font-medium text-slate-500">g</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                <span>Ist: {Math.round(eatenCarbs)}g</span>
                <span>Anteil: {calculatedTotalCals > 0 ? Math.round((carbsCals / calculatedTotalCals) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200/60 dark:bg-slate-850 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${calculatedTotalCals > 0 ? (carbsCals / calculatedTotalCals) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Fat progress card */}
          <div className="md:col-span-1 bg-rose-50/40 dark:bg-rose-950/10 p-4 rounded-xl flex flex-col justify-between border border-rose-100/60 dark:border-rose-900/30">
            <div>
              <div className="flex justify-between items-start">
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider">Fette</p>
                <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded">
                  {Math.round(totalFat * 9.3)} kcal
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {Math.round(totalFat)} <span className="text-xs font-medium text-slate-500">g</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                <span>Ist: {Math.round(eatenFat)}g</span>
                <span>Anteil: {calculatedTotalCals > 0 ? Math.round((fatCals / calculatedTotalCals) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-200/60 dark:bg-slate-850 h-1 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${calculatedTotalCals > 0 ? (fatCals / calculatedTotalCals) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Add custom food item dialog overlay or collapse panel */}
      {showAddForm && (
        <form onSubmit={handleAddFood} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
              <ShoppingBag className="w-4.5 h-4.5 text-indigo-500" />
              Neues Lebensmittel hinzufügen
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Abbrechen
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <div className="md:col-span-1">
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Mahlzeit</label>
              <select
                value={newMeal}
                onChange={(e) => setNewMeal(e.target.value as NutritionItem["meal"])}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                {mealsList.map(meal => (
                  <option key={meal} value={meal}>{meal}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Name des Lebensmittels</label>
              <input
                type="text"
                placeholder="z.B. Eier, Avocado, Whey..."
                value={newFood}
                onChange={(e) => setNewFood(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Menge (g)</label>
              <input
                type="number"
                placeholder="20"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Kalorien (kcal)</label>
              <input
                type="number"
                placeholder="100"
                value={newCalories}
                onChange={(e) => setNewCalories(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Proteine (g)</label>
              <input
                type="number"
                placeholder="15"
                value={newProtein}
                onChange={(e) => setNewProtein(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Carbs (g)</label>
              <input
                type="number"
                placeholder="10"
                value={newCarbs}
                onChange={(e) => setNewCarbs(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Fette (g)</label>
              <input
                type="number"
                placeholder="2"
                value={newFat}
                onChange={(e) => setNewFat(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      )}

      {/* 3. The Spreadsheet Visual Layout */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        
        {/* Table Filters for quick view */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-slate-900 dark:bg-indigo-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Gesamter Tag
            </button>
            {mealsList.map(meal => (
              <button
                key={meal}
                onClick={() => setActiveTab(meal)}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  activeTab === meal
                    ? "bg-slate-900 dark:bg-indigo-600 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {meal}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Werte direkt anklickbar zum Editieren
          </div>
        </div>

        {/* The Spreadsheet Itself */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-50 dark:bg-slate-950 dark:text-slate-200 border-b border-slate-800 font-display uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4 w-32">Mahlzeit</th>
                <th className="py-3 px-4 min-w-[200px]">Lebensmittel / Zutat</th>
                <th className="py-3 px-4 text-right w-28">Menge (g)</th>
                <th className="py-3 px-4 text-right w-28">Kalorien</th>
                <th className="py-3 px-4 text-right w-28">Proteine</th>
                <th className="py-3 px-4 text-right w-28">Carbs</th>
                <th className="py-3 px-4 text-right w-28">Fette</th>
                <th className="py-3 px-3 text-center w-12">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              {mealsList.map(mealName => {
                // If filter is active and doesn't match, skip rendering this section
                if (activeTab !== "all" && activeTab !== mealName) return null;

                const mealItems = foods.filter(item => item.meal === mealName);
                const subtotal = calculateSubtotal(mealName);

                return (
                  <React.Fragment key={mealName}>
                    {mealItems.map((item) => {
                      const isEditing = editingId === item.id;
                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors ${
                            item.isEaten 
                              ? "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] text-slate-400 dark:text-slate-500 line-through" 
                              : "text-slate-750 dark:text-slate-200"
                          }`}
                        >
                          {/* Checked as consumed checkbox */}
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => toggleEaten(item.id)}
                              title={item.isEaten ? "Als nicht gegessen markieren" : "Als gegessen markieren"}
                              className={`w-5.5 h-5.5 rounded-md border flex items-center justify-center transition-all cursor-pointer mx-auto ${
                                item.isEaten
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-transparent"
                              }`}
                            >
                              {item.isEaten && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </td>

                          {/* Meal column */}
                          <td className="py-2.5 px-4 font-bold text-[10px] tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                            {item.meal}
                          </td>

                          {/* Food description */}
                          <td className="py-2.5 px-4 font-medium">
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
                                value={item.food}
                                onChange={(e) => handleCellChange(item.id, "food", e.target.value)}
                              />
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 group">
                                <span className="truncate max-w-[220px] sm:max-w-[300px]">{item.food}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button 
                                    onClick={() => setEditingId(item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity cursor-pointer"
                                    title="Bearbeiten"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  {(() => {
                                    const portion = getPortionInfo(item.food);
                                    if (!portion) return null;
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newAmount = item.amount + portion.size;
                                          handleCellChange(item.id, "amount", newAmount);
                                        }}
                                        className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30 transition-all cursor-pointer inline-flex items-center gap-0.5 shadow-3xs shrink-0"
                                        title={`${portion.name} (${portion.size}g) hinzufügen`}
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        {portion.label}
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Menge in grams */}
                          <td className="py-2.5 px-4 text-right font-mono font-medium">
                            {isEditing ? (
                              <input
                                type="number"
                                className="w-20 ml-auto bg-slate-100 dark:bg-slate-900 border-none rounded px-2 py-1 text-xs text-right font-bold focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
                                value={item.amount}
                                onChange={(e) => handleCellChange(item.id, "amount", e.target.value)}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingId(item.id)}
                                className="hover:bg-slate-100 dark:hover:bg-slate-700/50 px-1 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                {Math.round(getScaledItem(item).amount)} g
                              </span>
                            )}
                          </td>

                          {/* Calories */}
                          <td className="py-2.5 px-4 text-right font-mono text-slate-800 dark:text-slate-100 font-semibold">
                            {isEditing ? (
                              <input
                                type="number"
                                className="w-20 ml-auto bg-slate-100 dark:bg-slate-900 border-none rounded px-2 py-1 text-xs text-right font-bold focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
                                value={item.calories}
                                onChange={(e) => handleCellChange(item.id, "calories", e.target.value)}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingId(item.id)}
                                className="hover:bg-slate-100 dark:hover:bg-slate-700/50 px-1 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                {Math.round(getScaledItem(item).calories)} kcal
                              </span>
                            )}
                          </td>

                          {/* Protein */}
                          <td className="py-2.5 px-4 text-right font-mono">
                            {isEditing ? (
                              <input
                                type="number"
                                className="w-20 ml-auto bg-slate-100 dark:bg-slate-900 border-none rounded px-2 py-1 text-xs text-right font-bold focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
                                value={item.protein}
                                onChange={(e) => handleCellChange(item.id, "protein", e.target.value)}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingId(item.id)}
                                className="text-emerald-600 dark:text-emerald-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700/50 px-1 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                {Math.round(getScaledItem(item).protein)} g
                              </span>
                            )}
                          </td>

                          {/* Carbs */}
                          <td className="py-2.5 px-4 text-right font-mono">
                            {isEditing ? (
                              <input
                                type="number"
                                className="w-20 ml-auto bg-slate-100 dark:bg-slate-900 border-none rounded px-2 py-1 text-xs text-right font-bold focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
                                value={item.carbs}
                                onChange={(e) => handleCellChange(item.id, "carbs", e.target.value)}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingId(item.id)}
                                className="text-amber-600 dark:text-amber-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700/50 px-1 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                {Math.round(getScaledItem(item).carbs)} g
                              </span>
                            )}
                          </td>

                          {/* Fats */}
                          <td className="py-2.5 px-4 text-right font-mono">
                            {isEditing ? (
                              <input
                                type="number"
                                className="w-20 ml-auto bg-slate-100 dark:bg-slate-900 border-none rounded px-2 py-1 text-xs text-right font-bold focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 outline-none"
                                value={item.fat}
                                onChange={(e) => handleCellChange(item.id, "fat", e.target.value)}
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingId(item.id)}
                                className="text-rose-600 dark:text-rose-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700/50 px-1 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                {Math.round(getScaledItem(item).fat)} g
                              </span>
                            )}
                          </td>

                          {/* Save/Edit toggles & Delete */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing ? (
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors cursor-pointer"
                                  title="Änderung speichern"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1 text-slate-350 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                                  title="Lebensmittel löschen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Meal Subtotal Row (Zwischensumme) as requested */}
                    {mealItems.length > 0 && (
                      <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200">
                        <td colSpan={2} className="py-3 px-4 font-black uppercase text-[10px] tracking-wide text-slate-500">
                          {mealName}
                        </td>
                        <td className="py-3 px-4 italic text-slate-400">
                          Zwischensumme {mealName}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          -
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-100 font-black">
                          {Math.round(subtotal.calories).toLocaleString("de-DE")} kcal
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                          {Math.round(subtotal.protein)} g
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-black">
                          {Math.round(subtotal.carbs)} g
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-black">
                          {Math.round(subtotal.fat)} g
                        </td>
                        <td className="py-3 px-3"></td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* TAGESGESAMT (Grand Total) matching the Excel exactly */}
              {activeTab === "all" && (
                <tr className="bg-indigo-50/50 dark:bg-slate-950 font-black border-t-2 border-slate-900 dark:border-indigo-500 text-slate-900 dark:text-white uppercase text-xs">
                  <td colSpan={2} className="py-4 px-4 tracking-wider font-extrabold text-[11px] text-indigo-600 dark:text-indigo-400">
                    TAGESGESAMT
                  </td>
                  <td className="py-4 px-4 italic text-slate-400 dark:text-slate-500">
                    Tagesbudget inkl. Skalierung
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-slate-400 dark:text-slate-500">
                    -
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-lg font-black text-slate-950 dark:text-slate-100">
                    {Math.round(totalCalories).toLocaleString("de-DE")} kcal
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {Math.round(totalProtein)} g
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                    {Math.round(totalCarbs)} g
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                    {Math.round(totalFat)} g
                  </td>
                  <td className="py-4 px-3"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table summary info footer */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 dark:text-slate-500 font-bold gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full" />
            <span>Skalierungsfaktor: x{(scale / 100).toFixed(2)}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Proteinanteil am Brennwert: {calculatedTotalCals > 0 ? Math.round((proteinCals / calculatedTotalCals) * 100) : 0}%</span>
          </div>
          <div>
            <span>Aktuelle Erfassung wird automatisch lokal gesichert.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
