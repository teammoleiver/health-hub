import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import { scheduleEndOfDaySnapshot, checkMissedSnapshot } from "@/lib/daily-snapshot";
import Dashboard from "./pages/Dashboard";
import HealthRecords from "./pages/HealthRecords";
import FastingModule from "./pages/FastingModule";
import NutritionModule from "./pages/NutritionModule";
import ExerciseModule from "./pages/ExerciseModule";
import BodyMetrics from "./pages/BodyMetrics";
import GoalsModule from "./pages/GoalsModule";
import AssistantModule from "./pages/AssistantModule";
import SettingsModule from "./pages/SettingsModule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Schedule end-of-day snapshot at 23:59 & check for missed yesterday
  useEffect(() => {
    scheduleEndOfDaySnapshot();
    checkMissedSnapshot();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/health" element={<HealthRecords />} />
            <Route path="/fasting" element={<FastingModule />} />
            <Route path="/nutrition" element={<NutritionModule />} />
            <Route path="/exercise" element={<ExerciseModule />} />
            <Route path="/body" element={<BodyMetrics />} />
            <Route path="/goals" element={<GoalsModule />} />
            <Route path="/assistant" element={<AssistantModule />} />
            <Route path="/settings" element={<SettingsModule />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
