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
    light: 'bg-teal-50 text-teal-800 dark:bg-teal-800 dark:text-teal-100',
    bold:  'bg-teal-500 text-white hover:bg-teal-600',

  },
  atcoder: {
    // Slate Blue – long / structured contests
    light: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100',
    bold:  'bg-indigo-500 text-white hover:bg-indigo-600',
  },
  leetcode: {
    // Soft Amber – practice / approachable
    light: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    bold: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  codechef: {
    light: 'bg-rose-50 text-rose-800 dark:bg-rose-800 dark:text-rose-100',
    bold:  'bg-rose-400 text-white hover:bg-rose-500',
  },
  hackerrank: {
    // Sage Green – complements sidebar without duplicating it
    light: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100',
    bold: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  hackerearth: {
    // Cool Cyan – secondary platform, softer than teal
    light: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100',
    bold: 'bg-cyan-600 text-white hover:bg-cyan-700',
  },
  topcoder: {
    // Neutral Violet – legacy / niche contests
    light: 'bg-violet-100 text-violet-900 dark:bg-violet-900 dark:text-violet-100',
    bold: 'bg-violet-600 text-white hover:bg-violet-700',
  },
  unstop: {
    // Warm Taupe / Sand – hackathons & internships
    light: 'bg-stone-100 text-stone-900 dark:bg-stone-900 dark:text-stone-100',
    bold: 'bg-stone-600 text-white hover:bg-stone-700',
  },
  anonymous: {
    // Graphite – neutral, background role
    light: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100',
    bold: 'bg-slate-600 text-white hover:bg-slate-700',
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
