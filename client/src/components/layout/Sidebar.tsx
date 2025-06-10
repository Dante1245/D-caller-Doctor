import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Phone, 
  MessageSquare, 
  Users, 
  Settings, 
  Gauge,
  PhoneCall 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col glassmorphic border-r border-white/10">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center h-16 px-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gradient">VoiceConnect Pro</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan"
                      : "hover:bg-white/10 text-text-muted hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-6">
            <div className="glassmorphic rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=00f5ff&color=fff`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-accent-green"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-text-muted">Online</p>
                </div>
                <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse-slow"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
