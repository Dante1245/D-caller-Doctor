import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  title: string;
  subtitle?: string;
}

export function Header({ onMobileMenuToggle, title, subtitle }: HeaderProps) {
  return (
    <header className="glassmorphic border-b border-white/10 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden p-2 hover:bg-white/10"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm lg:text-base text-text-muted">{subtitle}</p>}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="p-3 glassmorphic rounded-xl hover:bg-white/20"
          >
            <Bell className="h-5 w-5 text-accent-cyan" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="p-3 glassmorphic rounded-xl hover:bg-white/20"
          >
            <Search className="h-5 w-5 text-accent-cyan" />
          </Button>
        </div>
      </div>
    </header>
  );
}
