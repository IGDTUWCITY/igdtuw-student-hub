import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import { AIAssistant } from '@/components/ai/AIAssistant';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react';

export function MainLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="transition-all duration-300 md:ml-[280px] ml-0 pb-16 md:pb-0"
      >
        <div className="min-h-screen bg-mesh">
          <Outlet />
        </div>
      </motion.main>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-5">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link
              to="/calendar"
              className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/calendar' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs">Calgo</span>
            </Link>
            <Link
              to="/academics"
              className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/academics' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-xs">Academics</span>
            </Link>
            <Link
              to="/opportunities"
              className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/opportunities' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-xs">Opps</span>
            </Link>
            <Link
              to="/campus"
              className={`flex flex-col items-center justify-center py-2 ${location.pathname === '/campus' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Campus</span>
            </Link>
          </div>
        </div>
      </nav>
      <AIAssistant />
    </div>
  );
}
