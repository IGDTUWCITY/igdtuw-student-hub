import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarGrid } from '@/components/CalendarGrid';
import { EventDrawer } from '@/components/EventDrawer';
import { CalendarEvent } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
// import '@/styles/globals.css';

export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dateRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { from, to };
  }, []);

  const { data: events = [], isLoading, isError, error, refetch } = useEvents(dateRange.from, dateRange.to);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedEvent(null), 300);
  };

  return (
    <div className="min-h-screen w-full bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <p className="text-muted-foreground">Could not load contests.</p>
            <p className="text-xs text-muted-foreground max-w-lg text-center">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <button
              type="button"
              className="text-sm px-3 py-2 rounded-md border border-border hover:bg-muted transition"
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border shadow-sm">
            <CalendarGrid
              events={events.length > 0 ? events : []}
              onEventClick={handleEventClick}
              loading={isLoading}
            />
          </div>
        )}
      </motion.div>

      <EventDrawer event={selectedEvent} isOpen={drawerOpen} onClose={handleCloseDrawer} />
    </div>
  );
}