export type EventType = 'contest' | 'hackathon' | 'internship' | 'bootcamp';

export interface CalendarEvent {
	id: string;
	title: string;
	type: EventType;
	startTime: Date;
	endTime: Date;
	deadlineTime?: Date;
	sourceName: string;
	sourceUrl?: string;
	platform?: string;
	tags: string[];
	description?: string;
	lastSyncedAt: Date;
	dedupeKey: string;
}

export interface SavedEvent {
	id: string;
	userId: string;
	eventId: string;
	notes?: string;
	createdAt: Date;
	event?: CalendarEvent;
}

export interface Reminder {
	id: string;
	userId: string;
	eventId: string;
	offsetMinutes: number;
	googleEventId?: string;
	syncStatus: 'pending' | 'synced' | 'failed';
	createdAt: Date;
	event?: CalendarEvent;
}

export interface UserProfile {
	id: string;
	userId: string;
	displayName?: string;
	googleCalendarConnected: boolean;
	googleCalendarId?: string;
}

// View modes for the calendar
export type CalendarViewMode = 'month' | 'week' | 'list';

// Reminder offset options
export const REMINDER_OFFSETS = [
	{ label: '1 hour before', value: 60 },
	{ label: '6 hours before', value: 360 },
	{ label: '24 hours before', value: 1440 },
	{ label: 'Custom', value: -1 },
] as const;

// Event type display info
export const EVENT_TYPE_INFO: Record<EventType, { label: string; colorClass: string }> = {
	contest: { label: 'Contest', colorClass: 'event-contest' },
	hackathon: { label: 'Hackathon', colorClass: 'event-hackathon' },
	internship: { label: 'Internship Deadline', colorClass: 'event-internship' },
	bootcamp: { label: 'Bootcamp', colorClass: 'event-bootcamp' },
};
