import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Opportunity,
  SavedOpportunity,
  OpportunityType,
  BRANCHES,
  YEARS,
} from '@/types/database';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  Filter,
  Briefcase, 
  Trophy,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { differenceInCalendarDays, format } from 'date-fns';

const opportunityIcons: Record<OpportunityType, any> = {
  hackathon: Trophy,
  internship: Briefcase,
  scholarship: BookmarkCheck,
  competition: Trophy,
  workshop: Building2,
  research_conference: BookOpen,
};

const RETENTION_DAYS = 7;

export default function Opportunities() {
  const { user, profile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedOpps, setSavedOpps] = useState<SavedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('explore');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOpportunities();
    if (user) fetchSavedOpportunities();
  }, [user]);

  useEffect(() => {
    setExpandedGroups({});
  }, [searchQuery, typeFilter, activeTab]);

  const fetchOpportunities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('deadline', { ascending: true });

    if (data) setOpportunities(data as Opportunity[]);
    setLoading(false);
  };

  const fetchSavedOpportunities = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_opportunities')
      .select('*, opportunity:opportunities(*)')
      .eq('user_id', user!.id);

    if (data) setSavedOpps(data as SavedOpportunity[]);
  };

  const toggleSave = async (oppId: string) => {
    if (!user) {
      toast.error('Please sign in to save opportunities');
      return;
    }

    const isSaved = savedOpps.some((s) => s.opportunity_id === oppId);

    if (isSaved) {
      const { error } = await supabase
        .from('saved_opportunities')
        .delete()
        .eq('user_id', user!.id)
        .eq('opportunity_id', oppId);

      if (error) {
        toast.error(error.message || 'Could not remove from saved');
        return;
      }

      toast.success('Removed from saved');
    } else {
      const { error } = await supabase.from('saved_opportunities').insert({
        user_id: user!.id,
        opportunity_id: oppId,
      });

      if (error) {
        toast.error(error.message || 'Could not save opportunity');
        return;
      }

      toast.success('Saved to your list');
    }

    fetchSavedOpportunities();
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.required_skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesType = typeFilter === 'all' || opp.opportunity_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const sortedOpportunities = [...filteredOpportunities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const groupedOpportunities = sortedOpportunities.reduce(
    (acc, opp) => {
      const createdDate = new Date(opp.created_at);
      const key = format(createdDate, 'yyyy-MM-dd');

      if (!acc[key]) {
        acc[key] = {
          label: format(createdDate, 'd MMM yyyy'),
          items: [],
        };
      }

      acc[key].items.push(opp);
      return acc;
    },
    {} as Record<string, { label: string; items: Opportunity[] }>
  );

  const groupedList = Object.entries(groupedOpportunities).map(
    ([key, value]) => ({
      key,
      ...value,
    })
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const OpportunityCard = ({
    opp,
    showStatus = false,
  }: {
    opp: Opportunity;
    showStatus?: boolean;
  }) => {
    const Icon = opportunityIcons[opp.opportunity_type] || Briefcase;
    const isSaved = savedOpps.some((s) => s.opportunity_id === opp.id);
    const savedEntry = savedOpps.find((s) => s.opportunity_id === opp.id);
    const expiringSoon = (() => {
      const createdDate = new Date(opp.created_at);
      if (Number.isNaN(createdDate.getTime())) return false;
      const daysSinceListed = differenceInCalendarDays(new Date(), createdDate);
      return daysSinceListed === RETENTION_DAYS;
    })();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="h-full card-hover border-border">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold line-clamp-1">
                    {opp.title}
                  </CardTitle>
                  {opp.organization && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {opp.organization}
                    </CardDescription>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleSave(opp.id)}
                className={isSaved ? 'text-primary' : 'text-muted-foreground'}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {opp.description || 'No description available'}
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {opp.opportunity_type}
              </Badge>
              {opp.is_remote && (
                <Badge variant="outline" className="text-xs">
                  Remote
                </Badge>
              )}
              {expiringSoon && (
                <Badge className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                  Expiring soon
                </Badge>
              )}
              {opp.stipend && (
                <Badge variant="outline" className="text-xs text-success">
                  {opp.stipend}
                </Badge>
              )}
            </div>

            {opp.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {opp.required_skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {opp.required_skills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{opp.required_skills.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Listed on {format(new Date(opp.created_at), 'MMM d')}
                </span>
                {opp.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {opp.location}
                  </span>
                )}
              </div>

              {opp.apply_link && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => window.open(opp.apply_link, '_blank')}
                >
                  Apply
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>

            {showStatus && savedEntry && (
              <div className="pt-2 border-t border-border">
                <Badge
                  variant={
                    (savedEntry.status ?? 'saved') === 'applied'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {savedEntry.status ?? 'saved'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Opportunities
        </h1>
        <p className="text-muted-foreground mt-1">
          Discover hackathons, internships, and more
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="saved">
            Saved ({savedOpps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities, skills, companies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hackathon">Hackathons</SelectItem>
                <SelectItem value="internship">Internships</SelectItem>
                <SelectItem value="scholarship">Scholarships</SelectItem>
                <SelectItem value="competition">Competitions</SelectItem>
                <SelectItem value="workshop">Workshops</SelectItem>
                <SelectItem value="research_conference">Research Conferences</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opportunities Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Please wait, we are fetching new opportunities...
                </p>
              </div>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No opportunities found
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'New opportunities will appear here soon'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {groupedList.map((group) => (
                <div key={group.key} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      Listed on {group.label}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(expandedGroups[group.key]
                      ? group.items
                      : group.items.slice(0, 6)
                    ).map((opp) => (
                      <OpportunityCard key={opp.id} opp={opp} />
                    ))}
                  </div>
                  {group.items.length > 6 && (
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleGroup(group.key)}
                        className="text-xs text-muted-foreground"
                      >
                        {expandedGroups[group.key] ? (
                          <>
                            View less
                            <ChevronUp className="w-4 h-4 ml-2" />
                          </>
                        ) : (
                          <>
                            View more
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {savedOpps.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No saved opportunities
              </h3>
              <p className="text-muted-foreground text-sm">
                Save opportunities to track them here
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedOpps.map(
                (saved) =>
                  saved.opportunity && (
                    <OpportunityCard
                      key={saved.id}
                      opp={saved.opportunity}
                      showStatus
                    />
                  )
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
