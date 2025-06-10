import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Phone, 
  MessageSquare, 
  Users, 
  Gauge 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "Calls", href: "/calls", icon: Phone },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Contacts", href: "/contacts", icon: Users },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glassmorphic border-t border-white/10 p-4 z-40">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex flex-col items-center space-y-1 transition-colors",
                  isActive ? "text-accent-cyan" : "text-text-muted"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
