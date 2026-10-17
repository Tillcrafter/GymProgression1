import { WeekPlan, DayPlan, GymTableRow, CardioTableRow, NutritionTableRow, WeightRow } from "./types";

/**
 * Returns the day ID ('mo', 'di', 'mi', 'do', 'fr', 'sa', 'so') matching today's weekday.
 */
export function getTodayDayId(): string {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const map: { [key: number]: string } = {
    0: "so",
    1: "mo",
    2: "di",
    3: "mi",
    4: "do",
    5: "fr",
    6: "sa",
  };
  return map[day] || "mo";
}

/**
 * Computes calendar dates (e.g. "12.10.", "13.10.") for each day of the current calendar week.
 */
export function getCurrentWeekDates(baseDate: Date = new Date()): { [dayId: string]: string } {
  const now = new Date(baseDate);
  const dayOfWeek = now.getDay();
  // Monday as start of week in Germany
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const dayIds = ["mo", "di", "mi", "do", "fr", "sa", "so"];
  const dates: { [key: string]: string } = {};

  dayIds.forEach((id, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    dates[id] = `${day}.${month}.`;
  });

  return dates;
}

// ---------------------------------------------------------
// GYM WORKOUTS (Training Training Rest Repeat Split)
// ---------------------------------------------------------

/**
 * Workout 1: Brust / Rücken (+ RDL & Leg Curl)
 * Plan: Latzug 2, Incline Bench smith 3, upper back row 3, butterfly 2, sa lat highrow 2, rdl 1, leg curl 2
 */
export function getBrustRueckenGymRows(): GymTableRow[] {
  return [
    { id: "g_br1", name: "Latzug", setsAndWeight: "2 Sätze", notes: "2 Arbeitssätze, voller Lat-Stretch" },
    { id: "g_br2", name: "Incline Bench smith", setsAndWeight: "3 Sätze", notes: "Multipresse Schrägbank, Fokus obere Brust" },
    { id: "g_br3", name: "Upper back row", setsAndWeight: "3 Sätze", notes: "Oberer Rücken Rudern, Ellbogen 45-60°" },
    { id: "g_br4", name: "Butterfly", setsAndWeight: "2 Sätze", notes: "Dehnung & 1s Peak Contraction" },
    { id: "g_br5", name: "SA Lat highrow", setsAndWeight: "2 Sätze", notes: "Single Arm Lat Highrow, diagonaler Zug" },
    { id: "g_br6", name: "RDL", setsAndWeight: "1 Satz", notes: "Romanian Deadlift, 1 schwerer Top-Satz" },
    { id: "g_br7", name: "Leg curl", setsAndWeight: "2 Sätze", notes: "Beinbeuger sitzend/liegend, kontrolliert" },
  ];
}

/**
 * Workout 2: Arme / Schultern
 * Plan: Schulterdrücken KH 2, Seitheben 3, Preacher curl 3, Pushdowns 3, Hammer curl 2, Reverse curl 1
 */
export function getArmeSchulternGymRows(): GymTableRow[] {
  return [
    { id: "g_as1", name: "Schulterdrücken KH", setsAndWeight: "2 Sätze", notes: "Kurzhanteln, saubere Stabilität" },
    { id: "g_as2", name: "Seitheben", setsAndWeight: "3 Sätze", notes: "Seitliche Schulter, kontrolliert heben" },
    { id: "g_as3", name: "Preacher curl", setsAndWeight: "3 Sätze", notes: "Bizeps Isolation, voller Bewegungsradius" },
    { id: "g_as4", name: "Pushdowns", setsAndWeight: "3 Sätze", notes: "Kabel Trizepsdrücken, 1s Pause unten" },
    { id: "g_as5", name: "Hammer curl", setsAndWeight: "2 Sätze", notes: "Brachialis & Unterarme" },
    { id: "g_as6", name: "Reverse curl", setsAndWeight: "1 Satz", notes: "Unterarme & Oberarmbeuger" },
  ];
}

/**
 * Workout 3: Restday (Kein Krafttraining – Laufen im Cardio-Tab)
 */
