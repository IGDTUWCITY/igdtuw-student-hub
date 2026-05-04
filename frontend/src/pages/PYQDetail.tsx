
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, FileText, ImageIcon, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Paper {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function PYQDetail() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPaper, setNewSubject] = useState({ title: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (subjectId) {
      checkAdmin();
      fetchData();
    }
  }, [subjectId]);

  const checkAdmin = async () => {
    const { data, error } = await supabase.rpc('is_pyq_admin' as any);
    if (!error) setAdmin(Boolean(data));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subject info
      const { data: subData, error: subError } = await supabase
        .from('pyq_subjects')
        .select('id, name')
        .eq('id', subjectId)
        .single();

      if (subError) throw subError;
      setSubject(subData);

      // Fetch papers
      const { data: papersData, error: papersError } = await supabase
        .from('pyq_papers')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

      if (papersError) throw papersError;
      setPapers(papersData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch papers');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaper.title.trim() || !selectedFile || !subjectId) return;

    setIsSubmitting(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${subjectId}/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('pyqs')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message === 'Bucket not found') {
          throw new Error('Storage bucket "pyqs" not found. Please create it in Supabase dashboard.');
        }
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pyqs')
        .getPublicUrl(filePath);

      // Verify the URL has the correct format
      if (!publicUrl.includes('/storage/v1/object/public/')) {
        console.warn('Generated URL might be missing "public" segment:', publicUrl);
      }

      // 3. Insert into Database
      const { error: dbError } = await supabase
        .from('pyq_papers')
        .insert([{
          subject_id: subjectId,
          title: newPaper.title.trim(),
          file_url: publicUrl,
          file_type: fileExt?.toLowerCase() === 'pdf' ? 'pdf' : 'image',
          storage_path: filePath,
          created_by: user?.id
        }]);

      if (dbError) throw dbError;

      toast.success('Paper uploaded successfully');
      setIsDialogOpen(false);
      setNewSubject({ title: '' });
      setSelectedFile(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload paper');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link to="/pyq">
          <Button variant="ghost" size="sm" className="hover:bg-primary/10 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Button>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {subject?.name || 'Loading...'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Previous year question papers
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Paper
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Upload Question Paper</DialogTitle>
                  <DialogDescription>
                    Upload a PDF or image of a previous year question paper.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUploadPaper} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Paper Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Mid Term 2023"
                      value={newPaper.title}
                      onChange={(e) => setNewSubject({ ...newPaper, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File (PDF or Image)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !newPaper.title.trim() || !selectedFile} className="btn-primary-hover">
                      {isSubmitting ? 'Uploading...' : 'Upload Paper'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-muted h-24" />
          ))}
        </div>
      ) : papers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper) => (
            <Card key={paper.id} className="card-hover border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      paper.file_type === 'pdf' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {paper.file_type === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground line-clamp-1">{paper.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider bg-muted px-1.5 py-0.5 rounded">
                          {paper.file_type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(paper.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <a 
                    href={paper.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-2xl border-border/50">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No papers found</h3>
          <p className="text-muted-foreground">
            No question papers have been uploaded for this subject yet.
          </p>
        </div>
      )}
    </div>
  );
}
