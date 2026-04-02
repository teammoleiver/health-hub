import { Utensils, Clock, Droplets, Plus } from "lucide-react";
import { getFastingStatus, USER_PROFILE } from "@/lib/health-data";
import { useState, useEffect } from "react";

const MENUS = [
  { day: 1, label: "Menu 1 — Training Day", meals: [
    { type: "Almuerzo (12pm)", items: "Rúcula/Espinacas + 2 Crackers trigo sarraceno + Tortilla 2 huevos + 1 cda AOVE" },
    { type: "Comida (2pm)", items: "200g Brochetas pavo + champiñones + pimientos + 100g patata cocida + Ensalada + 1 cda AOVE" },
    { type: "Merienda (5pm)", items: "10 olivas" },
    { type: "Cena (7:30pm)", items: "150g Pollo desmenuzado con especias + Wrap lechuga + vegetales + 1 cda AOVE" },
  ]},
  { day: 2, label: "Menu 2 — Rest Day", meals: [
    { type: "Almuerzo", items: "Tomate + 2 Crackers + 4 lonchas pavo + 1 cda AOVE" },
    { type: "Comida", items: "300g Salmón al horno con limón + Puré calabaza + 1/2 aguacate" },
    { type: "Merienda", items: "15g almendras" },
    { type: "Cena", items: "Revuelto 3 huevos + Espárragos y zanahorias + 1 cda AOVE" },
  ]},
  { day: 3, label: "Menu 3 — Training Day", meals: [
    { type: "Almuerzo", items: "Rúcula/Espinacas + 2 Crackers + 50g salmón ahumado + 1/2 aguacate" },
    { type: "Comida", items: "200g Pollo desmenuzado salsa tomate + 80g arroz cocido + Verduras al horno + 1/2 aguacate" },
    { type: "Merienda", items: "10 olivas" },
    { type: "Cena", items: "225g Atún al horno + 1 bowl caldo verduras + 1 cda AOVE" },
  ]},
  { day: 4, label: "Menu 4 — Rest Day", meals: [
    { type: "Almuerzo", items: "Tomate + 2 Crackers + 4 lonchas pavo + 1 cda AOVE" },
    { type: "Comida", items: "200g Muslos pollo con verduras al horno + Lechuga/tomate/cebolla + 1 cda AOVE" },
    { type: "Merienda", items: "15g almendras" },
    { type: "Cena", items: "Tortilla 3 huevos + 1 bowl caldo verduras + 1 cda AOVE" },
  ]},
  { day: 5, label: "Menu 5 — Training Day", meals: [
    { type: "Almuerzo", items: "Rúcula/Espinacas + 2 Crackers + 50g salmón ahumado + 1/2 aguacate" },
    { type: "Comida", items: "200g Hamburguesa legumbres + 100g boniato + Verduras variadas + 1 cda AOVE" },
    { type: "Merienda", items: "10 olivas" },
    { type: "Cena", items: "150g Pavo al sartén + Ensalada remolacha/zanahoria/brócoli + 1 cda AOVE" },
  ]},
  { day: 6, label: "Menu 6 — Rest Day", meals: [
    { type: "Almuerzo", items: "Rúcula/Espinacas + 2 Crackers + Tortilla 2 huevos + 1 cda AOVE" },
    { type: "Comida", items: "200g Estofado lentejas + Verduras variadas + 1 cda AOVE" },
    { type: "Merienda", items: "15g almendras" },
    { type: "Cena", items: "150g Pavo al sartén + Wok verduras con brotes soja + 1 cda AOVE" },
  ]},
  { day: 7, label: "Menu 7 — Free Day", meals: [
    { type: "Almuerzo", items: "Tomate + 2 Crackers + 4 lonchas pavo + 1 cda AOVE" },
    { type: "Comida", items: "🎉 COMIDA LIBRE (free meal)" },
    { type: "Merienda", items: "10 olivas" },
    { type: "Cena", items: "150g Pechuga pollo con miel + 1 bowl crema zanahoria + 1 cda AOVE" },
  ]},
];

export default function NutritionModule() {
  const fasting = getFastingStatus();
  const [waterGlasses, setWaterGlasses] = useState(4);
  const [selectedDay, setSelectedDay] = useState(
    new Date().getDay() === 0 ? 7 : new Date().getDay()
  );
  const now = new Date();
  const isPastWindow = now.getHours() >= 20;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Nutrition</h1>

      {/* Eating Window Status */}
      {isPastWindow && (
        <div className="danger-gradient rounded-xl p-3 text-destructive-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">Eating window is now closed — no more food tonight</span>
        </div>
      )}

      {fasting.state === "eating" && fasting.remainingMinutes <= 60 && (
        <div className="warning-gradient rounded-xl p-3 text-warning-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-semibold">
            Eating window closes in {fasting.remainingMinutes} minutes
          </span>
        </div>
      )}

      {/* Water Tracker */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" /> Water Tracker
          </h3>
          <span className="text-sm text-muted-foreground">{waterGlasses}/12 glasses (3L goal)</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setWaterGlasses(i + 1)}
              className={`aspect-square rounded-lg flex items-center justify-center transition ${
                i < waterGlasses
                  ? "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                  : "bg-secondary text-muted-foreground border border-transparent hover:border-blue-500/20"
              }`}
            >
              <Droplets className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MENUS.map((m) => (
          <button
            key={m.day}
            onClick={() => setSelectedDay(m.day)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedDay === m.day
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground hover:bg-accent"
            }`}
          >
            Day {m.day}
          </button>
        ))}
      </div>

      {/* Menu Detail */}
      {MENUS.filter((m) => m.day === selectedDay).map((menu) => (
        <div key={menu.day} className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">{menu.label}</h3>
          {menu.day === 7 && (
            <div className="warning-gradient rounded-lg p-3 text-warning-foreground text-xs flex items-start gap-2">
              <span>⚠️</span>
              <span>Free meal day — be liver-aware. Avoid fried, processed, and high-sugar foods. Your ALT is at 101.</span>
            </div>
          )}
          {menu.meals.map((meal) => (
            <div key={meal.type} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary uppercase">{meal.type}</span>
                <Utensils className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground">{meal.items}</p>
            </div>
          ))}
        </div>
      ))}

      {/* Log Meal Button */}
      <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition">
        <Plus className="w-4 h-4" /> Log Meal
      </button>
    </div>
  );
}
