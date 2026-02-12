import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '@/types/events';
import { getMonthData, getEventsForDay } from '@/lib/eventUtils';
import { EventCard } from './EventCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, addDays } from 'date-fns';

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
  const isMobile = useIsMobile();

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

  // Mobile: Get next 7 days
  const upcomingDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

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
    <div className="flex flex-col h-screen md:h-screen w-full">
     <div className="text-center mt-6 mb-4 px-4 md:px-6">
  <h1
    className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground"
    style={{ fontFamily: 'Manrope, Inter, sans-serif' }}
  >
    Calendar of Algorithms
  </h1>
  <h4 className="text-xs md:text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
    Stay updated with upcoming contests and events from various platforms. Filter by platform and never miss a challenge!
  </h4>
</div>

      {/* Header */}
      {!isMobile && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-4 md:px-6 pt-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[180px] text-center">{monthName}</h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
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
      )}

      {isMobile && (
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {PLATFORM_FILTERS.map(p => {
              const active = selectedPlatforms.includes(p.key);
              return (
                <Badge
                  key={p.key}
                  className={cn(
                    'cursor-pointer transition-colors whitespace-nowrap',
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
      )}

      {/* Mobile List View */}
      {isMobile ? (
        <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4">
          {upcomingDays.map((date) => {
            const dayEvents = getEventsForDay(filteredEvents, date);
            if (dayEvents.length === 0) return null;

            return (
              <div key={date.toISOString()} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background py-2 z-10">
                  {format(date, 'EEEE, d MMM')}
                </h3>
                <div className="space-y-2">
                  {dayEvents.map((event) => {
                     const platform = PLATFORM_FILTERS.find(p => p.key === normalizePlatform(event.platform || event.sourceName));
                     const durationMs = event.endTime.getTime() - event.startTime.getTime();
                     const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
                     const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                     const durationStr = `${durationHrs}h ${durationMins > 0 ? `${durationMins}m` : ''}`;

                     return (
                      <div 
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card active:bg-accent/50 transition-colors"
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex flex-col items-center min-w-[3rem]">
                          <span className="text-sm font-bold text-foreground">
                            {format(event.startTime, 'HH:mm')}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate leading-tight mb-1">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{durationStr}</span>
                            <span>•</span>
                            <span className={cn(
                              "font-medium",
                              platform?.key === 'leetcode' && "text-amber-600",
                              platform?.key === 'codeforces' && "text-teal-600",
                              platform?.key === 'atcoder' && "text-indigo-600",
                              platform?.key === 'codechef' && "text-rose-600"
                            )}>
                              {platform?.label || event.sourceName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {upcomingDays.every(date => getEventsForDay(filteredEvents, date).length === 0) && (
             <div className="text-center py-10 text-muted-foreground text-sm">
               No contests in the next 7 days based on your filters.
             </div>
          )}
        </div>
      ) : (
      /* Calendar grid */
      <div className="flex-1 border border-border overflow-hidden bg-card mx-[6.5px] mb-[6.5px] rounded-xl">
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
        <div className="grid grid-cols-7 grid-rows-5 h-[calc(100%-1.7rem)] gap-0">
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
                    'border-b border-r border-calendar-grid-line p-3 h-full overflow-hidden flex flex-col',
                    !isCurrentMonth && 'bg-muted/30',
                    isWeekend && isCurrentMonth && 'bg-muted/20'
                  )}
                >
                  <div className="flex items-center justify-center mb-0.5">
                    <span
                      className={cn(
                        'text-[11px] sm:text-xs font-medium w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full',
                        !isCurrentMonth && 'text-muted-foreground',
                        isToday && 'bg-primary text-primary-foreground',
                        isWeekend && isCurrentMonth && !isToday && 'text-calendar-weekend'
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                  
                  <div
                    className={cn(
                      'space-y-0.5',
                      dayEvents.length > 2 && 'flex-1 overflow-y-auto scrollbar-thin pr-0.5'
                    )}
                  >
                    {loading ? (
                      <div className="space-y-1">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </div>
                    ) : (
                      dayEvents.map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          compact
                          onClick={() => onEventClick(event)}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      )}
    </div>
  );
}
