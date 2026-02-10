// @ is the shortcut to src/

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
// toaster is notifications library, sonner is for better animations
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { analyticsEnabled, initAnalytics, trackPageView } from "@/lib/analytics";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Academics from "./pages/Academics";
import Opportunities from "./pages/Opportunities";
import Campus from "./pages/Campus";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CalendarPage from "./pages/CalendarPage";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!analyticsEnabled()) return;

    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
};

const App = () => {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" attribute="class">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteTracker />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Index />} />

                {/* Protected routes with sidebar layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/academics" element={<Academics />} />
                  <Route path="/opportunities" element={<Opportunities />} />
                  <Route path="/campus" element={<Campus />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
