import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CallInterface } from "@/components/dashboard/CallInterface";
import { CallVisualization } from "@/components/dashboard/CallVisualization";
import { MessagesSidebar } from "@/components/dashboard/MessagesSidebar";
import { useAuth } from "@/hooks/useAuth";
import { socketManager } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Connect to socket and authenticate
      const socket = socketManager.connect();
      socketManager.authenticate(user.id);

      // Setup socket event listeners
      socket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data);
      });

      socket.on('call:incoming', (data) => {
        toast({
          title: "Incoming Call",
          description: `Call from ${data.callerId}`,
        });
      });

      socket.on('message:received', (message) => {
        toast({
          title: "New Message",
          description: `Message from ${message.senderId}`,
        });
      });

      socket.on('user:online', (data) => {
        console.log('User came online:', data.userId);
      });

      socket.on('user:offline', (data) => {
        console.log('User went offline:', data.userId);
      });

      return () => {
        socketManager.disconnect();
      };
    }
  }, [user, toast]);

  return (
    <div className="min-h-screen bg-gradient-main">
      <Header
        title="Communication Dashboard"
        subtitle="Manage your calls, messages, and contacts"
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
        <StatsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CallInterface />
            <CallVisualization />
          </div>
          
          <div className="lg:col-span-1">
            <MessagesSidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
