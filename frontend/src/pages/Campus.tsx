import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Announcement, Society } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Plus,
  Edit,
  Trash2,
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

  const PR_ALLOWED_EMAILS = useMemo(() => new Set<string>([
    'chadhaaarohi@gmail.com',
  ].map(e => e.toLowerCase())), []);
  const canPost = !!user?.email && PR_ALLOWED_EMAILS.has(user.email.toLowerCase());

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
    const { data: announcementsData, error: annError } = await supabase
      .from('announcements')
      .select('*, society:societies(*)')
      .order('created_at', { ascending: false });

    if (annError) {
      toast.error(annError.message || 'Failed to load announcements');
      setAnnouncements([]);
    } else if (announcementsData) {
      const now = new Date();
      const active = (announcementsData as Announcement[]).filter((a) => {
        if (!a.event_date) return true;
        const [y, m, d] = String((a as any).event_date).split('-').map((s: string) => parseInt(s, 10));
        const timeStr = (a as any).end_time || (a as any).start_time || '23:59';
        const [hh, mm] = String(timeStr).split(':').map((s: string) => parseInt(s, 10));
        const end = new Date(y, m - 1, d, hh || 0, mm || 0);
        return end.getTime() >= now.getTime();
      });
      setAnnouncements(active);
    }

    // Fetch societies
    const { data: societiesData, error: socError } = await supabase
      .from('societies')
      .select('*')
      .order('name');

    if (socError) {
      toast.error(socError.message || 'Failed to load societies');
      setSocieties([]);
    } else if (societiesData) {
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
      description: [announcement.short_desc, announcement.full_details].filter(Boolean).join('\n\n'),
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
            {canPost && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => openEditAnnouncement(announcement)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDeleteAnnouncement(announcement.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {announcement.short_desc}
          </p>

          {announcement.image_url && (
            <img
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          {(announcement.event_date || announcement.venue) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {announcement.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(`${announcement.event_date}T${announcement.start_time || '00:00'}`), 'MMM d, yyyy')}
                  {announcement.start_time && (
                    <span className="ml-1">
                      {announcement.start_time}
                      {announcement.end_time ? ` - ${announcement.end_time}` : ''}
                    </span>
                  )}
                </span>
              )}
              {announcement.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {announcement.venue}
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
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => openViewAnnouncement(announcement)}>
              View more
            </Button>
          </div>
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
        {society.logo_url ? (
          <img src={society.logo_url} alt={society.name} className="w-full h-40 object-cover rounded-t-lg" />
        ) : (
          <div className="w-full h-40 rounded-t-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-10 h-10 text-primary" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{society.name}</CardTitle>
              {society.category && (
                <Badge variant="outline" className="mt-1">{society.category}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {society.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {society.description}
            </p>
          )}
          <div className="flex gap-2">
            {society.instagram_url && (
              <Button variant="ghost" size="icon" onClick={() => window.open(society.instagram_url, '_blank')}>
                <Instagram className="w-4 h-4" />
              </Button>
            )}
            {society.linkedin_url && (
              <Button variant="ghost" size="icon" onClick={() => window.open(society.linkedin_url, '_blank')}>
                <Linkedin className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const [viewAnnouncement, setViewAnnouncement] = useState<Announcement | null>(null);
  const openViewAnnouncement = (a: Announcement) => setViewAnnouncement(a);
  const closeViewAnnouncement = () => setViewAnnouncement(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);
  const openEditAnnouncement = (a: Announcement) => setEditAnnouncement(a);
  const closeEditAnnouncement = () => setEditAnnouncement(null);

  const [societyFormOpen, setSocietyFormOpen] = useState(false);
  const openSocietyForm = () => setSocietyFormOpen(true);
  const closeSocietyForm = () => setSocietyFormOpen(false);

  const [annForm, setAnnForm] = useState({
    title: '',
    societyId: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    shortDesc: '',
    fullDetails: '',
    regLink: '',
    contact: '',
    tags: '',
  });

  const [socForm, setSocForm] = useState({
    name: '',
    purpose: '',
    category: '',
    imageFile: null as File | null,
    instagram: '',
    linkedin: '',
  });

  const resetAnnForm = () => setAnnForm({
    title: '',
    societyId: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    shortDesc: '',
    fullDetails: '',
    regLink: '',
    contact: '',
    tags: '',
  });

  const resetSocForm = () => setSocForm({
    name: '',
    purpose: '',
    category: '',
    imageFile: null,
    instagram: '',
    linkedin: '',
  });

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      toast.error(error.message || 'Failed to delete');
    } else {
      toast.success('Deleted');
      fetchData();
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.societyId || !annForm.date || !annForm.startTime || !annForm.endTime || !annForm.venue.trim() || !annForm.shortDesc.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    const start = new Date(`${annForm.date}T${annForm.startTime}`);
    const end = new Date(`${annForm.date}T${annForm.endTime}`);
    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }
    const tagsArr = annForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from('announcements').insert({
      title: annForm.title,
      society_id: annForm.societyId,
      event_date: annForm.date,
      start_time: annForm.startTime,
      end_time: annForm.endTime,
      venue: annForm.venue,
      short_desc: annForm.shortDesc,
      full_details: annForm.fullDetails || '',
      registration_url: annForm.regLink || null,
      contact_info: annForm.contact || null,
      tags: tagsArr,
      created_by: user?.id || null,
    });
    if (error) {
      toast.error(error.message || 'Failed to create announcement');
      return;
    }
    toast.success('Announcement created');
    resetAnnForm();
    closeCreate();
    fetchData();
  };

  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncement) return;
    if (!annForm.title.trim() || !annForm.societyId || !annForm.date || !annForm.startTime || !annForm.endTime || !annForm.venue.trim() || !annForm.shortDesc.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    const start = new Date(`${annForm.date}T${annForm.startTime}`);
    const end = new Date(`${annForm.date}T${annForm.endTime}`);
    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }
    const { error } = await supabase.from('announcements').update({
      title: annForm.title,
      society_id: annForm.societyId,
      event_date: annForm.date,
      start_time: annForm.startTime,
      end_time: annForm.endTime,
      venue: annForm.venue,
      short_desc: annForm.shortDesc,
      full_details: annForm.fullDetails || '',
    }).eq('id', editAnnouncement.id);
    if (error) {
      toast.error(error.message || 'Failed to update');
      return;
    }
    toast.success('Announcement updated');
    closeEditAnnouncement();
    resetAnnForm();
    fetchData();
  };

  const uploadSocietyImage = async (file: File): Promise<string | null> => {
    const path = `society-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('society-images').upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message || 'Image upload failed');
      return null;
    }
    const { data } = supabase.storage.from('society-images').getPublicUrl(path);
    return data.publicUrl || null;
  };

  const handleAddSociety = async () => {
    if (!socForm.name.trim() || !socForm.purpose.trim() || !socForm.category || !socForm.imageFile) {
      toast.error('Please fill all required fields and upload image');
      return;
    }
    let logoUrl: string | null = null;
    if (socForm.imageFile) {
      const url = await uploadSocietyImage(socForm.imageFile);
      if (!url) return;
      logoUrl = url;
    }
    const { error } = await supabase.from('societies').insert({
      name: socForm.name,
      description: socForm.purpose,
      category: socForm.category,
      logo_url: logoUrl,
      instagram_url: socForm.instagram || null,
      linkedin_url: socForm.linkedin || null,
    });
    if (error) {
      toast.error(error.message || 'Failed to add society');
      return;
    }
    toast.success('Society added');
    resetSocForm();
    closeSocietyForm();
    fetchData();
  };

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
                {canPost ? 'Use the + button to add announcements' : 'Check back later for updates from societies'}
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
                {canPost ? 'Use the + button to add a society' : 'Societies will be added soon'}
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

      {canPost && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label="Create"
                className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg bg-primary text-primary-foreground shadow-lg hover:bg-[hsl(var(--primary-hover))] focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => (activeTab === 'announcements' ? openCreate() : openSocietyForm())}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent>Create</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Dialog open={!!viewAnnouncement} onOpenChange={(o) => !o && closeViewAnnouncement()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewAnnouncement?.title || ''}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-3">
            {viewAnnouncement?.society && (
              <Badge variant="outline">{viewAnnouncement.society.name}</Badge>
            )}
            {viewAnnouncement?.venue && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {viewAnnouncement.venue}
              </div>
            )}
            <div className="space-y-2">
              {viewAnnouncement?.short_desc && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {viewAnnouncement.short_desc}
                </p>
              )}
              {viewAnnouncement?.full_details && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {viewAnnouncement.full_details}
                </p>
              )}
            </div>
            {viewAnnouncement?.image_url && (
              <img src={viewAnnouncement.image_url} alt="" className="w-full h-48 object-cover rounded-lg" />
            )}
            {viewAnnouncement?.event_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {format(new Date(viewAnnouncement.event_date), 'MMM d, yyyy h:mm a')}
              </div>
            )}
            {viewAnnouncement?.image_url && (
              <a href={viewAnnouncement.image_url} target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center gap-1">
                <ExternalLink className="w-4 h-4" />
                View image
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={createOpen} onOpenChange={(o) => !o ? closeCreate() : void 0}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Create Announcement</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="Title" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} />
            <Select value={annForm.societyId} onValueChange={(v) => setAnnForm({ ...annForm, societyId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Society" /></SelectTrigger>
              <SelectContent>
                {societies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={annForm.date} onChange={(e) => setAnnForm({ ...annForm, date: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={annForm.startTime} onChange={(e) => setAnnForm({ ...annForm, startTime: e.target.value })} />
              <Input type="time" value={annForm.endTime} onChange={(e) => setAnnForm({ ...annForm, endTime: e.target.value })} />
            </div>
            <Input placeholder="Venue" value={annForm.venue} onChange={(e) => setAnnForm({ ...annForm, venue: e.target.value })} />
            <Textarea placeholder="Short description" value={annForm.shortDesc} onChange={(e) => setAnnForm({ ...annForm, shortDesc: e.target.value })} />
            <Textarea placeholder="Full details" value={annForm.fullDetails} onChange={(e) => setAnnForm({ ...annForm, fullDetails: e.target.value })} />
            <Input placeholder="Registration link (optional)" value={annForm.regLink} onChange={(e) => setAnnForm({ ...annForm, regLink: e.target.value })} />
            <Input placeholder="Contact info (optional)" value={annForm.contact} onChange={(e) => setAnnForm({ ...annForm, contact: e.target.value })} />
            <Input placeholder="Tags (comma separated)" value={annForm.tags} onChange={(e) => setAnnForm({ ...annForm, tags: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleCreateAnnouncement}>Create</Button>
              <Button variant="outline" onClick={() => { resetAnnForm(); closeCreate(); }}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editAnnouncement} onOpenChange={(o) => !o ? closeEditAnnouncement() : void 0}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Announcement</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="Title" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} />
            <Select value={annForm.societyId} onValueChange={(v) => setAnnForm({ ...annForm, societyId: v })}>
              <SelectTrigger><SelectValue placeholder="Select Society" /></SelectTrigger>
              <SelectContent>
                {societies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={annForm.date} onChange={(e) => setAnnForm({ ...annForm, date: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={annForm.startTime} onChange={(e) => setAnnForm({ ...annForm, startTime: e.target.value })} />
              <Input type="time" value={annForm.endTime} onChange={(e) => setAnnForm({ ...annForm, endTime: e.target.value })} />
            </div>
            <Input placeholder="Venue" value={annForm.venue} onChange={(e) => setAnnForm({ ...annForm, venue: e.target.value })} />
            <Textarea placeholder="Short description" value={annForm.shortDesc} onChange={(e) => setAnnForm({ ...annForm, shortDesc: e.target.value })} />
            <Textarea placeholder="Full details" value={annForm.fullDetails} onChange={(e) => setAnnForm({ ...annForm, fullDetails: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleUpdateAnnouncement}>Save</Button>
              <Button variant="outline" onClick={() => { resetAnnForm(); closeEditAnnouncement(); }}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={societyFormOpen} onOpenChange={(o) => !o ? closeSocietyForm() : void 0}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Society</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="Society name" value={socForm.name} onChange={(e) => setSocForm({ ...socForm, name: e.target.value })} />
            <Textarea placeholder="Purpose / what they do" value={socForm.purpose} onChange={(e) => setSocForm({ ...socForm, purpose: e.target.value })} />
            <Select value={socForm.category} onValueChange={(v) => setSocForm({ ...socForm, category: v })}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Cultural">Cultural</SelectItem>
                <SelectItem value="Entrepreneurship">Entrepreneurship</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Label>Official Emblem</Label>
              <Input type="file" accept="image/*" onChange={(e) => setSocForm({ ...socForm, imageFile: e.target.files?.[0] || null })} />
            </div>
            <Input placeholder="Instagram link (optional)" value={socForm.instagram} onChange={(e) => setSocForm({ ...socForm, instagram: e.target.value })} />
            <Input placeholder="LinkedIn link (optional)" value={socForm.linkedin} onChange={(e) => setSocForm({ ...socForm, linkedin: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleAddSociety}>Add</Button>
              <Button variant="outline" onClick={() => { resetSocForm(); closeSocietyForm(); }}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
