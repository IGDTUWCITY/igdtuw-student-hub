import { motion } from 'framer-motion';
import { CalendarEvent } from '@/types/events';
import { isEventPast, formatEventTime } from '@/lib/eventUtils';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

type ShadeVariant = 'light' | 'bold';

const platformColors: Record<string, Record<ShadeVariant, string>> = {
  codeforces: {
    light: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
    bold: 'bg-sky-600 text-white dark:bg-sky-400 dark:text-slate-900',
  },
  atcoder: {
    light: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
    bold: 'bg-orange-500 text-white dark:bg-orange-400 dark:text-slate-900',
  },
  leetcode: {
    light: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    bold: 'bg-amber-600 text-white hover:bg-amber-700',
  },
  codechef: {
    light: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-100',
    bold: 'bg-rose-600 text-white dark:bg-rose-400 dark:text-slate-900',
  },
  hackerrank: {
    light: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
    bold: 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-900',
  },
  hackerearth: {
    light: 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100',
    bold: 'bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-900',
  },
  topcoder: {
    light: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100',
    bold: 'bg-violet-600 text-white dark:bg-violet-400 dark:text-slate-900',
  },
  unstop: {
    light: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-100',
    bold: 'bg-fuchsia-600 text-white dark:bg-fuchsia-400 dark:text-slate-900',
  },
  anonymous: {
    light: 'bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100',
    bold: 'bg-slate-600 text-white dark:bg-slate-400 dark:text-slate-900',
  },
};

function normalizePlatform(value?: unknown) {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|jp)$/i, '')
    .replace(/[^a-z0-9]+/g, '');
}

function getPlatformColor(platform?: string, variant: ShadeVariant = 'bold') {
  const key = normalizePlatform(platform);
  if (key.includes('codeforces')) return platformColors.codeforces[variant];
  if (key.includes('atcoder')) return platformColors.atcoder[variant];
  if (key.includes('leetcode')) return platformColors.leetcode[variant];
  if (key.includes('codechef')) return platformColors.codechef[variant];
  if (key.includes('hackerrank')) return platformColors.hackerrank[variant];
  if (key.includes('hackerearth')) return platformColors.hackerearth[variant];
  if (key.includes('topcoder')) return platformColors.topcoder[variant];
  return platformColors.anonymous[variant];
}

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const isPast = isEventPast(event);
  const shade: ShadeVariant = isPast ? 'light' : 'bold';
  const colorClass = getPlatformColor(event.platform || event.sourceName, shade);

  return (
    <motion.div
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-md px-2 py-1 transition-shadow hover:shadow-sm',
        colorClass,
        isPast && 'opacity-60',
        compact ? 'text-xs' : 'text-sm'
      )}
    >
      <p className={cn('font-medium truncate', compact && 'text-[11px]')}>
        {event.title}
      </p>
      {!compact && (
        <p className="text-xs opacity-75 mt-0.5">
          {formatEventTime(event.startTime)}
        </p>
      )}
    </motion.div>
  );
}
