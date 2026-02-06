import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Announcement, Society } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Megaphone,
  Users,
  Calendar,
  MapPin,
  ExternalLink,
  CalendarPlus,
  Loader2,
  Instagram,
  Linkedin,
  Pin,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Campus() {
  const { user, profile, refreshProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [recommendations, setRecommendations] = useState<(Society & { score?: number })[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recFetched, setRecFetched] = useState(false);
  const [interestInput, setInterestInput] = useState('');
  const [savingInterest, setSavingInterest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('campusActiveTab') || 'announcements';
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('campusActiveTab', activeTab);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch announcements with society info
    const { data: announcementsData } = await supabase
      .from('announcements')
      .select('*, society:societies(*)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (announcementsData) {
      setAnnouncements(announcementsData as Announcement[]);
    }

    // Fetch societies
    const { data: societiesData } = await supabase
      .from('societies')
      .select('*')
      .order('name');

    if (societiesData) {
      setSocieties(societiesData as Society[]);
    }

    setLoading(false);
  };

  const addToCalendar = async (announcement: Announcement) => {
    if (!announcement.event_date) {
      toast.error('This announcement has no event date');
      return;
    }

    const { error } = await supabase.from('user_events').insert({
      user_id: user!.id,
      title: announcement.title,
      description: announcement.content,
      event_date: announcement.event_date,
      event_type: 'campus',
      source_announcement_id: announcement.id,
    });

    if (error) {
      toast.error('Failed to add to calendar');
    } else {
      toast.success('Added to your calendar');
    }
  };

  const saveInterest = async () => {
    if (!user) {
      toast.error('Please sign in to save interests');
      return;
    }

    const trimmed = interestInput.trim();
    if (!trimmed) return;

    setSavingInterest(true);
    const current = profile?.interests || [];
    const next = Array.from(new Set([...current, trimmed]));

    const { error } = await supabase
      .from('profiles')
      .update({ interests: next })
      .eq('id', user.id);

    if (error) {
      toast.error(error.message || 'Failed to save interest');
    } else {
      setInterestInput('');
      await refreshProfile();
      toast.success('Interest saved');
    }

    setSavingInterest(false);
  };

  const fetchRecommendations = async () => {
    if (!user) {
      toast.error('Please sign in to get recommendations');
      return;
    }

    setRecLoading(true);
    setRecError(null);
    setRecFetched(true);

    try {
      const response = await fetch(`${backendUrl}/api/recommend-societies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, limit: 6 }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data.recommendations || []);
    } catch (error) {
      setRecError(error instanceof Error ? error.message : 'Failed to fetch recommendations');
    } finally {
      setRecLoading(false);
    }
  };

  const AnnouncementCard = ({
    announcement,
  }: {
    announcement: Announcement;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {announcement.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </Badge>
                )}
                {announcement.society && (
                  <Badge variant="outline">{announcement.society.name}</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{announcement.title}</CardTitle>
              <CardDescription className="mt-1">
                {format(new Date(announcement.created_at), 'MMMM d, yyyy')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {announcement.content}
          </p>

          {announcement.image_url && (
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          {(announcement.event_date || announcement.event_location) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {announcement.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(announcement.event_date), 'MMM d, yyyy h:mm a')}
                </span>
              )}
              {announcement.event_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {announcement.event_location}
                </span>
              )}
            </div>
          )}

          {announcement.event_date && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToCalendar(announcement)}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const SocietyCard = ({ society }: { society: Society }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="card-hover h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {society.logo_url ? (
              <img
                src={society.logo_url}
                alt={society.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{society.name}</CardTitle>
              {society.category && (
                <CardDescription>{society.category}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {society.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {society.description}
            </p>
          )}

          <div className="flex gap-2">
            {society.instagram_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(society.instagram_url, '_blank')}
              >
                <Instagram className="w-4 h-4" />
              </Button>
            )}
            {society.linkedin_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(society.linkedin_url, '_blank')}
              >
                <Linkedin className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Campus Life
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with society events and announcements
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="w-4 h-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="societies" className="gap-2">
            <Users className="w-4 h-4" />
            Societies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No announcements yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Check back later for updates from societies
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {announcements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AnnouncementCard announcement={announcement} />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="societies">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : societies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No societies listed
              </h3>
              <p className="text-muted-foreground text-sm">
                Societies will be added soon
              </p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Confused which society to join?
                  </CardTitle>
                  <CardDescription>
                    IGDTUW City has got your back. Tell us your interests to get recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(!profile?.interests || profile.interests.length === 0) && (
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input
                        placeholder="Add an interest (e.g., AI, Robotics, Design)"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                      />
                      <Button
                        onClick={saveInterest}
                        disabled={savingInterest || !interestInput.trim()}
                      >
                        {savingInterest ? 'Saving...' : 'Save interest'}
                      </Button>
                    </div>
                  )}

                  {profile?.interests && profile.interests.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      You can edit your interests in the Profile section and save changes.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(profile?.interests || []).map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={fetchRecommendations} disabled={recLoading}>
                      {recLoading ? 'Finding matches...' : 'Show recommendations'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = '/settings')}
                    >
                      Edit interests in Profile
                    </Button>
                  </div>

                  {recError && (
                    <p className="text-sm text-destructive">{recError}</p>
                  )}

                  {recFetched && !recLoading && recommendations.length === 0 && !recError && (
                    <p className="text-sm text-muted-foreground">
                      Sorry, we couldn’t find a match for these interests right now.
                      Try adding a few broader interests and explore other clubs below.
                    </p>
                  )}

                  {recommendations.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendations.map((society) => (
                        <SocietyCard key={society.id} society={society} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {societies.map((society, index) => (
                  <motion.div
                    key={society.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SocietyCard society={society} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