export function getRestdayGymRows(): GymTableRow[] {
  return [
    { id: "g_rd1", name: "Restday (Erholung / Mobility)", setsAndWeight: "Pause", notes: "Heute kein Krafttraining – Laufen im Cardio-Tab!" },
  ];
}

// ---------------------------------------------------------
// CARDIO / LAUFEN
// ---------------------------------------------------------

/**
 * Cardio an Restdays: Laufen
 */
export function getRestdayCardioRows(): CardioTableRow[] {
  return [
    { id: "c_rd1", activity: "Laufen (Restday Run)", duration: "30 - 45 min", intensity: "Zone 2 Grundlagenausdauer", steps: "6.000 - 8.000", calories: "350 kcal", notes: "Lockeres Laufen am Erholungstag" },
    { id: "c_rd2", activity: "Alltags-Schritte", duration: "Tagesziel", intensity: "Moderat", steps: "10.000", calories: "350 kcal", notes: "Tagesziel" },
  ];
}

/**
 * Cardio an Trainingstagen
 */
export function getTrainingDayCardioRows(): CardioTableRow[] {
  return [
    { id: "c_tr1", activity: "Incline Treadmill Walk", duration: "15 - 20 min", intensity: "Steigung 10%, Speed 4.8 km/h", steps: "2.500", calories: "160 kcal", notes: "Cool-down nach dem Workout" },
    { id: "c_tr2", activity: "Alltags-Schritte", duration: "Tagesziel", intensity: "Moderat", steps: "10.000", calories: "350 kcal", notes: "Tagesziel" },
  ];
}

// ---------------------------------------------------------
// ERNÄHRUNGSPLAN (Exakt wie vom Nutzer vorgegeben)
// ---------------------------------------------------------

/**
 * Exakter geprüfter Ernährungsplan:
 * Frühstück (486 kcal, 30g P, 53g KH, 16g F)
 * Pre-Workout (465 kcal, 32g P, 73g KH, 3g F)
 * Post-Workout (1.260 kcal, 80g P, 195g KH, 12g F)
 * Abendessen (562 kcal, 37g P, 63g KH, 16g F)
 * Snacks (543 kcal, 13g P, 43g KH, 36g F)
 * TAGESGESAMT: 3.316 kcal | 192g P | 427g KH | 83g F
 */
