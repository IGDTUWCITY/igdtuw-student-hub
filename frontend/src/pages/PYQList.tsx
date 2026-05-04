
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Folder, Search, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  paper_count?: number;
}

export default function PYQList() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renameSubject, setRenameSubject] = useState<any>(null);
  const [renameName, setRenameName] = useState('');
  const [deleteSubject, setDeleteSubject] = useState<any>(null);

  useEffect(() => {
    checkAdmin();
    fetchSubjects();
  }, []);

  const checkAdmin = async () => {
    const { data, error } = await supabase.rpc('is_pyq_admin' as any);
    if (!error) setAdmin(Boolean(data));
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pyq_subjects')
        .select(`
          *,
          pyq_papers(count)
        `)
        .order('name');

      if (error) throw error;
      
      const formattedData = data.map((s: any) => ({
        ...s,
        paper_count: s.pyq_papers?.[0]?.count || 0
      }));
      
      setSubjects(formattedData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pyq_subjects')
        .insert([{
          name: newSubject.name.trim(),
          created_by: user?.id
        }]);

      if (error) throw error;

      toast.success('Subject folder created successfully');
      setIsDialogOpen(false);
      setNewSubject({ name: '' });
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subject folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameSubject = async () => {
    if (!renameSubject || !renameName.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pyq_subjects')
        .update({ name: renameName.trim() })
        .eq('id', renameSubject.id);

      if (error) throw error;
      toast.success('Subject folder renamed successfully');
      setRenameSubject(null);
      setRenameName('');
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename subject folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubject) return;
    setIsSubmitting(true);
    try {
      // 1. First get all papers in this subject to delete from storage
      const { data: papers } = await supabase
        .from('pyq_papers')
        .select('storage_path')
        .eq('subject_id', deleteSubject.id);

      // 2. Delete files from storage
      if (papers && papers.length > 0) {
        const storagePaths = papers.map(p => p.storage_path).filter(Boolean);
        if (storagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('pyqs')
            .remove(storagePaths);
          if (storageError) console.warn('Storage delete error:', storageError);
        }
      }

      // 3. Delete from database (cascade delete will handle papers)
      const { error: dbError } = await supabase
        .from('pyq_subjects')
        .delete()
        .eq('id', deleteSubject.id);

      if (dbError) throw dbError;
      toast.success('Subject folder deleted successfully');
      setDeleteSubject(null);
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">PYQ</h1>
          <p className="text-muted-foreground mt-1">
            Browse previous year question papers by subject
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-hover">
                <Plus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Subject Folder</DialogTitle>
                <DialogDescription>
                  Add a new subject to organize previous year question papers.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFolder} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Data Structures"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    required
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !newSubject.name.trim()} className="btn-primary-hover">
                    {isSubmitting ? 'Creating...' : 'Create Folder'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse bg-muted h-32" />
          ))}
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="card-hover h-full border-border/50">
              <Link to={`/pyq/${subject.id}`} className="block">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {subject.paper_count} {subject.paper_count === 1 ? 'Paper' : 'Papers'}
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{subject.name}</CardTitle>
                  {subject.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {subject.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Link>
              {isAdmin && (
                <div className="px-4 pb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 ml-auto"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          setRenameSubject(subject);
                          setRenameName(subject.name);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteSubject(subject)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-2xl border-border/50">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">No subjects found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'No subjects have been added yet.'}
          </p>
        </div>
      )}

      {/* Rename Subject Dialog */}
      <Dialog open={!!renameSubject} onOpenChange={(open) => !open && setRenameSubject(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Subject Folder</DialogTitle>
            <DialogDescription>Enter a new name for the subject folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="rename-subject-name">New Name</Label>
              <Input
                id="rename-subject-name"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                placeholder="e.g. Data Structures"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setRenameSubject(null)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              disabled={isSubmitting || !renameName.trim()}
              className="btn-primary-hover"
              onClick={handleRenameSubject}
            >
              {isSubmitting ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Dialog */}
      <Dialog open={!!deleteSubject} onOpenChange={(open) => !open && setDeleteSubject(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Subject Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteSubject?.name}"? This will also delete all papers inside it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setDeleteSubject(null)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleDeleteSubject}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
