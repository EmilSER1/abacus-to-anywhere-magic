import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FloorsPage from "./pages/FloorsPage";
import TurarPage from "./pages/TurarPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import SearchPage from "./pages/SearchPage";
import ConsolidationPage from "./pages/ConsolidationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/floors" element={<FloorsPage />} />
          <Route path="/turar" element={<TurarPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/consolidation" element={<ConsolidationPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