export function getInitialNutritionRows(): NutritionTableRow[] {
  return [
    // 1. Frühstück (Zwischensumme: 486 kcal | 30 g P | 53 g KH | 16 g F)
    { 
      id: "nut_f1", 
      meal: "Frühstück", 
      food: "Honig", 
      amount: "20 g", 
      calories: 62, 
      protein: 0, 
      carbs: 16, 
      fat: 0, 
      notes: "",
      per100g: { calories: 310, protein: 0, carbs: 80, fat: 0 }
    },
    { 
      id: "nut_f2", 
      meal: "Frühstück", 
      food: "Haferflocken", 
      amount: "50 g", 
      calories: 186, 
      protein: 6, 
      carbs: 29, 
      fat: 4, 
      notes: "",
      per100g: { calories: 372, protein: 12, carbs: 58, fat: 8 }
    },
    { 
      id: "nut_f3", 
      meal: "Frühstück", 
      food: "Magerquark", 
      amount: "200 g", 
      calories: 132, 
      protein: 24, 
      carbs: 8, 
      fat: 0, 
      notes: "",
      per100g: { calories: 66, protein: 12, carbs: 4, fat: 0 }
    },
    { 
      id: "nut_f4", 
      meal: "Frühstück", 
      food: "Olivenöl", 
      amount: "12 g", 
      calories: 106, 
      protein: 0, 
      carbs: 0, 
      fat: 12, 
      notes: "",
      per100g: { calories: 883, protein: 0, carbs: 0, fat: 100 }
    },

    // 2. Pre-Workout (Zwischensumme: 465 kcal | 32 g P | 73 g KH | 3 g F)
    { 
      id: "nut_pre1", 
      meal: "Pre-Workout", 
      food: "ESN Rice Pudding", 
      amount: "85 g", 
      calories: 317, 
      protein: 7, 
      carbs: 68, 
      fat: 1, 
      notes: "",
      per100g: { calories: 373, protein: 8.2, carbs: 80, fat: 1.2 }
    },
    { 
      id: "nut_pre2", 
      meal: "Pre-Workout", 
      food: "Milch 1,5 %", 
      amount: "70 g", 
      calories: 33, 
      protein: 2, 
      carbs: 3, 
      fat: 0, 
      notes: "",
      per100g: { calories: 47, protein: 2.9, carbs: 4.3, fat: 0 }
    },
    { 
      id: "nut_pre3", 
      meal: "Pre-Workout", 
      food: "ESN Basic Whey", 
      amount: "30 g", 
      calories: 115, 
      protein: 23, 
      carbs: 2, 
      fat: 2, 
      notes: "",
      per100g: { calories: 383, protein: 76.7, carbs: 6.7, fat: 6.7 }
    },

    // 3. Post-Workout (Zwischensumme: 1.260 kcal | 80 g P | 195 g KH | 12 g F)
    { 
      id: "nut_post1", 
      meal: "Post-Workout", 
      food: "Hähnchenbrust, roh", 
      amount: "200 g", 
      calories: 220, 
      protein: 46, 
      carbs: 0, 
      fat: 2, 
      notes: "",
      per100g: { calories: 110, protein: 23, carbs: 0, fat: 1 }
    },
    { 
      id: "nut_post2", 
      meal: "Post-Workout", 
      food: "Nudeln, roh", 
      amount: "250 g", 
      calories: 893, 
      protein: 30, 
      carbs: 177, 
      fat: 4, 
      notes: "",
      per100g: { calories: 357, protein: 12, carbs: 70.8, fat: 1.6 }
    },
    { 
      id: "nut_post3", 
      meal: "Post-Workout", 
      food: "Curryketchup", 
      amount: "30 g", 
      calories: 33, 
      protein: 0, 
      carbs: 8, 
      fat: 0, 
      notes: "",
      per100g: { calories: 110, protein: 0, carbs: 26.7, fat: 0 }
    },
    { 
      id: "nut_post4", 
      meal: "Post-Workout", 
      food: "TK-Gemüse", 
      amount: "200 g", 
      calories: 70, 
      protein: 4, 
      carbs: 10, 
      fat: 1, 
      notes: "",
      per100g: { calories: 35, protein: 2, carbs: 5, fat: 0.5 }
    },
    { 
      id: "nut_post5", 
      meal: "Post-Workout", 
      food: "Olivenöl", 
      amount: "5 g", 
      calories: 44, 
      protein: 0, 
      carbs: 0, 
      fat: 5, 
      notes: "",
      per100g: { calories: 880, protein: 0, carbs: 0, fat: 100 }
    },

    // 4. Abendessen (Zwischensumme: 562 kcal | 37 g P | 63 g KH | 16 g F)
    { 
      id: "nut_ab1", 
      meal: "Abendessen", 
      food: "Eiweißbrot", 
      amount: "110 g", 
      calories: 268, 
      protein: 22, 
      carbs: 13, 
      fat: 13, 
      notes: "",
      per100g: { calories: 244, protein: 20, carbs: 11.8, fat: 11.8 }
    },
    { 
      id: "nut_ab2", 
      meal: "Abendessen", 
      food: "Vollkorntoast", 
      amount: "100 g", 
      calories: 241, 
      protein: 8, 
      carbs: 45, 
      fat: 3, 
      notes: "",
      per100g: { calories: 241, protein: 8, carbs: 45, fat: 3 }
    },
    { 
      id: "nut_ab3", 
      meal: "Abendessen", 
      food: "Putenbrust", 
      amount: "30 g", 
      calories: 30, 
      protein: 7, 
      carbs: 0, 
      fat: 0, 
      notes: "",
      per100g: { calories: 100, protein: 23.3, carbs: 0, fat: 0 }
    },
    { 
      id: "nut_ab4", 
      meal: "Abendessen", 
      food: "Curryketchup", 
      amount: "20 g", 
      calories: 23, 
      protein: 0, 
      carbs: 5, 
      fat: 0, 
      notes: "",
      per100g: { calories: 115, protein: 0, carbs: 25, fat: 0 }
    },

    // 5. Snacks (Zwischensumme: 543 kcal | 13 g P | 43 g KH | 36 g F)
    { 
      id: "nut_sn1", 
      meal: "Snacks", 
      food: "Banane", 
      amount: "100 g", 
      calories: 93, 
      protein: 1, 
      carbs: 23, 
      fat: 0, 
      notes: "",
      per100g: { calories: 93, protein: 1, carbs: 23, fat: 0 }
    },
    { 
      id: "nut_sn2", 
      meal: "Snacks", 
      food: "Nussmix", 
      amount: "75 g", 
      calories: 450, 
      protein: 12, 
      carbs: 20, 
      fat: 36, 
      notes: "",
      per100g: { calories: 600, protein: 16, carbs: 26.7, fat: 48 }
    },
  ];
}



