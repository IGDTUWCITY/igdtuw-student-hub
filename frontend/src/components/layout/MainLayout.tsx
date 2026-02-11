import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';
import { AIAssistant } from '@/components/ai/AIAssistant';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="transition-all duration-300 ml-[80px] md:ml-[280px]"
      >
        <div className="min-h-screen bg-mesh">
          <Outlet />
        </div>
      </motion.main>
      <AIAssistant />
    </div>
  );
}
