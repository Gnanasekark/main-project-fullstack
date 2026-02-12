import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Loader2, FileText, Search, X, Filter, Download } from 'lucide-react';
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
  config: {
    fields: FormField[];
  };
}

interface Submission {
  id: string;
  submitted_at: string;
  submission_data: Record<string, unknown>;
  user_id: string;
}

interface SubmissionWithProfile extends Submission {
  profile: {
    full_name: string | null;
    email: string;
    reg_no: string | null;
  } | null;
}

interface FormResponsesDialogProps {
  form: Form | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormResponsesDialog({ form, open, onOpenChange }: FormResponsesDialogProps) {
  const [submissions, setSubmissions] = useState<SubmissionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (open && form) {
      fetchSubmissions();
      setFilters({});
    }
  }, [open, form]);

  const fetchSubmissions = async () => {
    if (!form) return;
  
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}/responses`
      );
  
      if (!res.ok) throw new Error("Failed to fetch submissions");
  
      const data = await res.json();
  
      setSubmissions(data);
  
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Filter by Reg No
      if (filters.reg_no && !submission.profile?.reg_no?.toLowerCase().includes(filters.reg_no.toLowerCase())) {
        return false;
      }
      // Filter by Name
      if (filters.name && !submission.profile?.full_name?.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      // Filter by form fields
      for (const field of form?.config.fields || []) {
        const filterValue = filters[field.id];
        if (filterValue) {
          const cellValue = String(submission.submission_data[field.id] || '').toLowerCase();
          if (!cellValue.includes(filterValue.toLowerCase())) {
            return false;
          }
        }
      }
      return true;
    });
  }, [submissions, filters, form]);

  const hasActiveFilters = Object.values(filters).some(v => v.trim() !== '');

  const handleDownloadExcel = (dataToDownload: SubmissionWithProfile[]) => {
    if (!form || dataToDownload.length === 0) {
      return;
    }
    const headers = ['Submitted At', 'Reg No', 'Name', ...form?.config?.fields?.map(f => f.label)];
    const rows = dataToDownload.map(sub => [
      new Date(sub.submitted_at).toLocaleString(),
      sub.profile?.reg_no || '',
      sub.profile?.full_name || '',
      ...form?.config?.fields?.map(f => {
        const value = sub.submission_data[f.id];
        return value !== undefined && value !== null ? String(value) : '';
      })
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
      return { wch: Math.min(maxLen + 2, 50) };
    });
    worksheet['!cols'] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses');
    const suffix = hasActiveFilters ? '_filtered' : '';
    XLSX.writeFile(workbook, `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_responses.xlsx`);
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Responses for "{form.title}"
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>{filteredSubmissions.length} of {submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {Object.values(filters).filter(v => v.trim() !== '').length}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => handleDownloadExcel(hasActiveFilters ? filteredSubmissions : submissions)}
                disabled={submissions.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                {hasActiveFilters ? 'Download Filtered' : 'Download All'}
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">
              Students haven't submitted any responses to this form.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  {/* Column headers */}
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold sticky left-0 bg-muted/50">Submitted At</TableHead>
                    <TableHead className="font-semibold">Reg No</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    {form?.config?.fields?.map((field) => (
                      <TableHead key={field.id} className="font-semibold">
                        {field.label}
                      </TableHead>
                    ))}
                  </TableRow>
                  {/* Filter row */}
                  {showFilters && (
                    <TableRow className="bg-muted/30">
                      <TableHead className="sticky left-0 bg-muted/30 py-2">
                        <span className="text-xs text-muted-foreground">Date filter N/A</span>
                      </TableHead>
                      <TableHead className="py-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            value={filters.reg_no || ''}
                            onChange={(e) => handleFilterChange('reg_no', e.target.value)}
                            className="h-7 pl-7 text-xs"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="py-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            value={filters.name || ''}
                            onChange={(e) => handleFilterChange('name', e.target.value)}
                            className="h-7 pl-7 text-xs"
                          />
                        </div>
                      </TableHead>
                      {form?.config?.fields?.map((field) => (
                        <TableHead key={`filter-${field.id}`} className="py-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input
                              placeholder="Search..."
                              value={filters[field.id] || ''}
                              onChange={(e) => handleFilterChange(field.id, e.target.value)}
                              className="h-7 pl-7 text-xs"
                            />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-muted-foreground sticky left-0 bg-background">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {submission.profile?.reg_no || '-'}
                      </TableCell>
                      <TableCell>
                        {submission.profile?.full_name || 'Unknown'}
                      </TableCell>
                      {form?.config?.fields?.map((field) => (
                        <TableCell key={field.id}>
                          {formatCellValue(submission.submission_data[field.id], field.type)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {filteredSubmissions.length === 0 && hasActiveFilters && (
                    <TableRow>
                      <TableCell colSpan={3 + form.config.fields.length} className="text-center py-8 text-muted-foreground">
                        No submissions match your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatCellValue(value: unknown, fieldType: string): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground italic">-</span>;
  }

  const strValue = String(value);

  switch (fieldType) {
    case 'boolean':
      return strValue === 'true' ? (
        <span className="text-success font-medium">Yes</span>
      ) : (
        <span className="text-muted-foreground">No</span>
      );
    case 'date':
      try {
        return new Date(strValue).toLocaleDateString();
      } catch {
        return strValue;
      }
    default:
      return strValue;
  }
}