// ---------------------------------------------------------
// GEWICHTSTRACK (Tägliches Wiegen für die Woche)
// ---------------------------------------------------------

export function getInitialWeightRows(): WeightRow[] {
  const dates = getCurrentWeekDates();
  return [
    { id: "w_mo", shortDay: "MO", dayLabel: "Montag", date: dates.mo || "12.10.", weight: 78.4, time: "Nüchtern", notes: "Start der Woche" },
    { id: "w_di", shortDay: "DI", dayLabel: "Dienstag", date: dates.di || "13.10.", weight: 78.6, time: "Nüchtern", notes: "" },
    { id: "w_mi", shortDay: "MI", dayLabel: "Mittwoch", date: dates.mi || "14.10.", weight: 78.2, time: "Nüchtern", notes: "Restday / Laufen" },
    { id: "w_do", shortDay: "DO", dayLabel: "Donnerstag", date: dates.do || "15.10.", weight: 78.5, time: "Nüchtern", notes: "" },
    { id: "w_fr", shortDay: "FR", dayLabel: "Freitag", date: dates.fr || "16.10.", weight: 78.1, time: "Nüchtern", notes: "" },
    { id: "w_sa", shortDay: "SA", dayLabel: "Samstag", date: dates.sa || "17.10.", weight: 78.3, time: "08:15", notes: "Restday / Laufen" },
    { id: "w_so", shortDay: "SO", dayLabel: "Sonntag", date: dates.so || "18.10.", weight: 78.0, time: "08:30", notes: "Wochenabschluss" },
  ];
}

// ---------------------------------------------------------
// NORMALIZATION & FULL WEEK PLAN
// ---------------------------------------------------------

const STANDARD_DAY_CONFIGS: {
  id: string;
  label: string;
  name: string;
  focusTitle: string;
  getGym: () => GymTableRow[];
  getCardio: () => CardioTableRow[];
}[] = [
  { id: "mo", label: "MO", name: "Montag", focusTitle: "BRUST / RÜCKEN (TRAINING 1)", getGym: getBrustRueckenGymRows, getCardio: getTrainingDayCardioRows },
  { id: "di", label: "DI", name: "Dienstag", focusTitle: "ARME / SCHULTERN (TRAINING 2)", getGym: getArmeSchulternGymRows, getCardio: getTrainingDayCardioRows },
  { id: "mi", label: "MI", name: "Mittwoch", focusTitle: "RESTDAY (LAUFEN & ERHOLUNG)", getGym: getRestdayGymRows, getCardio: getRestdayCardioRows },
  { id: "do", label: "DO", name: "Donnerstag", focusTitle: "BRUST / RÜCKEN (TRAINING 1)", getGym: getBrustRueckenGymRows, getCardio: getTrainingDayCardioRows },
  { id: "fr", label: "FR", name: "Freitag", focusTitle: "ARME / SCHULTERN (TRAINING 2)", getGym: getArmeSchulternGymRows, getCardio: getTrainingDayCardioRows },
  { id: "sa", label: "SA", name: "Samstag", focusTitle: "RESTDAY (LAUFEN & ERHOLUNG)", getGym: getRestdayGymRows, getCardio: getRestdayCardioRows },
  { id: "so", label: "SO", name: "Sonntag", focusTitle: "BRUST / RÜCKEN (TRAINING 1)", getGym: getBrustRueckenGymRows, getCardio: getTrainingDayCardioRows },
];

