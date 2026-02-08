import { X, ExternalLink, Bookmark, BookmarkCheck, Bell, BellOff, Clock, Tag, Calendar, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent, EVENT_TYPE_INFO, REMINDER_OFFSETS } from '@/types/events';
import { isEventPast, formatEventDate, formatEventTime, formatRelativeTime } from '@/lib/eventUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedEvents, useSaveEvent, useRemoveSavedEvent, useReminders, useSetReminder, useRemoveReminder } from '@/hooks/useEvents';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface EventDrawerProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDrawer({ event, isOpen, onClose }: EventDrawerProps) {
  const { user } = useAuth();
  const { data: savedEvents } = useSavedEvents();
  const { data: reminders } = useReminders();
  const saveEvent = useSaveEvent();
  const removeSavedEvent = useRemoveSavedEvent();
  const setReminder = useSetReminder();
  const removeReminder = useRemoveReminder();

  if (!event) return null;

  const isPast = isEventPast(event);
  const typeInfo = EVENT_TYPE_INFO[event.type];
  const isSaved = savedEvents?.some(se => se.eventId === event.id);
  const reminder = reminders?.find(r => r.eventId === event.id);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error('Please sign in to save events');
      return;
    }
    
    try {
      if (isSaved) {
        await removeSavedEvent.mutateAsync(event.id);
        toast.success('Event removed from saved');
      } else {
        await saveEvent.mutateAsync({ eventId: event.id, title: event.title });
        toast.success('Event saved!');
      }
    } catch (error) {
      toast.error('Failed to update saved events');
    }
  };

  const handleSetReminder = async (offsetMinutes: number) => {
    if (!user) {
      toast.error('Please sign in to set reminders');
      return;
    }
    
    try {
      await setReminder.mutateAsync({ eventId: event.id, offsetMinutes });
      toast.success('Reminder set!');
    } catch (error) {
      toast.error('Failed to set reminder');
    }
  };

  const handleRemoveReminder = async () => {
    if (!user) return;
    
    try {
      await removeReminder.mutateAsync(event.id);
      toast.success('Reminder removed');
    } catch (error) {
      toast.error('Failed to remove reminder');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-card shadow-lg"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'font-medium',
                    event.type === 'contest' && 'bg-event-contest-bg text-event-contest',
                    event.type === 'hackathon' && 'bg-event-hackathon-bg text-event-hackathon',
                    event.type === 'internship' && 'bg-event-internship-bg text-event-internship',
                    event.type === 'bootcamp' && 'bg-event-bootcamp-bg text-event-bootcamp',
                  )}
                >
                  {typeInfo.label}
                </Badge>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                <div className={cn(isPast && 'opacity-60')}>
                  <h2 className="text-xl font-semibold leading-tight">{event.title}</h2>
                  
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatRelativeTime(event.startTime)}
                  </p>

                  <Separator className="my-4" />

                  {/* Time details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Start</p>
                        <p className="text-sm text-muted-foreground">
                          {formatEventDate(event.startTime)} at {formatEventTime(event.startTime)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">End</p>
                        <p className="text-sm text-muted-foreground">
                          {formatEventDate(event.endTime)} at {formatEventTime(event.endTime)}
                        </p>
                      </div>
                    </div>

                    {event.deadlineTime && (
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 text-destructive" />
                        <div>
                          <p className="text-sm font-medium">Registration Deadline</p>
                          <p className="text-sm text-muted-foreground">
                            {formatEventDate(event.deadlineTime)} at {formatEventTime(event.deadlineTime)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Source info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Link2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Source</p>
                        <p className="text-sm text-muted-foreground">{event.sourceName}</p>
                        {event.platform && (
                          <p className="text-xs text-muted-foreground">via {event.platform}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex items-start gap-3">
                        <Tag className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {event.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  {event.description && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </>
                  )}

                  {/* Last synced */}
                  <Separator className="my-4" />
                  <p className="text-xs text-muted-foreground">
                    Last synced: {formatEventDate(event.lastSyncedAt)} at {formatEventTime(event.lastSyncedAt)}
                  </p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="border-t border-border p-4 space-y-2">
                {event.type !== 'contest' && (
                  <div className="flex gap-2">
                    <Button
                      variant={isSaved ? 'secondary' : 'outline'}
                      className="flex-1 gap-2"
                      onClick={handleSaveToggle}
                      disabled={saveEvent.isPending || removeSavedEvent.isPending}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="h-4 w-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4" />
                          Save for Later
                        </>
                      )}
                    </Button>

                    {reminder ? (
                      <Button
                        variant="secondary"
                        className="flex-1 gap-2"
                        onClick={handleRemoveReminder}
                        disabled={removeReminder.isPending}
                      >
                        <BellOff className="h-4 w-4" />
                        Remove Reminder
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex-1 gap-2">
                            <Bell className="h-4 w-4" />
                            Set Reminder
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {REMINDER_OFFSETS.filter(o => o.value > 0).map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() => handleSetReminder(option.value)}
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}

                {event.sourceUrl && (
                  <Button
                    variant="default"
                    className="w-full gap-2"
                    asChild
                  >
                    <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open Registration
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
