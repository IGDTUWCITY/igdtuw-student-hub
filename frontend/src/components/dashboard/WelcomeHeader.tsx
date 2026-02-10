import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from 'lucide-react';

export function WelcomeHeader() {
  const { profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Student';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-info p-6 md:p-8 text-primary-foreground"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">
            {getGreeting()}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-sm md:text-base opacity-90 max-w-xl">
          {profile?.branch
            ? `${profile.branch} • ${profile.year || 'Year not set'} • Semester ${profile.current_semester || 'N/A'}`
            : 'Complete your profile to get personalized recommendations'}
        </p>
      </div>
    </motion.div>
  );
}
