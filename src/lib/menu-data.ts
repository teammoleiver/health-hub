// ── Types ──

export interface MealItem {
  type: string;
  typeEs: string;
  items: string;
  imageUrl: string;
  whyExplanation: string;
  nutritionExplanation: string;
  liverBenefit: string;
  timingReason: string;
  calories: number;
  keyNutrients: string[];
  timeWindow: string;
  timingUrgency: "normal" | "warn";
}

export interface DayMenu {
  day: number;
  label: string;
  labelEs: string;
  isTrainingDay: boolean;
  isFreeDay: boolean;
  meals: MealItem[];
}

export interface MenuVersion {
  id: "v1" | "v2";
  name: string;
  description: string;
  startDate: string;
  days: DayMenu[];
}

// ── Shared explanations ──

const EXP = {
  greens: {
    why: "Your nutritionist starts your eating window (12pm) with leafy greens to gently activate digestion after 16 hours of fasting. The fiber slows glucose absorption, preventing an insulin spike after breaking the fast.",
    nutrition: "Arugula contains glucosinolates that activate liver detox enzymes (phase II detoxification). Spinach provides folate and magnesium critical for liver metabolism. With your ALT at 101, these greens directly support liver cell repair.",
    liver: "Chlorophyll in dark greens binds to toxins and helps escort them out of the liver. Studies show leafy greens reduce liver fat accumulation in NAFLD patients.",
    timing: "Opening the eating window with greens before protein stabilizes blood sugar and prevents the reactive hypoglycemia that triggers fatty acid release into the liver.",
  },
  alfalfa: {
    why: "Alfalfa sprouts replace arugula in your updated plan. They are one of the most nutrient-dense sprouts, providing enzymes that aid digestion after a 16-hour fast.",
    nutrition: "Alfalfa is rich in saponins which bind to cholesterol in the gut and reduce absorption. With your LDL at 127, this directly supports your lipid targets.",
    liver: "Alfalfa contains unique antioxidants (flavones, isoflavones) that protect liver cells from oxidative damage. Studies show alfalfa extract reduces liver fat markers.",
    timing: "Opening the eating window with sprouts activates digestive enzymes gently after fasting, preparing the gut-liver axis for the day's nutrition.",
  },
  crackers: {
    why: "Buckwheat crackers provide slow-release carbohydrate to break your fast without spiking insulin. Unlike wheat, buckwheat is gluten-free with a glycemic index of 54 vs wheat's 71.",
    nutrition: "Buckwheat contains rutin, a flavonoid that reduces liver inflammation and lowers triglycerides. Your triglycerides improved from 153 to 98 — partly from reducing refined carbs.",
    liver: "The resistant starch in buckwheat feeds beneficial gut bacteria that produce short-chain fatty acids (SCFAs), which reduce liver inflammation via the gut-liver axis.",
    timing: "At the opening of your eating window, the body needs a moderate carbohydrate to replenish glycogen stores without overwhelming the liver.",
  },
  eggs2: {
    why: "Eggs are the cornerstone protein of your lunch because they contain all 9 essential amino acids needed to repair liver cells. Yadismira chose eggs specifically because your liver needs choline — and egg yolks are the richest dietary source.",
    nutrition: "Each egg yolk contains ~125mg of choline. Choline deficiency is a primary driver of NAFLD. With your ALT at 101, your liver struggles to process fats — choline helps transport fat OUT of liver cells.",
    liver: "Clinical studies show choline supplementation reduces liver fat by 15-20% in NAFLD patients. Two eggs provide 60% of daily choline needs.",
    timing: "Protein at the first meal after a 16h fast stimulates glucagon release, activating fat burning and preventing muscle breakdown.",
  },
  salmon_smoked: {
    why: "Smoked salmon provides omega-3 fatty acids EPA and DHA — the most powerful natural anti-inflammatory agents for the liver. With your AST at 43, liver inflammation is present.",
    nutrition: "EPA and DHA activate the PPAR-alpha receptor in the liver, switching it from fat storage to fat burning mode. This is exactly what you need to reduce fatty liver.",
    liver: "The PREDIMED study showed Mediterranean diet with fish reduced liver enzymes by 30% in 12 weeks. Salmon also provides vitamin D, which worsens NAFLD when deficient.",
    timing: "Omega-3s are fat-soluble and absorb best alongside other fats (avocado in this meal), making this combination optimal.",
  },
  avocado: {
    why: "Half an avocado provides glutathione precursors — the liver's master antioxidant. It is one of the most liver-protective foods available.",
    nutrition: "Avocados contain beta-sitosterol that reduces liver inflammation. Daily avocado consumption reduced liver damage markers by 11% in just 30 days in one study.",
    liver: "Avocado contains both glutathione AND precursors to make more. With your liver under oxidative stress (elevated ALT), this is therapeutic.",
    timing: "Oleic acid in avocado creates satiety hormones (CCK) that keep you full until your next meal.",
  },
  turkey_slices: {
    why: "Turkey slices on rest days provide lean protein to start your eating window. Lower fat than other proteins, making it ideal for rest days when caloric needs are reduced.",
    nutrition: "Turkey is the leanest deli protein available, with high tryptophan content supporting serotonin production and sleep quality.",
    liver: "The low saturated fat content avoids stressing the liver with lipid processing at the first meal of the day.",
    timing: "Light protein at lunch on rest days matches your lower energy expenditure while maintaining muscle protein synthesis.",
  },
  poultry_main: {
    why: "Lean poultry is your primary comida protein — it provides complete protein for muscle repair without saturated fat that stresses the liver. Turkey is lower in saturated fat than chicken.",
    nutrition: "With your BioAge at 63 (you are 33), you are losing muscle faster than normal. Adequate protein combined with strength training reverses this.",
    liver: "Lean protein prevents the liver from using amino acids for energy, sparing it for detoxification. Low saturated fat is crucial — saturated fat triggers liver fat accumulation.",
    timing: "The comida (2-3pm) is your largest meal, falling mid-eating-window with time to digest before 8pm. The liver processes nutrients most efficiently in the afternoon.",
  },
  fish_main: {
    why: "Fatty fish appears 3x per week — one of the most evidence-based interventions for NAFLD. Included on training days when your body needs protein AND omega-3s to reduce post-exercise inflammation.",
    nutrition: "The combination of omega-3s + complete protein is unique — omega-3s activate PPAR-alpha (fat burning in liver) while protein rebuilds muscle.",
    liver: "Eating fish 3x/week reduced liver fat by 12% even without other changes in a randomized trial. Combined with IF 16:8, the effect is amplified.",
    timing: "Fish at comida means 5+ hours to digest before end of eating window, allowing optimal absorption without burden during sleep.",
  },
  complex_carb: {
    why: "On training days, a measured portion of complex carbs replenishes muscle glycogen after exercise. This is ONLY on training days — not rest days.",
    nutrition: "Without carb replenishment, the liver must produce glucose through gluconeogenesis — a process that stresses liver cells.",
    liver: "Sweet potato contains beta-carotene supporting liver cell membranes. Cooled cooked potato becomes resistant starch feeding gut bacteria that protect the liver.",
    timing: "Post-training carbs within 2-4 hours of exercise maximizes glycogen resynthesis. Your 11:30am training + 12-2pm eating window is perfectly timed.",
  },
  olives: {
    why: "Your 5pm snack is small and fat-based to maintain satiety until dinner without spiking insulin. A carb snack would cause an insulin crash and hunger at 6pm.",
    nutrition: "Olives contain oleocanthal — a natural anti-inflammatory with similar mechanisms to ibuprofen, but safe for the liver (ibuprofen is contraindicated with elevated liver enzymes).",
    liver: "Olive polyphenols protect liver cell membranes from oxidative damage and have been shown to reduce liver fat in clinical studies.",
    timing: "The 5pm snack bridges the 2pm main meal and 7:30pm dinner, preventing excessive hunger that leads to overeating before the 8pm cutoff.",
  },
  almonds: {
    why: "Almonds provide healthy fats and protein for rest day snacks, maintaining satiety during the afternoon gap between meals.",
    nutrition: "Almonds are rich in vitamin E — a fat-soluble antioxidant that accumulates in the liver and protects hepatocytes from free radical damage.",
    liver: "Vitamin E supplementation is an FDA-approved treatment for NAFLD. 15g almonds provides 25% of daily vitamin E needs.",
    timing: "The small 15g portion ensures adequate energy without excess calories on rest days when energy expenditure is lower.",
  },
  walnuts: {
    why: "Walnuts (nueces) replace almonds in your updated plan, providing ALA omega-3s alongside polyphenols. They are the most liver-protective nut available.",
    nutrition: "A study in the Journal of Hepatology showed walnut consumption reduced NAFLD severity scores by 40% in 6 months. They contain ellagitannins that protect liver cells.",
    liver: "Walnuts provide ALA omega-3 and arginine — both directly liver-protective. The ellagitannin metabolites urolithins have unique anti-inflammatory effects in liver tissue.",
    timing: "Mid-afternoon fat-based snack prevents insulin spikes while providing sustained energy until dinner.",
  },
  persimmon: {
    why: "Persimmon (caqui) in your updated plan provides natural sugars + fiber for training days, plus unique antioxidants not found in nuts alone.",
    nutrition: "Persimmons are exceptionally high in beta-cryptoxanthin, a carotenoid shown to reduce liver inflammation. They also provide soluble fiber that binds bile acids.",
    liver: "The tannins in persimmon have hepatoprotective effects demonstrated in animal studies, reducing ALT and AST markers.",
    timing: "On training days, the natural sugars help replenish remaining glycogen while fiber prevents any insulin spike.",
  },
  dinner_light: {
    why: "Dinner is intentionally the smallest meal, ending by 7:30pm for 16 hours of fasting. Light proteins (eggs, turkey, fish) digest in 2-3 hours, clearing the digestive system before sleep.",
    nutrition: "Eating heavy close to sleep forces the liver to process nutrients during its repair phase. The liver performs most self-repair between midnight and 3am — only possible if not processing food.",
    liver: "The 16-hour fast your dinner initiates is directly therapeutic for NAFLD. Studies show 16:8 IF reduces liver fat by 3-5% per month.",
    timing: "7:30pm target (within 8pm cutoff) gives buffer for social flexibility. Protein-only dinner (no starch) means the liver reaches fasting state faster.",
  },
  broth: {
    why: "Vegetable broth at dinner increases hydration toward your 3L goal while providing minerals. It contributes 300-400ml toward daily water intake.",
    nutrition: "Broth contains glutamine — the primary fuel for intestinal cells. A strong intestinal barrier prevents endotoxins from reaching the liver. In NAFLD, 'leaky gut' drives liver inflammation.",
    liver: "Electrolytes in broth support liver cell osmotic balance. Warm broth slows eating pace and improves satiety, reducing total caloric intake.",
    timing: "Broth at dinner creates a warm, satiating experience that reduces the drive to eat more before the 8pm cutoff.",
  },
  beef_garlic: {
    why: "Lean beef with garlic is introduced in your updated plan to increase iron bioavailability. Your MCV is consistently low (76 Feb, 75.2 Mar), suggesting iron utilization issues alongside suspected thalassemia trait.",
    nutrition: "Heme iron from beef absorbs at 25-30% vs 5-10% for plant iron. With small red blood cells (low MCV/HCM), bioavailable iron optimizes oxygen capacity.",
    liver: "Garlic contains allicin and S-allylcysteine — among the most studied natural liver protectants. Studies show garlic reduces liver fat and ALT levels.",
    timing: "Red meat at comida (not dinner) because it takes 4-6 hours to digest. Midday ensures complete digestion before sleep.",
  },
  cod: {
    why: "Cod (bacalao) is the leanest white fish — less than 1g fat per 100g. Perfect when healthy fats come from avocado and EVOO instead.",
    nutrition: "Same complete protein as fatty fish but virtually no fat, allowing precise fat intake control. Combined with asparagus, provides inulin fiber reducing liver inflammation.",
    liver: "Asparagus contains asparagusic acid stimulating liver glutathione production — the main antioxidant protecting liver cells from oxidative stress causing your elevated ALT.",
    timing: "Cod digests quickly (2-3 hours), suitable for any meal timing, and its low fat means less work for liver bile production.",
  },
  legumes: {
    why: "Plant protein days appear twice weekly to give your liver a break from animal protein processing and provide resistant starch and fiber that animal foods lack.",
    nutrition: "Legumes contain saponins that bind to cholesterol and prevent absorption. With your LDL at 127 (target <100), legumes 2x/week could reduce LDL by 5-10% over 8 weeks.",
    liver: "Lentils are high in molybdenum — a trace mineral activating liver detox enzymes. Their resistant starch becomes butyrate in the colon, reducing liver inflammation via the gut-liver axis.",
    timing: "Plant protein days are mid-week to give the digestive system variety and prevent inflammatory response from daily meat consumption.",
  },
  free_meal: {
    why: "One free meal per week maintains psychological sustainability. Complete dietary restriction leads to binge episodes that damage the liver more than a controlled weekly indulgence.",
    nutrition: "The free meal prevents metabolic adaptation (your body lowering its metabolic rate from constant caloric restriction). One higher-calorie meal per week maintains your BMR at 1708 kcal.",
    liver: "CRITICAL: Even on free day, avoid alcohol (direct hepatotoxin), fried foods (trans fats worsen NAFLD), and high-fructose items (fructose is metabolized exclusively by the liver, worsening fat accumulation).",
    timing: "Sunday comida is chosen so you have the full eating window to enjoy the meal without feeling rushed, and enough fasting hours before Monday to clear any indulgence.",
  },
  seabass: {
    why: "Sea bass (lubina) is a premium white fish with moderate omega-3 content — bridging between lean cod and fatty salmon. Your updated plan includes it for variety.",
    nutrition: "Lubina provides high-quality protein with a favorable omega-6 to omega-3 ratio, important for reducing systemic inflammation.",
    liver: "The moderate fat content provides enough omega-3 for anti-inflammatory benefits without overwhelming the liver's lipid processing capacity at dinner.",
    timing: "Fish at dinner is light enough to digest before sleep while providing the amino acids needed for overnight muscle repair.",
  },
  turkey_meatballs: {
    why: "Turkey meatballs in zucchini sauce are a creative way to make lean protein more satisfying on rest days while keeping fat content low.",
    nutrition: "The zucchini sauce provides additional fiber and water content, increasing meal volume without adding significant calories.",
    liver: "Zucchini is rich in pectin fiber which supports bile acid metabolism and reduces cholesterol reabsorption — directly supporting your liver.",
    timing: "A saucy preparation at comida provides satiety that lasts through the afternoon, reducing snack cravings.",
  },
  ratatouille: {
    why: "Pisto (ratatouille) with eggs combines Mediterranean vegetables with protein. This dinner provides maximum nutrient density with minimal caloric load.",
    nutrition: "The combination of peppers, zucchini, and tomato provides a full spectrum of carotenoids that are synergistically more bioavailable when cooked together in olive oil.",
    liver: "Lycopene from cooked tomatoes is one of the strongest liver-protective antioxidants. Cooking increases lycopene bioavailability by 5x compared to raw tomato.",
    timing: "A vegetable-heavy dinner is the easiest for the liver to process before the overnight fasting period begins.",
  },
} as const;

