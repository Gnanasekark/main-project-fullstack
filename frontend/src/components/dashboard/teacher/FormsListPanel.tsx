import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';

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

interface FormStats {
  assigned: number;
  submitted: number;
  pending: number;
}

interface FormsListPanelProps {
  forms: Form[];
  selectedFormId: string | null;
  onSelectForm: (formId: string) => void;
  formStats: Record<string, FormStats>;
  isLoading: boolean;
  onRefresh: () => void;
}

export function FormsListPanel({ 
  forms, 
  selectedFormId, 
  onSelectForm, 
  formStats,
  isLoading,
  onRefresh
}: FormsListPanelProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        type: 'text',
        required: false,
      }));
  
      const res = await fetch("http://localhost:5000/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: file.name.replace(/\.(xlsx|xls)$/, ''),
          description: `Form generated from ${file.name}`,
          original_filename: file.name,
          created_by: user?.id,
          config: { fields },
        }),
      });
  
      if (!res.ok) throw new Error("Failed to create form");
  
      const newForm = await res.json();
  
      toast.success('Form created successfully!');
      onRefresh();
  
      if (newForm?.id) {
        onSelectForm(newForm.id);
      }
  
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process Excel file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user?.id, onRefresh, onSelectForm]);
  

  const getFormStatus = (stats: FormStats | undefined) => {
    if (!stats || stats.assigned === 0) return { label: 'Not Assigned', color: 'bg-muted text-muted-foreground', icon: Clock };
    if (stats.pending === 0 && stats.submitted > 0) return { label: 'Completed', color: 'bg-green-500/10 text-green-600', icon: CheckCircle2 };
    if (stats.pending > 0) return { label: `${stats.pending} Pending`, color: 'bg-orange-500/10 text-orange-600', icon: AlertCircle };
    return { label: 'Not Assigned', color: 'bg-muted text-muted-foreground', icon: Clock };
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Forms</h2>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </>
            )}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Forms List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No forms match your search' : 'No forms yet. Upload an Excel file to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredForms.map((form, index) => {
                const stats = formStats[form.id];
                const status = getFormStatus(stats);
                const isSelected = selectedFormId === form.id;
                
                return (
                  <motion.button
                    key={form.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onSelectForm(form.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <FileSpreadsheet className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate text-sm ${isSelected ? 'text-primary' : ''}`}>
                          {form.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${status.color}`}>
                            <status.icon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          {stats && stats.assigned > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {stats.submitted}/{stats.assigned}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}