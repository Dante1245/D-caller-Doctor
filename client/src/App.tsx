import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Landing } from "@/components/auth/Landing";
import Dashboard from "@/pages/Dashboard";
import Calls from "@/pages/Calls";
import Messages from "@/pages/Messages";
import Contacts from "@/pages/Contacts";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-purple flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg">Loading VoiceConnect Pro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <div className="flex h-screen bg-gradient-main">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/calls" component={Calls} />
          <Route path="/messages" component={Messages} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </div>
      
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
