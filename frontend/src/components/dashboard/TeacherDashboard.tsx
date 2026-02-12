import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  BarChart3,
  Plus,
  Loader2,
  CheckCircle,
  FileText,
  Clock,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { StatCard } from './teacher/StatCard';
import { FormRow } from './teacher/FormRow';
import { FormPreviewDialog } from './teacher/FormPreviewDialog';
import { FormAssignmentDialog } from './teacher/FormAssignmentDialog';
import { FormResponsesDialog } from './teacher/FormResponsesDialog';
import { FormFieldEditorDialog } from './teacher/FormFieldEditorDialog';
import { CircularsSection } from './teacher/CircularsSection';
import { FormsSplitView } from './teacher/FormsSplitView';

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  original_filename: string | null;
  is_active: boolean;
  created_at: string;
  config: {
    fields: FormField[];
  };
}

interface TeacherDashboardProps {
  showFormsOnly?: boolean;
  showCircularsOnly?: boolean;
}

export function TeacherDashboard({ showFormsOnly = false, showCircularsOnly = false }: TeacherDashboardProps) {
  const { profile, user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewForm, setPreviewForm] = useState<Form | null>(null);
  const [assignForm, setAssignForm] = useState<Form | null>(null);
  const [responsesForm, setResponsesForm] = useState<Form | null>(null);
  const [editFieldsForm, setEditFieldsForm] = useState<Form | null>(null);
  const [totalResponses, setTotalResponses] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [formStats, setFormStats] = useState<Record<string, { assigned: number; submitted: number; pending: number }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  useEffect(() => {
    const init = async () => {
      await fetchForms();
      await fetchResponseCount();
      await fetchAssignmentStats();
    };
  
    init();
  }, []);
  
  useEffect(() => {
    if (forms.length > 0) {
      fetchFormSpecificStats();
    }
  }, [forms]);

  const fetchForms = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/forms", {
        credentials: "include",
      })
       
      if (!res.ok) throw new Error('Failed to fetch forms');
  
      const data = await res.json();
  
      setForms(
        (data || []).map((form: any) => ({
          ...form,
          id: String(form.id),
          config: typeof form.config === "string"
            ? JSON.parse(form.config)
            : form.config || { fields: [] },
        }))
      );
      
      
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  };
  

  const fetchResponseCount = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/responses/count', {
        credentials: 'include',
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", errorText);
        return;
      }
      
  
      const data = await res.json();
      setTotalResponses(data.count || 0);
    } catch (error) {
      console.error('Error fetching response count:', error);
    }
  };
  

  const fetchAssignmentStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/assignment-stats', {
        credentials: 'include',
      });
  
      if (!res.ok) return;
  
      const data = await res.json();
  
      setAssignedCount(data.assigned || 0);
      setPendingCount(data.pending || 0);
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
    }
  };
  

  const fetchFormSpecificStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teacher/forms/stats', {
        credentials: 'include',
      });
  
      if (!res.ok) return;
  
      const data = await res.json();
      setFormStats(data || {});
    } catch (error) {
      console.error('Error fetching form-specific stats:', error);
    }
  };
  

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (jsonData.length < 1) {
        toast.error('Excel file must have at least a header row');
        return;
      }

      const headers = jsonData[0];
      const fields = headers.map((header, index) => ({
        id: `field_${index}`,
        label: String(header),
        type: 'text' as const,
        required: false,
      }));

      const res = await fetch('http://localhost:5000/api/forms', {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: file.name.replace(/\.(xlsx|xls)$/, ''),
          description: `Form generated from ${file.name}`,
          original_filename: file.name,
          config: { fields },
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create form');
      }
      

      toast.success('Form created successfully!');
      fetchForms();
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process Excel file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);


  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const selectedForm = forms.find(f => f.id === selectedFormId);
  const selectedFormStats = selectedFormId ? formStats[selectedFormId] : null;

  const stats = {
    totalForms: forms.length,
    activeForms: forms.filter(f => f.is_active).length,
    totalResponses,
    pendingCount,
    assignedCount,
  };

  // If showing circulars only
  if (showCircularsOnly) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-2">Circulars</h1>
          <p className="text-muted-foreground">
            Upload and manage important documents for students.
          </p>
        </motion.div>
        <CircularsSection />
      </div>
    );
  }

  // If showing forms only
  if (showFormsOnly) {
    return (
      <FormsSplitView />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">
            {greeting()}, {profile?.full_name?.split(' ')[0] || 'Teacher'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your forms and track student submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Excel
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Form Selector for Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Form Analytics</h3>
                  <p className="text-sm text-muted-foreground">Select a form to view detailed statistics</p>
                </div>
              </div>
              <div className="flex-1 md:max-w-xs">
                <Select
                value={selectedFormId ?? ''}

                  onValueChange={(value) => setSelectedFormId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a form..." />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Selected Form Stats */}
      {selectedForm && selectedFormStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedForm.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedForm.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setResponsesForm(selectedForm)}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Responses
                  </Button>
                  <Button size="sm" onClick={() => setAssignForm(selectedForm)}>
                    <Users className="w-4 h-4 mr-2" />
                    Assign
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Assigned Card */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">Total Assigned</span>
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold">{selectedFormStats.assigned}</p>
                  <p className="text-xs text-muted-foreground mt-1">students/groups</p>
                </div>

                {/* Submitted Card */}
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600">Submitted</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold">{selectedFormStats.submitted}</p>
                  <p className="text-xs text-muted-foreground mt-1">responses received</p>
                </div>

                {/* Pending Card */}
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-600">Pending</span>
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold">{selectedFormStats.pending}</p>
                  <p className="text-xs text-muted-foreground mt-1">awaiting response</p>
                </div>
              </div>

              {/* Progress Bar */}
              {selectedFormStats.assigned > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-bold text-primary">
                    {selectedFormStats.assigned > 0
  ? Math.round((selectedFormStats.submitted / selectedFormStats.assigned) * 100)
  : 0}%

                    </span>
                  </div>
                  <Progress 
                    value={(selectedFormStats.submitted / selectedFormStats.assigned) * 100} 
                    className="h-3"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatCard
          title="Total Forms"
          value={stats.totalForms}
          icon={FileSpreadsheet}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          title="Active Forms"
          value={stats.activeForms}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-500/10"
        />
        <StatCard
          title="Total Assigned"
          value={stats.assignedCount}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          title="Submitted"
          value={stats.totalResponses}
          icon={BarChart3}
          color="text-accent"
          bgColor="bg-accent/10"
        />
        <StatCard
          title="Pending"
          value={stats.pendingCount}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-500/10"
        />
      </motion.div>

      {/* Upload section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Excel to Create Form</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Upload any Excel file and we'll automatically convert it into an online form. 
                Column headers become form fields.
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Select Excel File
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick access form list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Recent Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
                <p className="text-muted-foreground">
                  Upload an Excel file to create your first form.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {forms.slice(0, 5).map((form) => (
                  <FormRow 
                    key={form.id} 
                    form={form} 
                    onRefresh={fetchForms}
                    onPreview={setPreviewForm}
                    onAssign={setAssignForm}
                    onViewResponses={setResponsesForm}
                    onEditFields={setEditFieldsForm}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <FormPreviewDialog
        form={previewForm}
        open={!!previewForm}
        onOpenChange={(open) => !open && setPreviewForm(null)}
      />

      <FormAssignmentDialog
        formId={assignForm?.id || null}
        formTitle={assignForm?.title || ''}
        open={!!assignForm}
        onOpenChange={(open) => !open && setAssignForm(null)}
        onSuccess={() => {
          setAssignForm(null);
          fetchForms();
        }}
      />

      <FormResponsesDialog
        form={responsesForm}
        open={!!responsesForm}
        onOpenChange={(open) => !open && setResponsesForm(null)}
      />

      <FormFieldEditorDialog
        form={editFieldsForm}
        open={!!editFieldsForm}
        onOpenChange={(open) => !open && setEditFieldsForm(null)}
        onSave={() => {
          setEditFieldsForm(null);
          fetchForms();
        }}
      />
    </div>
  );
}
