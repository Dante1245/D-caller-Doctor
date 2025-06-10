import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Download } from "lucide-react";

export default function Calls() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: callHistory, isLoading } = useQuery({
    queryKey: ["/api/calls/history"],
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent-green text-white";
      case "ended":
        return "bg-gray-500 text-white";
      case "failed":
        return "bg-red-500 text-white";
      default:
        return "bg-accent-cyan text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      <Header
        title="Call History"
        subtitle="View and manage your call records"
        onMobileMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
        <Card className="glassmorphic border-white/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Calls</h2>
              <Button className="bg-accent-cyan hover:bg-accent-cyan/80">
                <Phone className="h-4 w-4 mr-2" />
                New Call
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-white/10 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {callHistory?.map((call: any) => (
                  <div
                    key={call.id}
                    className="flex items-center space-x-4 p-4 hover:bg-white/5 rounded-xl transition-all duration-200"
                  >
                    <div className="flex-shrink-0">
                      {call.type === "webrtc" ? (
                        call.initiatorId ? (
                          <PhoneOutgoing className="h-6 w-6 text-accent-cyan" />
                        ) : (
                          <PhoneIncoming className="h-6 w-6 text-accent-green" />
                        )
                      ) : (
                        <Phone className="h-6 w-6 text-accent-purple" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {call.recipientNumber || call.recipientId || "Unknown"}
                        </p>
                        <Badge className={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted">
                        {formatDate(call.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {call.duration > 0 && (
                        <div className="flex items-center space-x-1 text-text-muted">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{formatDuration(call.duration)}</span>
                        </div>
                      )}
                      
                      {call.recordingUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {(!callHistory || callHistory.length === 0) && (
                  <div className="text-center py-12">
                    <Phone className="h-16 w-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No calls yet</h3>
                    <p className="text-text-muted">Start making calls to see your history here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
