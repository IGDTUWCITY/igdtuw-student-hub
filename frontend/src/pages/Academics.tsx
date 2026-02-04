import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Semester, Subject, GRADES, GRADE_POINTS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  BookOpen,
  Save,
  Loader2,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

interface SubjectInput {
  id: string;
  subject_name: string;
  credits: number;
  grade: string;
}

export default function Academics() {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [cgpa, setCgpa] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingSemester, setPendingSemester] = useState<number | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSemesters(true);
      fetchCGPA();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSubjectsForSemester(selectedSemester);
    }
  }, [selectedSemester, user]);

  const handleSemesterChange = (newSem: number) => {
    const existing = semesters.find((s) => s.semester_number === newSem);
    if (existing && existing.is_completed) {
      setPendingSemester(newSem);
      setIsAlertOpen(true);
    } else {
      setSelectedSemester(newSem);
    }
  };

  const confirmSemesterChange = () => {
    if (pendingSemester) {
      setSelectedSemester(pendingSemester);
      setPendingSemester(null);
    }
    setIsAlertOpen(false);
  };

  const cancelSemesterChange = () => {
    setPendingSemester(null);
    setIsAlertOpen(false);
  };

  const fetchSemesters = async (autoSelect = false) => {
    const { data } = await supabase
      .from('semesters')
      .select('*')
      .eq('user_id', user!.id)
      .order('semester_number');
    
    if (data) {
      const loadedSemesters = data as Semester[];
      setSemesters(loadedSemesters);

      if (autoSelect) {
        const completedSems = loadedSemesters
          .filter(s => s.is_completed)
          .map(s => s.semester_number);
        
        if (completedSems.length > 0) {
          const lastCompleted = Math.max(...completedSems);
          const nextSem = lastCompleted < 8 ? lastCompleted + 1 : lastCompleted;
          setSelectedSemester(nextSem);
        }
      }
    }
  };

  const fetchCGPA = async () => {
    const { data } = await supabase.rpc('calculate_cgpa', {
      p_user_id: user!.id,
    });
    if (data !== null) setCgpa(data);
  };

  const fetchSubjectsForSemester = async (semNum: number) => {
    setLoading(true);
    const semester = semesters.find((s) => s.semester_number === semNum);

    if (semester) {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('semester_id', semester.id);

      if (data && data.length > 0) {
        setSubjects(
          data.map((s) => ({
            id: s.id,
            subject_name: s.subject_name,
            credits: s.credits,
            grade: s.grade || '',
          }))
        );
      } else {
        setSubjects([createEmptySubject()]);
      }
    } else {
      setSubjects([createEmptySubject()]);
    }
    setLoading(false);
  };

  const createEmptySubject = (): SubjectInput => ({
    id: crypto.randomUUID(),
    subject_name: '',
    credits: 4,
    grade: '',
  });

  const addSubject = () => {
    setSubjects([...subjects, createEmptySubject()]);
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleDeleteSemester = async (semesterId: string) => {
    try {
      // Delete subjects first
      await supabase.from('subjects').delete().eq('semester_id', semesterId);
      
      // Delete semester
      const { error } = await supabase.from('semesters').delete().eq('id', semesterId);
      
      if (error) throw error;
      
      toast.success('Semester deleted successfully');
      fetchSemesters(true);
      fetchCGPA();
    } catch (error: any) {
      toast.error('Failed to delete semester');
    }
  };

  const handleEditSemester = (semNum: number) => {
    setSelectedSemester(semNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateSubject = (id: string, field: keyof SubjectInput, value: any) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const calculateSGPA = (): number => {
    const validSubjects = subjects.filter(
      (s) => s.subject_name && s.grade && s.credits > 0
    );
    if (validSubjects.length === 0) return 0;

    const totalCredits = validSubjects.reduce((acc, s) => acc + s.credits, 0);
    const totalPoints = validSubjects.reduce(
      (acc, s) => acc + s.credits * (GRADE_POINTS[s.grade] || 0),
      0
    );

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const saveSemester = async () => {
    setSaving(true);

    try {
      // Create or update semester
      let semesterId: string;
      const existingSemester = semesters.find(
        (s) => s.semester_number === selectedSemester
      );

      const sgpa = calculateSGPA();
      const totalCredits = subjects
        .filter((s) => s.subject_name && s.grade)
        .reduce((acc, s) => acc + s.credits, 0);

      if (existingSemester) {
        semesterId = existingSemester.id;
        await supabase
          .from('semesters')
          .update({
            sgpa,
            total_credits: totalCredits,
            is_completed: true,
          })
          .eq('id', semesterId);

        // Delete existing subjects
        await supabase.from('subjects').delete().eq('semester_id', semesterId);
      } else {
        const { data: newSemester } = await supabase
          .from('semesters')
          .insert({
            user_id: user!.id,
            semester_number: selectedSemester,
            sgpa,
            total_credits: totalCredits,
            is_completed: true,
          })
          .select()
          .single();

        if (!newSemester) throw new Error('Failed to create semester');
        semesterId = newSemester.id;
      }

      // Insert subjects
      const validSubjects = subjects.filter((s) => s.subject_name && s.grade);
      if (validSubjects.length > 0) {
        await supabase.from('subjects').insert(
          validSubjects.map((s) => ({
            semester_id: semesterId,
            user_id: user!.id,
            subject_name: s.subject_name,
            credits: s.credits,
            grade: s.grade,
            grade_points: GRADE_POINTS[s.grade] || 0,
          }))
        );
      }

      await fetchSemesters(true);
      await fetchCGPA();
      toast.success('Semester saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save semester');
    } finally {
      setSaving(false);
    }
  };

  const currentSGPA = calculateSGPA();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Academics
        </h1>
        <p className="text-muted-foreground mt-1">
          Calculate your SGPA/CGPA and track academic progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-6 h-6" />
            <span className="text-sm font-medium opacity-90">Current CGPA</span>
          </div>
          <p className="text-4xl font-bold font-display">{cgpa.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-1">
            Across {semesters.filter((s) => s.is_completed).length} completed
            semesters
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-success" />
            <span className="text-sm font-medium text-muted-foreground">
              Semester {selectedSemester} SGPA
            </span>
          </div>
          <p className="text-4xl font-bold font-display text-foreground">
            {currentSGPA.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Based on entered grades
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-card border border-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-info" />
            <span className="text-sm font-medium text-muted-foreground">
              Total Credits
            </span>
          </div>
          <p className="text-4xl font-bold font-display text-foreground">
            {subjects
              .filter((s) => s.subject_name && s.grade)
              .reduce((acc, s) => acc + s.credits, 0)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">This semester</p>
        </motion.div>
      </div>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="font-display">SGPA Calculator</CardTitle>
              <CardDescription>
                Enter your subjects and grades to calculate SGPA
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Semester</Label>
              <Select
                value={selectedSemester.toString()}
                onValueChange={(v) => handleSemesterChange(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                    const existing = semesters.find(
                      (s) => s.semester_number === sem
                    );
                    return (
                      <SelectItem key={sem} value={sem.toString()}>
                        Sem {sem} {existing?.is_completed && '✓'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Completed Semester?</AlertDialogTitle>
                <AlertDialogDescription>
                  You have already saved data for Semester {pendingSemester}. 
                  Editing this will load your previous records. Do you wish to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelSemesterChange}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmSemesterChange}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Subject Headers */}
              {subjects.length > 0 && (
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-5">Subject Name</div>
                  <div className="col-span-2">Credits</div>
                  <div className="col-span-3">Grade</div>
                  <div className="col-span-2">Points</div>
                </div>
              )}

              {/* Subject Rows */}
              {subjects.length > 0 ? (
                subjects.map((subject, index) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg bg-muted/30"
                  >
                    <div className="col-span-12 md:col-span-5">
                      <Input
                        placeholder="Subject name"
                        value={subject.subject_name}
                        onChange={(e) =>
                          updateSubject(subject.id, 'subject_name', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        placeholder="Credits"
                        value={subject.credits}
                        onChange={(e) =>
                          updateSubject(
                            subject.id,
                            'credits',
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="col-span-4 md:col-span-3">
                      <Select
                        value={subject.grade}
                        onValueChange={(v) =>
                          updateSubject(subject.id, 'grade', v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade} ({GRADE_POINTS[grade]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 md:col-span-1 flex items-center">
                      <Badge variant="secondary" className="font-mono">
                        {subject.grade
                          ? (
                              subject.credits * (GRADE_POINTS[subject.grade] || 0)
                            ).toFixed(0)
                          : '-'}
                      </Badge>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubject(subject.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                  <p className="text-muted-foreground mb-4">No subjects added yet</p>
                  <Button onClick={addSubject} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Subject
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={addSubject}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>

                <Button
                  onClick={saveSemester}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Semester
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Semester History */}
      {semesters.filter((s) => s.is_completed).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Semester History</CardTitle>
            <CardDescription>Your academic progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {semesters
                .filter((s) => s.is_completed)
                .map((sem) => (
                  <motion.div
                    key={sem.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-lg bg-muted/50 text-center"
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      Semester {sem.semester_number}
                    </p>
                    <p className="text-2xl font-bold font-display text-foreground">
                      {sem.sgpa?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">
                      {sem.total_credits} credits
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSemester(sem.semester_number)}
                        className="h-8"
                      >
                        <Edit className="w-3 h-3 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSemester(sem.id)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
