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
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import UsersPage from "./pages/UsersPage";
import AuthWrapper from "./components/AuthWrapper";
import DepartmentIdTestPage from "./pages/DepartmentIdTestPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <BrowserRouter>
          <AuthWrapper>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/floors" element={<FloorsPage />} />
              <Route path="/turar" element={<TurarPage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/consolidation" element={<ConsolidationPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/dept-test" element={<DepartmentIdTestPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
