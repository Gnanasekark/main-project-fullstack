import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';
import { 
  FileSpreadsheet, 
  Eye, 
  Users, 
  Download, 
  Trash2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Settings2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface FormRowProps {
  form: Form;
  onRefresh: () => void;
  onPreview: (form: Form) => void;
  onAssign: (form: Form) => void;
  onViewResponses: (form: Form) => void;
  onEditFields: (form: Form) => void;
}

interface FormStats {
  totalAssigned: number;
  submitted: number;
  pending: number;
  nearestDueDate: string | null;
  isOverdue: boolean;
}

export function FormRow({ form, onRefresh, onPreview, onAssign, onViewResponses, onEditFields }: FormRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [responseCount, setResponseCount] = useState<number | null>(null);
  const [stats, setStats] = useState<FormStats>({
    totalAssigned: 0,
    submitted: 0,
    pending: 0,
    nearestDueDate: null,
    isOverdue: false,
  });

  // Fetch form stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/forms/${form.id}/stats`
        );
  
        if (!res.ok) throw new Error("Failed to fetch stats");
  
        const data = await res.json();
  
        setResponseCount(data.submitted);
  
        setStats({
          totalAssigned: data.totalAssigned,
          submitted: data.submitted,
          pending: data.pending,
          nearestDueDate: data.nearestDueDate,
          isOverdue: data.isOverdue,
        });
  
      } catch (error) {
        console.error('Error fetching form stats:', error);
      }
    };
  
    fetchStats();
  }, [form.id]);
  

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this form?')) return;
  
    setIsDeleting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}`,
        { method: "DELETE" }
      );
  
      if (!res.ok) throw new Error("Delete failed");
  
      toast.success('Form deleted');
      onRefresh();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    } finally {
      setIsDeleting(false);
    }
  };
  

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}/responses`
      );
  
      if (!res.ok) throw new Error("Failed to fetch responses");
  
      const submissions = await res.json();
  
      if (!submissions || submissions.length === 0) {
        toast.info('No submissions to download');
        setIsDownloading(false);
        return;
      }
  
      const headers = [
        'Submitted At',
        'Student Name',
        'Email',
        'Reg No',
        ...form?.config?.fields?.map(f => f.label)
      ];
  
      const rows = submissions.map((sub: any) => [
        new Date(sub.submitted_at).toLocaleString(),
        sub.profile?.full_name || 'Unknown',
        sub.profile?.email || '',
        sub.profile?.reg_no || '',
        ...form?.config?.fields?.map(f => {
          const value = sub.submission_data?.[f.id];
          return value !== undefined && value !== null ? String(value) : '';
        })
      ]);
  
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
      const colWidths = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...rows.map(r => String(r[i] || '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet['!cols'] = colWidths;
  
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
  
      XLSX.writeFile(
        workbook,
        `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses.xlsx`
      );
  
      toast.success(`Downloaded ${submissions.length} response(s)`);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download responses');
    } finally {
      setIsDownloading(false);
    }
  };
  

  const getStatusColor = () => {
    if (stats.totalAssigned === 0) return 'bg-muted text-muted-foreground';
    if (stats.isOverdue && stats.pending > 0) return 'bg-destructive/10 text-destructive';
    if (stats.pending === 0 && stats.submitted > 0) return 'bg-green-500/10 text-green-600';
    if (stats.pending > 0) return 'bg-yellow-500/10 text-yellow-600';
    return 'bg-muted text-muted-foreground';
  };

  const getStatusText = () => {
    if (stats.totalAssigned === 0) return 'Not Assigned';
    if (stats.pending === 0 && stats.submitted > 0) return 'Completed';
    if (stats.isOverdue && stats.pending > 0) return 'Overdue';
    if (stats.pending > 0) return 'Pending';
    return 'Not Assigned';
  };

  const getStatusIcon = () => {
    if (stats.totalAssigned === 0) return <Clock className="w-3 h-3" />;
    if (stats.pending === 0 && stats.submitted > 0) return <CheckCircle2 className="w-3 h-3" />;
    if (stats.isOverdue && stats.pending > 0) return <AlertCircle className="w-3 h-3" />;
    if (stats.pending > 0) return <Clock className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <div className="rounded-xl border border-border hover:border-primary/50 transition-colors overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{form.title}</h4>
            <p className="text-sm text-muted-foreground">
              {form.config.fields.length} fields • Created {new Date(form.created_at).toLocaleDateString()}
            </p>
            {/* Status indicators */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={getStatusColor()} variant="outline">
                {getStatusIcon()}
                <span className="ml-1">{getStatusText()}</span>
              </Badge>
              {stats.totalAssigned > 0 && (
                <>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                    <Users className="w-3 h-3 mr-1" />
                    {stats.submitted}/{stats.totalAssigned} submitted
                  </Badge>
                  {stats.pending > 0 && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                      <Clock className="w-3 h-3 mr-1" />
                      {stats.pending} pending
                    </Badge>
                  )}
                  {stats.nearestDueDate && (
                    <Badge 
                      variant="outline" 
                      className={stats.isOverdue ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground'}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {new Date(stats.nearestDueDate).toLocaleDateString()}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={form.is_active ? "default" : "secondary"}>
            {form.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Toggle fields"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onPreview(form)}
            title="Preview form"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onEditFields(form)}
            title="Edit form fields"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onAssign(form)}
            title="Assign to students"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => onViewResponses(form)}
            title="View responses"
            className="relative"
          >
            <ClipboardList className="w-4 h-4" />
            {responseCount !== null && responseCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {responseCount}
              </span>
            )}
          </Button>
          <Button
            size="sm" 
            variant="ghost"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download responses"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
            title="Delete form"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded fields view */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border bg-muted/30">
          <div className="pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {form?.config?.fields?.map((field, index) => (
              <div 
                key={field.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                <span className="text-muted-foreground">{index + 1}.</span>
                <span className="truncate">{field.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