export function normalizeDayPlan(day: any, dayIdx: number = 0): DayPlan {
  const config = STANDARD_DAY_CONFIGS[dayIdx % 7];
  const weekDates = getCurrentWeekDates();

  // Determine matching dayId
  let id = (day?.id || "").toLowerCase().trim();
  if (id === "montag" || id === "d1") id = "mo";
  else if (id === "dienstag" || id === "d2") id = "di";
  else if (id === "mittwoch" || id === "d3") id = "mi";
  else if (id === "donnerstag" || id === "d4") id = "do";
  else if (id === "freitag" || id === "d5") id = "fr";
  else if (id === "samstag" || id === "d6") id = "sa";
  else if (id === "sonntag" || id === "d7") id = "so";

  if (!["mo", "di", "mi", "do", "fr", "sa", "so"].includes(id)) {
    id = config.id;
  }

  // Find matching standard config for this id
  const matchedConfig = STANDARD_DAY_CONFIGS.find((c) => c.id === id) || config;

  // Process Gym rows
  let gymRows: GymTableRow[] = [];
  if (Array.isArray(day?.gymRows) && day.gymRows.length > 0) {
    gymRows = day.gymRows.map((r: any, idx: number) => {
      const setsAndWeight =
        r.setsAndWeight ||
        r.details ||
        (r.weight && r.reps ? `${String(r.weight).replace(" kg", "").trim()}x${String(r.reps).trim()}` : "") ||
        "3 Sätze";
      return {
        id: r.id || `g_${id}_${idx}`,
        name: r.name || "",
        setsAndWeight,
        notes: r.notes || "",
      };
    });
  }

  // If gym rows are empty, check if we need standard fallback or if it's an intentionally open/sick day
  const isOldMockExercises = gymRows.some((r) =>
    r.name.includes("Bankdrücken LH") ||
    r.name.includes("Kniebeugen") ||
    r.name.includes("Kreuzheben konventionell")
  );

  const isSickOrOpen = 
    (day?.focusTitle || "").toUpperCase().includes("KRANK") ||
    (day?.focusTitle || "").toUpperCase().includes("SCHONUNG") ||
    (day?.focusTitle || "").toUpperCase().includes("PAUSE") ||
    (day?.focusTitle || "").toUpperCase().includes("OFFEN") ||
    (day?.focusTitle || "").toUpperCase().includes("NOCH KEIN TRAINING");

  if (isOldMockExercises || (gymRows.length === 0 && !isSickOrOpen)) {
    gymRows = matchedConfig.getGym();
  }

  // Process Cardio rows
  let cardioRows: CardioTableRow[] = [];
  if (Array.isArray(day?.cardioRows) && day.cardioRows.length > 0) {
    cardioRows = day.cardioRows.map((r: any, idx: number) => ({
      id: r.id || `c_${id}_${idx}`,
      activity: r.activity || "Cardio",
      duration: r.duration || "20 min",
      intensity: r.intensity || "Moderat",
      steps: r.steps || "3.000",
      calories: r.calories || "150 kcal",
      notes: r.notes || "",
    }));
  } else {
    cardioRows = matchedConfig.getCardio();
  }

  // Process Nutrition rows
  let nutritionRows: NutritionTableRow[] = [];
  if (Array.isArray(day?.nutritionRows) && day.nutritionRows.length > 0) {
    nutritionRows = day.nutritionRows.map((r: any, idx: number) => ({
      id: r.id || `n_${id}_${idx}`,
      meal: r.meal || "Snacks",
      food: r.food || "",
      amount: r.amount || "100g",
      calories: r.calories === "" || r.calories === undefined || r.calories === null ? "" : r.calories,
      protein: r.protein === "" || r.protein === undefined || r.protein === null ? "" : r.protein,
      carbs: r.carbs === "" || r.carbs === undefined || r.carbs === null ? "" : r.carbs,
      fat: r.fat === "" || r.fat === undefined || r.fat === null ? "" : r.fat,
      notes: r.notes || "",
      per100g: r.per100g,
    }));
  }


  // Fallback to default initial meal plan only if entirely empty
  if (nutritionRows.length === 0) {
    nutritionRows = getInitialNutritionRows();
  }

  // Preserve user custom focusTitle if present
  const focusTitle = (typeof day?.focusTitle === "string" && day.focusTitle.trim().length > 0)
    ? day.focusTitle.trim()
    : matchedConfig.focusTitle;

  return {
    id: matchedConfig.id,
    label: matchedConfig.label,
    name: matchedConfig.name,
    date: day?.date || weekDates[matchedConfig.id] || "",
    focusTitle,
    gymRows,
    cardioRows,
    nutritionRows,
  };
}