// ── Images ──

const IMG = {
  greens_eggs: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=320&h=200&fit=crop",
  alfalfa_eggs: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=320&h=200&fit=crop",
  salmon_avo: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=320&h=200&fit=crop",
  turkey_slices: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=320&h=200&fit=crop",
  turkey_skewers: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=320&h=200&fit=crop",
  salmon_baked: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=320&h=200&fit=crop",
  chicken_shredded: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=320&h=200&fit=crop",
  chicken_thighs: "https://images.unsplash.com/photo-1598103442097-8b74f1570104?w=320&h=200&fit=crop",
  legume_burger: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=320&h=200&fit=crop",
  lentil_stew: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=320&h=200&fit=crop",
  tuna_baked: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=320&h=200&fit=crop",
  beef_garlic: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=320&h=200&fit=crop",
  chicken_orange: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=320&h=200&fit=crop",
  cod_asparagus: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=320&h=200&fit=crop",
  turkey_meatballs: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=320&h=200&fit=crop",
  chicken_mushroom: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=320&h=200&fit=crop",
  turkey_spices: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=320&h=200&fit=crop",
  hake_ginger: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=320&h=200&fit=crop",
  wrap_chicken: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=320&h=200&fit=crop",
  scramble_asparagus: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=320&h=200&fit=crop",
  omelette: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=320&h=200&fit=crop",
  turkey_pan: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=320&h=200&fit=crop",
  seabass: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=320&h=200&fit=crop",
  spinach_omelette: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=320&h=200&fit=crop",
  ratatouille: "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=320&h=200&fit=crop",
  eggplant_mozz: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=320&h=200&fit=crop",
  olives: "https://images.unsplash.com/photo-1593030103066-0093718e7177?w=320&h=200&fit=crop",
  almonds: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=320&h=200&fit=crop",
  walnuts: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=320&h=200&fit=crop",
  persimmon: "https://images.unsplash.com/photo-1604251370785-4e5e5e446e4d?w=320&h=200&fit=crop",
  plum: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=320&h=200&fit=crop",
  broth: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=320&h=200&fit=crop",
  pumpkin_soup: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=320&h=200&fit=crop",
  free_meal: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=320&h=200&fit=crop",
  zucchini_soup: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=320&h=200&fit=crop",
  carrot_soup: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=320&h=200&fit=crop",
};

