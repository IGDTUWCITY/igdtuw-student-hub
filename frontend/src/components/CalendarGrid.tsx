import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '@/types/events';
import { getMonthData, getEventsForDay } from '@/lib/eventUtils';
import { EventCard } from './EventCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  loading?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PLATFORM_FILTERS = [
  {
    key: 'leetcode',
    label: 'LeetCode',
    color: 'bg-amber-500 text-white hover:bg-amber-600',
    dim: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  },
  {
    key: 'codeforces',
    label: 'Codeforces',
    color: 'bg-teal-500 text-white hover:bg-teal-600',
    dim: 'bg-teal-50 text-teal-800 dark:bg-teal-800 dark:text-teal-100',
  },
  {
    key: 'atcoder',
    label: 'AtCoder',
    color: 'bg-indigo-500 text-white hover:bg-indigo-600',
    dim: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100',
  },
  {
    key: 'codechef',
    label: 'CodeChef',
    color: 'bg-rose-400 text-white hover:bg-rose-500',
    dim: 'bg-rose-50 text-rose-800 dark:bg-rose-800 dark:text-rose-100',
  },
  {
    key: 'anonymous',
    label: 'Anonymous',
    color: 'bg-slate-600 text-white hover:bg-slate-700',
    dim: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
  },
];


function normalizePlatform(value?: unknown) {
  if (!value) return 'anonymous';
  const key = value
    .toString()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|jp)$/i, '')
    .replace(/[^a-z0-9]+/g, '');
  if (key.includes('leetcode')) return 'leetcode';
  if (key.includes('codeforces')) return 'codeforces';
  if (key.includes('atcoder')) return 'atcoder';
  if (key.includes('codechef')) return 'codechef';
  return 'anonymous';
}

export function CalendarGrid({ events, onEventClick, loading }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(PLATFORM_FILTERS.map(p => p.key));
  const selectedTypes = ['contest'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthData = useMemo(() => getMonthData(year, month), [year, month]);
  
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (!selectedTypes.includes(e.type)) return false;
      const platformKey = normalizePlatform(e.platform || e.sourceName);
      return selectedPlatforms.includes(platformKey);
    });
  }, [events, selectedTypes, selectedPlatforms]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const togglePlatform = (key: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-120px)] w-full">
     <div className="text-center mt-6 mb-4 px-4 md:px-6">
  <h1
          className="text-2xl md:text-4xl font-semibold tracking-tight text-primary"
    style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
  >
    Calendar of Algorithms
  </h1>
</div>


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-4 md:px-6 pt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="group hover:bg-primary/10 hover:border-primary/30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[180px] text-center">{monthName}</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="group hover:bg-primary/10 hover:border-primary/30 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="ml-2">
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {PLATFORM_FILTERS.map(p => {
            const active = selectedPlatforms.includes(p.key);
            return (
              <Badge
                key={p.key}
                className={cn(
                  'cursor-pointer transition-colors',
                  active ? p.color : p.dim
                )}
                onClick={() => togglePlatform(p.key)}
              >
                {p.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card mx-4 md:mx-6 mb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/50">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                'py-2 text-center text-xs font-medium',
                (i === 0 || i === 6) && 'text-calendar-weekend'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 grid-rows-5 h-[calc(100%-2.5rem)] gap-0">
          <AnimatePresence mode="wait">
            {monthData.allDays.map((date, i) => {
              const isCurrentMonth = date.getMonth() === month;
              const isToday = date.toDateString() === today.toDateString();
              const dayEvents = getEventsForDay(filteredEvents, date);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <motion.div
                  key={date.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={cn(
                    'border-b border-r border-calendar-grid-line p-3 min-h-[80px] sm:min-h-[100px] overflow-hidden',
                    !isCurrentMonth && 'bg-muted/30',
                    isWeekend && isCurrentMonth && 'bg-muted/20'
                  )}
                >
                  <div className="flex items-center justify-center mb-1">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-medium w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full',
                        !isCurrentMonth && 'text-muted-foreground',
                        isToday && 'bg-primary text-primary-foreground',
                        isWeekend && isCurrentMonth && !isToday && 'text-calendar-weekend'
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  
                  <div className="space-y-0.5 overflow-y-auto max-h-[60px] sm:max-h-[80px] scrollbar-thin">
                    {loading ? (
                      <div className="space-y-1">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </div>
                    ) : (
                      dayEvents.slice(0, 3).map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          compact
                          onClick={() => onEventClick(event)}
                        />
                      ))
                    )}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