export function normalizeWeekPlan(week: any): WeekPlan {
  const weekDates = getCurrentWeekDates();

  // Ensure exactly 7 days (mo through so)
  const days: DayPlan[] = STANDARD_DAY_CONFIGS.map((config, idx) => {
    let rawDay: any = null;
    if (Array.isArray(week?.days)) {
      rawDay = week.days.find((d: any) => {
        const dId = (d?.id || "").toLowerCase().trim();
        return dId === config.id || dId === config.name.toLowerCase();
      }) || week.days[idx];
    }
    const normalized = normalizeDayPlan(rawDay, idx);
    normalized.date = weekDates[normalized.id] || normalized.date || "";
    return normalized;
  });

  const weightRows = Array.isArray(week?.weightRows) && week.weightRows.length > 0
    ? week.weightRows.map((r: any, idx: number) => ({
        id: r.id || `w_${idx}`,
        dayLabel: r.dayLabel || ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"][idx] || "Tag",
        shortDay: r.shortDay || ["MO", "DI", "MI", "DO", "FR", "SA", "SO"][idx] || "TG",
        date: r.date || weekDates[["mo", "di", "mi", "do", "fr", "sa", "so"][idx]] || "",
        weight: r.weight === "" || r.weight === undefined || r.weight === null ? "" : r.weight,
        time: r.time || "Nüchtern",
        notes: r.notes || "",
      }))
    : getInitialWeightRows();

  return {
    id: week?.id || "woche_1",
    name: week?.name || "Woche 1",
    phase: week?.phase || "AUFBAU",
    days,
    weightRows,
  };
}

/**
 * Erzeugt die Woche nach dem Trainingsprinzip:
 * Training (Brust/Rücken) - Training (Arme/Schultern) - Rest (Laufen) - Repeat!
 */
export const getInitialWeek = (): WeekPlan => {
  const dates = getCurrentWeekDates();

  return {
    id: "woche_1",
    name: "Woche 1",
    phase: "AUFBAU",
    weightRows: getInitialWeightRows(),
    days: STANDARD_DAY_CONFIGS.map((c) => ({
      id: c.id,
      label: c.label,
      name: c.name,
      date: dates[c.id] || "",
      focusTitle: c.focusTitle,
      gymRows: c.getGym(),
      cardioRows: c.getCardio(),
      nutritionRows: getInitialNutritionRows(),
    })),
  };
};

export const createNewWeekPlan = (weekNumber: number, previousWeek?: WeekPlan): WeekPlan => {
  const base = previousWeek || getInitialWeek();
  const dates = getCurrentWeekDates();

  return {
    id: `woche_${weekNumber}`,
    name: `Woche ${weekNumber}`,
    phase: base.phase,
    weightRows: getInitialWeightRows().map((r, i) => ({
      ...r,
      id: `w${weekNumber}_${i}`,
      weight: "",
    })),
    days: base.days.map((d) => ({
      ...d,
      date: dates[d.id] || d.date || "",
      gymRows: d.gymRows.map((r) => ({ ...r, id: `w${weekNumber}_${r.id}_${Math.random().toString(36).substring(2, 6)}` })),
      cardioRows: d.cardioRows.map((r) => ({ ...r, id: `w${weekNumber}_${r.id}_${Math.random().toString(36).substring(2, 6)}` })),
      nutritionRows: d.nutritionRows.map((r) => ({ ...r, id: `w${weekNumber}_${r.id}_${Math.random().toString(36).substring(2, 6)}` })),
    })),
  };
};

/**
 * Strips all undefined fields recursively so Firestore never throws unsupported field value error
 */
export function sanitizeForFirestore(data: any): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  }
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      res[k] = sanitizeForFirestore(v);
    }
  }
  return res;
}

export const cloneWeekStructure = (week: any, num?: number) => week;
