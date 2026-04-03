import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from 'lucide-react';
import { useMemo } from 'react';

const QUOTES = [
  "Success doesn’t come from what you do occasionally, it comes from what you do consistently.",
  "Don’t watch the clock; do what it does—keep going.",
  "Push yourself, because no one else is going to do it for you.",
  "Dream big. Start small. Act now.",
  "The harder you work for something, the greater you’ll feel when you achieve it.",
  "Don’t stop when you’re tired. Stop when you’re done.",
  "Success is the sum of small efforts repeated daily.",
  "Believe you can and you’re halfway there.",
  "Doubt kills more dreams than failure ever will.",
  "Stay focused and never give up.",
  "Your only limit is your mind.",
  "Work hard in silence; let success make the noise.",
  "Great things never come from comfort zones.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Don’t wait for opportunity. Create it.",
  "Success doesn’t just find you—you have to go out and get it.",
  "The key to success is to focus on goals, not obstacles.",
  "You are stronger than you think.",
  "Little things make big days.",
  "It always seems impossible until it’s done.",
  "Do something today that your future self will thank you for.",
  "Don’t limit your challenges—challenge your limits.",
  "Start where you are. Use what you have. Do what you can.",
  "Success is not for the lazy.",
  "Stay positive, work hard, make it happen.",
  "Be stronger than your excuses.",
  "Difficult roads often lead to beautiful destinations.",
  "Failure is not the opposite of success; it’s part of success.",
  "Your life does not get better by chance, it gets better by change.",
  "If you want it, work for it.",
  "Small progress is still progress.",
  "Don’t be afraid to start over—it’s a chance to build something better.",
  "The best way to get started is to quit talking and begin doing.",
  "Discipline is doing what needs to be done, even when you don’t want to.",
  "You don’t have to be perfect to be amazing.",
  "Action is the foundational key to all success.",
  "The secret of getting ahead is getting started.",
  "Success usually comes to those who are too busy to be looking for it.",
  "Keep going. Everything you need will come to you at the perfect time.",
  "Hard work beats talent when talent doesn’t work hard.",
  "Don’t wish for it—work for it.",
  "You didn’t come this far to only come this far.",
  "Turn your dreams into plans.",
  "Make each day your masterpiece.",
  "What you do today can improve all your tomorrows.",
  "Stay hungry. Stay foolish.",
  "Be so good they can’t ignore you.",
  "Success starts with self-discipline.",
  "Keep pushing forward.",
  "Never give up on something you really want."
];

export function WelcomeHeader() {
  const { profile } = useAuth();

  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[randomIndex];
  }, []);

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
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-[#12423A] p-6 md:p-8 text-white shadow-md"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-5 h-5 text-white/80" />
          <span className="text-sm font-medium text-white/70">
            {getGreeting()}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-sm md:text-base text-white/80 max-w-xl italic">
          “{randomQuote}”
        </p>
      </div>
    </motion.div>
  );
}
