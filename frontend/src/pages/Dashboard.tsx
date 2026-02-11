import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Announcement } from '@/types/database';
import {
  GraduationCap,
  Target,
  Calendar,
  Bookmark,
  Megaphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type AnnRow = Announcement & {
  start_time?: string;
  end_time?: string;
  event_date?: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    // Fetch CGPA
    const { data: cgpaData, error: cgpaError } = await supabase.rpc(
      'calculate_cgpa',
      {
        p_user_id: user!.id,
      }
    );

    if (cgpaError) {
      const { data: semestersData } = await supabase
        .from('semesters')
        .select('sgpa, total_credits, is_completed')
        .eq('user_id', user!.id)
        .eq('is_completed', true);

      if (semestersData) {
        const totals = semestersData.reduce(
          (acc, sem) => {
            const credits = sem.total_credits ?? 0;
            const sgpa = sem.sgpa ?? 0;
            return {
              totalCredits: acc.totalCredits + credits,
              totalPoints: acc.totalPoints + sgpa * credits,
            };
          },
          { totalCredits: 0, totalPoints: 0 }
        );

        setCgpa(
          totals.totalCredits > 0
            ? Number((totals.totalPoints / totals.totalCredits).toFixed(2))
            : 0
        );
      }
    } else if (cgpaData !== null) {
      setCgpa(cgpaData);
    }

    // Fetch saved opportunities count (use GET with limit(0) to avoid HEAD aborts)
    const { count: savedOppsCount } = await supabase
      .from('saved_opportunities')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .limit(0);
    setSavedCount(savedOppsCount || 0);

    // Upcoming events: number of announcements currently visible (same filter as Campus)
    const { data: announcementsData } = await supabase
      .from('announcements')
      .select('*, society:societies(*)')
      .order('created_at', { ascending: false });
    if (announcementsData) {
      const now = new Date();
      const active = (announcementsData as AnnRow[]).filter((a) => {
        if (!a.event_date) return false;
        const timeStr = a.end_time || a.start_time || '23:59';
        const endDateRaw = a.event_date;
        let end = new Date(`${String(endDateRaw)}T${timeStr}`);
        if (isNaN(end.getTime())) {
          const [y, m, d] = String(endDateRaw).split('-').map((s: string) => parseInt(s, 10));
          const [hh, mm] = String(timeStr).split(':').map((s: string) => parseInt(s, 10));
          end = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
        }
        return end.getTime() >= now.getTime();
      });
      setUpcomingEvents(active.length);
    } else {
      setUpcomingEvents(0);
    }

    // Fetch recent announcements (match Campus filter and show all active)
    const { data: recentAnnouncements } = await supabase
      .from('announcements')
      .select('*, society:societies(*)')
      .order('created_at', { ascending: false });
    if (recentAnnouncements) {
      const now = new Date();
      const active = (recentAnnouncements as AnnRow[]).filter((a) => {
        if (!a.event_date) return true;
        const timeStr = a.end_time || a.start_time || '23:59';
        const endDateRaw = a.event_date;
        let end = new Date(`${String(endDateRaw)}T${timeStr}`);
        if (isNaN(end.getTime())) {
          const [y, m, d] = String(endDateRaw).split('-').map((s: string) => parseInt(s, 10));
          const [hh, mm] = String(timeStr).split(':').map((s: string) => parseInt(s, 10));
          end = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
        }
        return end.getTime() >= now.getTime();
      });
      setAnnouncements(active as Announcement[]);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <WelcomeHeader />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Current CGPA"
          value={cgpa?.toFixed(2) || '0.00'}
          subtext="Calculated from all semesters"
          variant="primary"
          delay={0}
        />
        <StatCard
          icon={Bookmark}
          label="Saved Opportunities"
          value={savedCount}
          subtext="Hackathons & internships"
          variant="accent"
          delay={0.1}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Events"
          value={upcomingEvents}
          subtext="In your university"
          variant="success"
          delay={0.2}
          onClick={() => {
            sessionStorage.setItem('campusActiveTab', 'announcements');
            window.open('/campus', '_self');
          }}
        />
        <StatCard
          icon={Target}
          label="Applications"
          value="0"
          subtext="Track your progress"
          variant="default"
          delay={0.3}
        />
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <QuickActions />
      </section>

      {/* Recent Announcements */}
      <section>
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No announcements yet</p>
                <p className="text-xs mt-1">
                  Check back later for society updates
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {announcement.title}
                        </h4>
                        {announcement.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(
                          new Date(announcement.created_at),
                          'MMM d, yyyy'
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

