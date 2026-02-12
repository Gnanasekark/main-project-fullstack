import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSpreadsheet, Hash, Type, Calendar, ToggleLeft } from 'lucide-react';

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

interface FormPreviewDialogProps {
  form: Form | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldTypeIcons: Record<string, React.ElementType> = {
  text: Type,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
};

export function FormPreviewDialog({ form, open, onOpenChange }: FormPreviewDialogProps) {
  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {form.title}
          </DialogTitle>
          <DialogDescription>
            {form.description || `Generated from ${form.original_filename}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{form.config.fields.length} fields</span>
            <span>•</span>
            <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <Badge variant={form.is_active ? "default" : "secondary"}>
              {form.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {form?.config?.fields?.map((field, index) => {
                const Icon = fieldTypeIcons[field.type] || Type;
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{field.label}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {field.type} field
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {field.required && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
