import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { CalendarEvent, SavedEvent, Reminder, EventType } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';

// Fetch events (shared calendar) for a date range
export function useEvents(from: Date, to: Date, type?: 'contest' | 'hackathon' | 'internship' | 'bootcamp') {
  return useQuery({
    queryKey: ['events', from.toISOString(), to.toISOString(), type],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
      const cacheKey = `events:${from.toISOString()}:${to.toISOString()}:${type || 'all'}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.ts && Date.now() - parsed.ts < CACHE_TTL_MS && Array.isArray(parsed.events)) {
            const revived = parsed.events.map((row: any) => ({
              id: row.id,
              title: row.title,
              description: row.description,
              startTime: new Date(row.startTime),
              endTime: new Date(row.endTime),
              type: row.type as EventType,
              sourceName: row.sourceName,
              sourceUrl: row.sourceUrl,
              platform: row.platform,
              tags: row.tags || [],
              lastSyncedAt: new Date(row.lastSyncedAt),
              dedupeKey: row.dedupeKey,
            } as CalendarEvent));
            return revived;
          }
        }
      } catch { void 0; }
      function normalizePlatform(value: unknown) {
        if (!value) return '';
        return value
          .toString()
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/\.(com|org|net|jp|io|dev)$/i, '')
          .replace(/[^a-z0-9]+/g, '');
      }

      const clistUsername = import.meta.env.VITE_CLIST_API_USERNAME;
      const clistApiKey = import.meta.env.VITE_CLIST_API_KEY;
      const allowedPlatformsRaw = (import.meta.env.VITE_CLIST_PLATFORMS || '')
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      const allowedPlatforms = allowedPlatformsRaw.map(normalizePlatform);

      if (!clistUsername || !clistApiKey) {
        throw new Error('CLIST API is not configured. Set VITE_CLIST_API_USERNAME and VITE_CLIST_API_KEY.');
      }

      // clist filter: contests that overlap [from, to]
      // start__lt=to AND end__gt=from
      const params = new URLSearchParams({
        username: clistUsername,
        api_key: clistApiKey,
        start__lt: to.toISOString(),
        end__gt: from.toISOString(),
        order_by: 'start',
      });

      // Narrow results server-side to reduce filtering issues when platform names vary
      if (allowedPlatformsRaw.length > 0) {
        const platformDomains = allowedPlatformsRaw.map(p => {
          const key = normalizePlatform(p);
          switch (key) {
            case 'codeforces':
              return 'codeforces.com';
            case 'atcoder':
              return 'atcoder.jp';
            case 'leetcode':
              return 'leetcode.com';
            case 'hackerrank':
              return 'hackerrank.com';
            case 'hackerearth':
              return 'hackerearth.com';
            case 'codechef':
              return 'codechef.com';
            default:
              return p.toLowerCase();
          }
        });

        params.set('resource__name__in', platformDomains.join(','));
      }

      const targetUrl = `https://clist.by/api/v1/json/contest/?${params.toString()}`;

      const response = await fetch(targetUrl, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch contests: ${errorText}`);
      }

      const payload = await response.json();

      // clist v1 returns { meta, objects } (commonly), not { events }
      const rawEvents = Array.isArray(payload.objects)
        ? payload.objects
        : Array.isArray(payload.events)
          ? payload.events
          : Array.isArray(payload)
            ? payload
            : [];

      let events = rawEvents.map((row: any) => ({
        id: row.id || row.dedupeKey || row.dedupe_key,
        title: row.title || row.event,
        description: row.description,
        startTime: new Date(row.startTime || row.start_time || row.start),
        endTime: new Date(row.endTime || row.end_time || row.end),
        type: (row.type || row.event_type || 'contest') as EventType,
        sourceName: row.sourceName || row.source_name || 'Contest Feed',
        sourceUrl: row.sourceUrl || row.source_url || row.href,
        platform: row.platform || row.resource?.name || row.resource_domain || row.resource || row.resource_id || row.host,
        tags: row.tags || [],
        lastSyncedAt: new Date(row.lastSyncedAt || row.last_synced_at || new Date()),
        dedupeKey: row.dedupeKey || row.dedupe_key || row.id || `${row.title}-${row.startTime || row.start}`,
      } as CalendarEvent));

      if (allowedPlatforms.length > 0) {
        events = events.filter(event => {
          const platformKey = normalizePlatform(event.platform || event.sourceName || '');
          return platformKey && allowedPlatforms.includes(platformKey);
        });
      }

      if (type) {
        events = events.filter(event => event.type === type);
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), events }));
      } catch { void 0; }
      return events;
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
  });
}


// Fetch saved events for current user (using user_events with reminder enabled)
export function useSavedEvents() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['saved-events', user?.id],
    queryFn: async (): Promise<SavedEvent[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      let events = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        eventId: row.id,
        notes: row.description,
        createdAt: new Date(row.created_at),
        event: {
          id: row.id,
          title: row.title,
          description: row.description,
          startTime: new Date(row.event_date),
          endTime: new Date(row.event_date),
          type: (row.event_type || 'contest') as EventType,
          sourceName: row.source_announcement_id ? 'announcement' : row.source_opportunity_id ? 'opportunity' : 'user',
          tags: [],
          lastSyncedAt: new Date(row.created_at),
          dedupeKey: `${row.id}-${row.event_type}`,
        } as CalendarEvent,
      }));
      
      // Add dummy saved events if none exist
      if (events.length === 0) {
        const today = new Date();
        const dummyEvent: CalendarEvent = {
          id: 'dummy-saved',
          title: 'ACM ICPC Regional Contest',
          description: 'National-level competitive programming contest',
          startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
          endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
          type: 'contest',
          sourceName: 'clist',
          tags: ['competitive', 'algorithms'],
          lastSyncedAt: today,
          dedupeKey: 'dummy-saved-contest',
        };
        
        events = [{
          id: 'dummy-saved-1',
          userId: user.id,
          eventId: 'dummy-saved',
          notes: 'Practice for competitive programming',
          createdAt: today,
          event: dummyEvent,
        }];
      }
      
      return events;
    },
    enabled: !!user,
  });
}

// Save an event
export function useSaveEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ eventId, notes, title }: { eventId: string; notes?: string; title: string }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('user_events')
        .insert({ 
          user_id: user.id, 
          title: title,
          description: notes,
          event_date: new Date().toISOString(),
          event_type: 'custom'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-events'] });
    },
  });
}

// Remove saved event
export function useRemoveSavedEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('user_id', user.id)
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-events'] });
    },
  });
}

// Fetch reminders for current user (using user_events with reminder_enabled)
export function useReminders() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reminders', user?.id],
    queryFn: async (): Promise<Reminder[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('reminder_enabled', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        eventId: row.id,
        offsetMinutes: 15, // Default offset
        googleEventId: undefined,
        syncStatus: 'pending' as const,
        createdAt: new Date(row.created_at),
        event: {
          id: row.id,
          title: row.title,
          description: row.description,
          startTime: new Date(row.event_date),
          endTime: new Date(row.event_date),
          type: (row.event_type || 'contest') as EventType,
          sourceName: row.source_announcement_id ? 'announcement' : row.source_opportunity_id ? 'opportunity' : 'user',
          tags: [],
          lastSyncedAt: new Date(row.created_at),
          dedupeKey: `${row.id}-${row.event_type}`,
        } as CalendarEvent,
      }));
    },
    enabled: !!user,
  });
}

// Set a reminder
export function useSetReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ eventId, offsetMinutes }: { eventId: string; offsetMinutes: number }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('user_events')
        .update({ 
          reminder_enabled: true
        })
        .eq('user_id', user.id)
        .eq('id', eventId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

// Remove reminder
export function useRemoveReminder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('user_events')
        .update({ reminder_enabled: false })
        .eq('user_id', user.id)
        .eq('id', eventId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
}

// Check if event is saved
export function useIsEventSaved(eventId: string) {
  const { data: savedEvents } = useSavedEvents();
  return savedEvents?.some(se => se.eventId === eventId) ?? false;
}

// Get reminder for event
export function useEventReminder(eventId: string) {
  const { data: reminders } = useReminders();
  return reminders?.find(r => r.eventId === eventId);
} 