// ── Helper to build a MealItem ──

function meal(
  type: string, typeEs: string, items: string, imageUrl: string,
  exp: { why: string; nutrition: string; liver: string; timing: string },
  calories: number, keyNutrients: string[],
  timeWindow: string, timingUrgency: "normal" | "warn" = "normal",
): MealItem {
  return {
    type, typeEs, items, imageUrl,
    whyExplanation: exp.why,
    nutritionExplanation: exp.nutrition,
    liverBenefit: exp.liver,
    timingReason: exp.timing,
    calories, keyNutrients, timeWindow, timingUrgency,
  };
}

// ── MENU V1: Control Plan ──

const V1_DAYS: DayMenu[] = [
  {
    day: 1, label: "Menu 1 — Training Day", labelEs: "Menú 1 — Día de Entreno", isTrainingDay: true, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Arugula/Spinach + 2 Buckwheat crackers + 2-egg omelette + 1 tbsp EVOO", IMG.greens_eggs, EXP.greens, 270, ["Folate", "Choline", "Rutin", "Magnesium", "Vitamin K"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "200g Turkey skewers + mushrooms & peppers + 100g boiled potato + Salad + 1 tbsp EVOO", IMG.turkey_skewers, EXP.poultry_main, 480, ["Complete protein", "B vitamins", "Selenium", "Resistant starch", "Fiber"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "10 olives", IMG.olives, EXP.olives, 80, ["Oleocanthal", "Polyphenols", "Oleic acid", "Vitamin E"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "150g Shredded chicken with spices + Lettuce wrap + vegetables + 1 tbsp EVOO", IMG.wrap_chicken, EXP.dinner_light, 320, ["Complete protein", "B12", "Fiber", "Low saturated fat"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 2, label: "Menu 2 — Rest Day", labelEs: "Menú 2 — Día de Descanso", isTrainingDay: false, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Sliced tomato + 2 Buckwheat crackers + 4 turkey slices + 1 tbsp EVOO", IMG.turkey_slices, EXP.turkey_slices, 240, ["Lycopene", "Rutin", "Tryptophan", "Lean protein"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "300g Baked salmon with lemon + Pumpkin puree + 1/2 avocado", IMG.salmon_baked, EXP.fish_main, 520, ["EPA/DHA omega-3", "Beta-carotene", "Glutathione", "Vitamin D"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "15g almonds", IMG.almonds, EXP.almonds, 85, ["Vitamin E", "Magnesium", "Monounsaturated fat", "Fiber"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "3-egg scramble + Asparagus & carrots + 1 tbsp EVOO", IMG.scramble_asparagus, EXP.dinner_light, 310, ["Choline", "Asparagusic acid", "Beta-carotene", "Glutathione precursors"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 3, label: "Menu 3 — Training Day", labelEs: "Menú 3 — Día de Entreno", isTrainingDay: true, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Arugula/Spinach + 2 Buckwheat crackers + 50g smoked salmon + 1/2 avocado", IMG.salmon_avo, EXP.salmon_smoked, 345, ["EPA/DHA omega-3", "Glutathione", "Rutin", "Vitamin D"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "200g Shredded chicken in tomato sauce + 80g cooked rice + Roasted vegetables + 1/2 avocado", IMG.chicken_shredded, EXP.poultry_main, 510, ["Complete protein", "Lycopene", "Complex carbs", "Glutathione"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "10 olives", IMG.olives, EXP.olives, 80, ["Oleocanthal", "Polyphenols", "Oleic acid"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "225g Baked tuna + 1 bowl vegetable broth + 1 tbsp EVOO", IMG.tuna_baked, EXP.fish_main, 350, ["EPA/DHA omega-3", "Glutamine", "Iodine", "B12"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 4, label: "Menu 4 — Rest Day", labelEs: "Menú 4 — Día de Descanso", isTrainingDay: false, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Sliced tomato + 2 Buckwheat crackers + 4 turkey slices + 1 tbsp EVOO", IMG.turkey_slices, EXP.turkey_slices, 240, ["Lycopene", "Rutin", "Lean protein"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "200g Chicken thighs with roasted vegetables + Lettuce/tomato/onion + 1 tbsp EVOO", IMG.chicken_thighs, EXP.poultry_main, 440, ["Complete protein", "B vitamins", "Fiber", "Quercetin"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "15g almonds", IMG.almonds, EXP.almonds, 85, ["Vitamin E", "Magnesium", "Fiber"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "3-egg omelette + 1 bowl vegetable broth + 1 tbsp EVOO", IMG.omelette, EXP.dinner_light, 290, ["Choline", "Glutamine", "Electrolytes", "B12"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 5, label: "Menu 5 — Training Day", labelEs: "Menú 5 — Día de Entreno", isTrainingDay: true, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Arugula/Spinach + 2 Buckwheat crackers + 50g smoked salmon + 1/2 avocado", IMG.salmon_avo, EXP.salmon_smoked, 345, ["EPA/DHA omega-3", "Glutathione", "Vitamin D"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "200g Legume burger + 100g sweet potato + Mixed vegetables + 1 tbsp EVOO", IMG.legume_burger, EXP.legumes, 460, ["Plant protein", "Resistant starch", "Beta-carotene", "Saponins", "Molybdenum"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "10 olives", IMG.olives, EXP.olives, 80, ["Oleocanthal", "Polyphenols"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "150g Pan-seared turkey + Beet/carrot/broccoli salad + 1 tbsp EVOO", IMG.turkey_pan, EXP.dinner_light, 310, ["Complete protein", "Betanin", "Sulforaphane", "Fiber"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 6, label: "Menu 6 — Rest Day", labelEs: "Menú 6 — Día de Descanso", isTrainingDay: false, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Arugula/Spinach + 2 Buckwheat crackers + 2-egg omelette + 1 tbsp EVOO", IMG.greens_eggs, EXP.greens, 270, ["Folate", "Choline", "Glucosinolates", "Rutin"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "200g Lentil stew + Mixed vegetables + 1 tbsp EVOO", IMG.lentil_stew, EXP.legumes, 420, ["Plant protein", "Resistant starch", "Molybdenum", "Folate", "Soluble fiber"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "15g almonds", IMG.almonds, EXP.almonds, 85, ["Vitamin E", "Magnesium"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "150g Pan-seared turkey + Vegetable stir-fry with bean sprouts + 1 tbsp EVOO", IMG.turkey_pan, EXP.dinner_light, 300, ["Complete protein", "Fiber", "Vitamin C", "Isoflavones"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 7, label: "Menu 7 — Free Day", labelEs: "Menú 7 — Día Libre", isTrainingDay: false, isFreeDay: true,
    meals: [
      meal("LUNCH", "Almuerzo", "Sliced tomato + 2 Buckwheat crackers + 4 turkey slices + 1 tbsp EVOO", IMG.turkey_slices, EXP.turkey_slices, 240, ["Lycopene", "Rutin", "Lean protein"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "FREE MEAL (your choice)", IMG.free_meal, EXP.free_meal, 600, ["Variable"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "10 olives", IMG.olives, EXP.olives, 80, ["Oleocanthal", "Polyphenols"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "150g Honey chicken breast + 1 bowl carrot cream soup + 1 tbsp EVOO", IMG.chicken_shredded, EXP.dinner_light, 340, ["Complete protein", "Beta-carotene", "Glutamine"], "19:30 – 20:00", "warn"),
    ],
  },
];

// ── MENU V2: Updated Plan ──

const V2_DAYS: DayMenu[] = [
  {
    day: 1, label: "Menu 1 — Training Day", labelEs: "Menú 1 — Día de Entreno", isTrainingDay: true, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Alfalfa sprouts + 2 Buckwheat crackers + 2-egg omelette + 1 tbsp EVOO", IMG.alfalfa_eggs, EXP.alfalfa, 265, ["Saponins", "Choline", "Rutin", "Isoflavones"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "Garlic veal + Boiled green beans & carrots + 1 handful cooked quinoa", IMG.beef_garlic, EXP.beef_garlic, 480, ["Heme iron", "Zinc", "B12", "Allicin", "Complete protein", "CoQ10"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "1 persimmon + 15g walnuts", IMG.persimmon, EXP.persimmon, 130, ["Beta-cryptoxanthin", "ALA omega-3", "Ellagitannins", "Fiber"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "Baked sea bass with lemon + 1 bowl pumpkin & leek cream soup + 1 tbsp EVOO", IMG.seabass, EXP.seabass, 330, ["Omega-3", "Beta-carotene", "Complete protein", "Glutamine"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 2, label: "Menu 2 — Rest Day", labelEs: "Menú 2 — Día de Descanso", isTrainingDay: false, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Sliced tomato + 2 Buckwheat crackers + 4 turkey slices + 1 tbsp EVOO", IMG.turkey_slices, EXP.turkey_slices, 240, ["Lycopene", "Rutin", "Lean protein"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "Chicken thighs with orange & ginger + Spinach/cherry tomato/carrot salad + 1 tbsp EVOO", IMG.chicken_orange, EXP.poultry_main, 450, ["Complete protein", "Gingerol", "Vitamin C", "Lycopene"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "15g walnuts", IMG.walnuts, EXP.walnuts, 95, ["ALA omega-3", "Ellagitannins", "Arginine", "Vitamin E"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "Spinach omelette (2 eggs) + 1 bowl zucchini & leek cream soup + 1 tbsp EVOO", IMG.spinach_omelette, EXP.dinner_light, 280, ["Choline", "Folate", "Pectin fiber", "Glutamine"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 3, label: "Menu 3 — Training Day", labelEs: "Menú 3 — Día de Entreno", isTrainingDay: true, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Alfalfa sprouts + 2 Buckwheat crackers + 50g smoked salmon + 1/2 avocado", IMG.salmon_avo, EXP.salmon_smoked, 345, ["EPA/DHA omega-3", "Saponins", "Glutathione", "Vitamin D"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "Baked cod + Roasted asparagus + 1/4 plate baked sweet potato + 1/2 avocado", IMG.cod_asparagus, EXP.cod, 440, ["Complete protein", "Asparagusic acid", "Beta-carotene", "Glutathione"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "1 persimmon + 15g walnuts", IMG.persimmon, EXP.persimmon, 130, ["Beta-cryptoxanthin", "ALA omega-3", "Fiber"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "Pan-seared chicken with mushrooms + Roasted mixed vegetables + 1 tbsp EVOO", IMG.chicken_mushroom, EXP.dinner_light, 330, ["Complete protein", "Beta-glucan", "Selenium", "B vitamins"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 4, label: "Menu 4 — Rest Day", labelEs: "Menú 4 — Día de Descanso", isTrainingDay: false, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Sliced tomato + 2 Buckwheat crackers + 4 turkey slices + 1 tbsp EVOO", IMG.turkey_slices, EXP.turkey_slices, 240, ["Lycopene", "Rutin", "Lean protein"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "Turkey meatballs in zucchini sauce + Mixed salad + 1 tbsp EVOO", IMG.turkey_meatballs, EXP.turkey_meatballs, 400, ["Complete protein", "Pectin fiber", "Quercetin", "Low saturated fat"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "15g walnuts", IMG.walnuts, EXP.walnuts, 95, ["ALA omega-3", "Ellagitannins", "Arginine"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "French omelette (2 eggs) + 1 bowl zucchini & leek cream soup + 1 tbsp EVOO", IMG.omelette, EXP.dinner_light, 270, ["Choline", "Pectin fiber", "Glutamine", "B12"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 5, label: "Menu 5 — Training Day", labelEs: "Menú 5 — Día de Entreno", isTrainingDay: true, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Alfalfa sprouts + 2 Buckwheat crackers + 50g smoked salmon + 1/2 avocado", IMG.salmon_avo, EXP.salmon_smoked, 345, ["EPA/DHA omega-3", "Saponins", "Glutathione"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "Pan-seared chicken breast with mushrooms + Sauteed eggplant & zucchini with spices + 1 handful quinoa + 1 tbsp EVOO", IMG.chicken_mushroom, EXP.poultry_main, 490, ["Complete protein", "Beta-glucan", "Complex carbs", "Fiber"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "1 persimmon + 15g walnuts", IMG.persimmon, EXP.persimmon, 130, ["Beta-cryptoxanthin", "ALA omega-3"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "Baked hake with ginger + Roasted asparagus + 1/2 avocado", IMG.hake_ginger, EXP.fish_main, 320, ["Complete protein", "Gingerol", "Asparagusic acid", "Glutathione"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 6, label: "Menu 6 — Rest Day", labelEs: "Menú 6 — Día de Descanso", isTrainingDay: false, isFreeDay: false,
    meals: [
      meal("LUNCH", "Almuerzo", "Alfalfa sprouts + 2 Buckwheat crackers + 2-egg omelette + 1 tbsp EVOO", IMG.alfalfa_eggs, EXP.alfalfa, 265, ["Saponins", "Choline", "Isoflavones", "Rutin"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "Spiced turkey + 1 bowl zucchini cream soup + 1/2 avocado", IMG.turkey_spices, EXP.poultry_main, 390, ["Complete protein", "Pectin fiber", "Glutathione", "B vitamins"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "1 plum", IMG.plum, EXP.olives, 45, ["Sorbitol", "Vitamin C", "Anthocyanins"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "Vegetable ratatouille with 2 eggs (red/green pepper, zucchini, tomato) + 1/2 avocado", IMG.ratatouille, EXP.ratatouille, 310, ["Lycopene", "Choline", "Carotenoids", "Glutathione"], "19:30 – 20:00", "warn"),
    ],
  },
  {
    day: 7, label: "Menu 7 — Free Day", labelEs: "Menú 7 — Día Libre", isTrainingDay: false, isFreeDay: true,
    meals: [
      meal("LUNCH", "Almuerzo", "Sliced tomato + 2 Buckwheat crackers + 4 turkey slices + 1 tbsp EVOO", IMG.turkey_slices, EXP.turkey_slices, 240, ["Lycopene", "Rutin", "Lean protein"], "12:00 – 13:00", "normal"),
      meal("MAIN MEAL", "Comida", "FREE MEAL (your choice)", IMG.free_meal, EXP.free_meal, 600, ["Variable"], "14:00 – 15:00", "normal"),
      meal("SNACK", "Merienda", "1 plum", IMG.plum, EXP.olives, 45, ["Sorbitol", "Vitamin C"], "17:00 – 17:30", "warn"),
      meal("DINNER", "Cena", "Roasted eggplant with fresh mozzarella + Spiced roasted eggplant + 1 tbsp EVOO", IMG.eggplant_mozz, EXP.dinner_light, 290, ["Nasunin", "Calcium", "Complete protein", "Polyphenols"], "19:30 – 20:00", "warn"),
    ],
  },
];

// ── Exported menu versions ──

export const MENU_VERSIONS: MenuVersion[] = [
  {
    id: "v1",
    name: "Control Plan",
    description: "Original plan — Arugula/Spinach base, classic proteins",
    startDate: "2026-02-01",
    days: V1_DAYS,
  },
  {
    id: "v2",
    name: "Updated Plan",
    description: "New plan — Alfalfa base, new proteins (veal, cod, sea bass)",
    startDate: "2026-04-01",
    days: V2_DAYS,
  },
];

// ── Timing helper ──

export function isMealTimeNow(timeWindow: string): boolean {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const match = timeWindow.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const start = parseInt(match[1]) * 60 + parseInt(match[2]);
  const end = parseInt(match[3]) * 60 + parseInt(match[4]);
  // Within 30 min before start or during the window
  return currentMin >= start - 30 && currentMin <= end;
}
