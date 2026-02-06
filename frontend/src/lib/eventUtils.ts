import { CalendarEvent } from '@/types/events';

// Transform database row to CalendarEvent
export function transformDbEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    deadlineTime: row.deadline_time ? new Date(row.deadline_time) : undefined,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    platform: row.platform,
    tags: row.tags || [],
    description: row.description,
    lastSyncedAt: new Date(row.last_synced_at),
    dedupeKey: row.dedupe_key,
  };
}

// Check if event is in the past
export function isEventPast(event: CalendarEvent): boolean {
  return event.endTime < new Date();
}

// Check if event is happening now
export function isEventOngoing(event: CalendarEvent): boolean {
  const now = new Date();
  return event.startTime <= now && event.endTime >= now;
}

// Get events for a specific day
export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return events.filter(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    // Event overlaps with this day
    return eventStart <= dayEnd && eventEnd >= dayStart;
  });
}

// Get month data for calendar grid
export function getMonthData(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  // Get previous month's trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: Date[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(new Date(year, month - 1, prevMonthLastDay - i));
  }

  // Current month days
  const currentMonthDays: Date[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(new Date(year, month, i));
  }

  // Next month's leading days
  const totalCells = 42; // 6 rows × 7 days
  const nextMonthDays: Date[] = [];
  const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(new Date(year, month + 1, i));
  }

  return {
    prevMonthDays,
    currentMonthDays,
    nextMonthDays,
    allDays: [...prevMonthDays, ...currentMonthDays, ...nextMonthDays],
  };
}

// Format date for display
export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString([], { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMs < 0) {
    return 'Ended';
  } else if (diffHours < 1) {
    return 'Starting soon';
  } else if (diffHours < 24) {
    return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else {
    return formatEventDate(date);
  }
}
