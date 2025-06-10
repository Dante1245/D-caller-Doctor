import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Phone } from "lucide-react";
import { Link } from "wouter";

export function MessagesSidebar() {
  const { data: recentMessages } = useQuery({
    queryKey: ["/api/messages/recent"],
  });

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const onlineContacts = contacts?.filter((contact: any) => contact.status === "accepted") || [];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Recent Messages */}
      <Card className="glassmorphic border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Messages</h3>
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="text-accent-cyan hover:text-accent-cyan/80">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentMessages?.slice(0, 5).map((message: any) => (
            <div
              key={message.id}
              className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${message.senderId}&background=00f5ff&color=fff&size=40`}
                alt="Message sender"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {message.senderId}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {message.content}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-text-subtle">
                  {formatTime(message.createdAt)}
                </span>
                {!message.isRead && (
                  <span className="w-2 h-2 bg-accent-green rounded-full mt-1"></span>
                )}
              </div>
            </div>
          ))}
          
          {(!recentMessages || recentMessages.length === 0) && (
            <div className="text-center py-8">
              <p className="text-text-muted text-sm">No recent messages</p>
            </div>
          )}
        </div>
      </Card>

      {/* Online Contacts */}
      <Card className="glassmorphic border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Online Now</h3>
          <span className="text-xs text-text-muted bg-white/10 px-2 py-1 rounded-full">
            {onlineContacts.length}
          </span>
        </div>
        
        <div className="space-y-3">
          {onlineContacts.slice(0, 6).map((contact: any) => (
            <div
              key={contact.id}
              className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer"
            >
              <div className="relative">
                <img
                  src={`https://ui-avatars.com/api/?name=${contact.contactUserId}&background=00f5ff&color=fff&size=32`}
                  alt="Contact"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-green rounded-full border-2 border-primary"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {contact.contactUserId}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="p-1 hover:bg-white/10 rounded"
              >
                <Phone className="h-4 w-4 text-accent-cyan" />
              </Button>
            </div>
          ))}
          
          {onlineContacts.length === 0 && (
            <div className="text-center py-4">
              <p className="text-text-muted text-sm">No contacts online</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Settings */}
      <Card className="glassmorphic border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Auto-record calls</span>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Push notifications</span>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Dark mode</span>
            <Switch />
          </div>
        </div>
      </Card>
    </div>
  );
}
