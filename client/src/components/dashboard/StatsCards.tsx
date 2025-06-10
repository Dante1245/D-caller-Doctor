import { useQuery } from "@tanstack/react-query";
import { Phone, MessageSquare, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatsCards() {
  const { data: callHistory } = useQuery({
    queryKey: ["/api/calls/history"],
  });

  const { data: recentMessages } = useQuery({
    queryKey: ["/api/messages/recent"],
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const activeCalls = callHistory?.filter((call: any) => call.status === "active")?.length || 0;
  const todayMessages = recentMessages?.filter((msg: any) => {
    const today = new Date().toDateString();
    return new Date(msg.createdAt).toDateString() === today;
  })?.length || 0;
  const onlineContacts = contacts?.filter((contact: any) => contact.status === "accepted")?.length || 0;
  const totalCallMinutes = callHistory?.reduce((total: number, call: any) => total + (call.duration || 0), 0) || 0;

  const stats = [
    {
      label: "Active Calls",
      value: activeCalls,
      icon: Phone,
      color: "accent-green",
    },
    {
      label: "Messages Today",
      value: todayMessages,
      icon: MessageSquare,
      color: "accent-cyan",
    },
    {
      label: "Online Friends",
      value: onlineContacts,
      icon: Users,
      color: "accent-purple",
    },
    {
      label: "Call Minutes",
      value: Math.floor(totalCallMinutes / 60),
      icon: Clock,
      color: "gradient",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadeIn">
      {stats.map((stat) => (
        <Card key={stat.label} className="glassmorphic border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              stat.color === "gradient" 
                ? "bg-gradient-to-r from-accent-cyan to-accent-purple"
                : `bg-${stat.color}/20`
            }`}>
              <stat.icon className={`text-xl ${
                stat.color === "gradient" ? "text-white" : `text-${stat.color}`
              }`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
