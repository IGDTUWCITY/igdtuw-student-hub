import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Building2,
  Calendar,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Calgo', path: '/calendar' },
  { icon: GraduationCap, label: 'Academics', path: '/academics' },
  { icon: Briefcase, label: 'Opportunities', path: '/opportunities' },
  { icon: Building2, label: 'Campus Life', path: '/campus' },
  { icon: User, label: 'Profile', path: '/settings' },
];

import { ModeToggle } from '@/components/mode-toggle';

export function Sidebar() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  // Auto-adjust when crossing the mobile breakpoint.
  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex-col z-50 flex"
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0">
            <img src="/favicon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-display font-bold text-lg text-sidebar-foreground">
                IGDTUW City
              </h1>
              <p className="text-xs text-muted-foreground">v2.0</p>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent dark:hover:bg-[hsl(var(--primary-hover))] group',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive
                    ? 'text-sidebar-primary-foreground'
                    : 'text-muted-foreground group-hover:text-sidebar-foreground dark:group-hover:text-primary-foreground'
                )}
              />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* About Us Link */}
      <div className="px-3 pb-2">
        <Link
          to="/about"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'hover:bg-sidebar-accent dark:hover:bg-[hsl(var(--primary-hover))] group',
            location.pathname === '/about'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground'
          )}
        >
          <Info
            className={cn(
              'w-5 h-5 flex-shrink-0',
              location.pathname === '/about'
                ? 'text-sidebar-primary-foreground'
                : 'text-muted-foreground group-hover:text-sidebar-foreground dark:group-hover:text-primary-foreground'
            )}
          />
          {!collapsed && <span className="font-medium text-sm">About Us</span>}
        </Link>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || 'Student'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.branch || 'Complete profile'}
              </p>
            </div>
          )}
        </div>

        <div className={cn("flex justify-center my-2", !collapsed && "justify-start px-2")}>
           <ModeToggle />
           {!collapsed && <span className="ml-2 text-sm font-medium self-center">Theme</span>}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className={cn(
            'w-full mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            collapsed && 'px-2'
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center shadow-sm hover:bg-sidebar-accent dark:hover:bg-[hsl(var(--primary-hover))] transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </motion.aside>
  );
}
