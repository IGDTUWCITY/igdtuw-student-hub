import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calculator, Search, Calendar, User } from 'lucide-react';

const actions = [
  {
    icon: Calculator,
    label: 'CGPA Calculator',
    description: 'Calculate your SGPA/CGPA',
    path: '/academics',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Search,
    label: 'Find Opportunities',
    description: 'Explore hackathons & internships',
    path: '/opportunities',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: Calendar,
    label: 'Upcoming Events',
    description: 'Check society events',
    path: '/campus',
    color: 'bg-info/10 text-info',
  },
  {
    icon: User,
    label: 'Profile',
    description: 'Manage your details',
    path: '/settings',
    color: 'bg-success/10 text-success',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.path}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Link
            to={action.path}
            className="block p-4 rounded-xl bg-card border border-border card-hover group"
          >
            <div
              className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
            >
              <action.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">
              {action.label}
            </h3>
            <p className="text-xs text-muted-foreground">{action.description}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
