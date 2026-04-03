import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchFoodDatabase, type FoodDbItem } from "@/lib/food-queries";

interface FoodSearchInputProps {
  onSelect: (food: FoodDbItem) => void;
  placeholder?: string;
  className?: string;
}

export default function FoodSearchInput({ onSelect, placeholder = "Search food database...", className }: FoodSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodDbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only search when there's a query
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchFoodDatabase(query, 50);
        setResults(data);
      } catch (e) {
        console.error("Food search error:", e);
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
      </div>

      {open && query.trim() && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          <div className="sticky top-0 bg-card/95 backdrop-blur-sm px-3 py-1.5 border-b border-border/50 z-10">
            <span className="text-[10px] text-muted-foreground font-medium">{results.length} results for "{query}"</span>
          </div>
          {results.map((food) => (
            <button
              key={food.id}
              onClick={() => { onSelect(food); setQuery(""); setOpen(false); }}
              className="w-full px-3 py-2.5 text-left hover:bg-accent/50 transition border-b border-border/30 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-sm text-foreground">{food.food_name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">
                      {food.category}
                    </span>
                    {food.serving_description && (
                      <span className="text-[10px] text-muted-foreground">{food.serving_description}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  {food.kcal_per_serving && (
                    <span className="text-xs font-semibold text-primary">{food.kcal_per_serving} kcal</span>
                  )}
                  {food.kcal_per_100g && (
                    <div className="text-[9px] text-muted-foreground">{food.kcal_per_100g}/100g</div>
                  )}
                </div>
              </div>
              {(food.protein_g || food.carbs_g || food.fat_g) && (
                <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground">
                  {food.protein_g != null && <span>P: {food.protein_g}g</span>}
                  {food.carbs_g != null && <span>C: {food.carbs_g}g</span>}
                  {food.fat_g != null && <span>F: {food.fat_g}g</span>}
                  {food.fiber_g != null && <span>Fiber: {food.fiber_g}g</span>}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.trim() && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-card shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">No foods found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
