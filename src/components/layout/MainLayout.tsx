import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { motion } from 'framer-motion';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="ml-[280px] transition-all duration-300"
      >
        <div className="min-h-screen bg-mesh">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
