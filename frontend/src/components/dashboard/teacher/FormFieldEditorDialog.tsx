import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Loader2, 
  GripVertical, 
  Plus, 
  Trash2, 
  Settings2,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  AlignLeft
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
  config: {
    fields: FormField[];
  };
}

interface FormFieldEditorDialogProps {
  form: Form | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'boolean', label: 'Yes/No', icon: ToggleLeft },
    { value: 'textarea', label: 'Long Text', icon: AlignLeft },
    { value: 'file', label: 'File Upload', icon: Paperclip }, // ✅ ADD THIS

];

export function FormFieldEditorDialog({ form, open, onOpenChange, onSave }: FormFieldEditorDialogProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (form) {
      setFields([...form.config.fields]);
    }
  }, [form]);

  const handleFieldChange = (index: number, key: keyof FormField, value: string | boolean) => {
    setFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: `New Field ${fields.length + 1}`,
      type: 'text',
      required: false,
    };
    setFields(prev => [...prev, newField]);
  };

  const handleRemoveField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveField = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= fields.length) return;
    
    setFields(prev => {
      const updated = [...prev];
      [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
      return updated;
    });
  };
  const handleSave = async () => {
    if (!form) return;
  
    const emptyLabels = fields.filter(f => !f.label.trim());
    if (emptyLabels.length > 0) {
      toast.error('All fields must have a label');
      return;
    }
  
    setIsSaving(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}/fields`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields,
          }),
        }
      );
  
      if (!res.ok) throw new Error("Failed to update fields");
  
      toast.success('Form fields updated successfully');
      onSave();
      onOpenChange(false);
  
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Edit Form Fields
          </DialogTitle>
          <DialogDescription>
            Customize fields for "{form.title}". Add, remove, reorder, or modify field properties.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                {/* Reorder controls */}
                <div className="flex flex-col gap-1 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveField(index, 'up')}
                    disabled={index === 0}
                  >
                    <GripVertical className="w-3 h-3 rotate-90" />
                  </Button>
                  <span className="text-xs text-muted-foreground text-center">{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleMoveField(index, 'down')}
                    disabled={index === fields.length - 1}
                  >
                    <GripVertical className="w-3 h-3 rotate-90" />
                  </Button>
                </div>

                {/* Field config */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Label */}
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                      placeholder="Enter field label"
                      className="mt-1"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) => handleFieldChange(index, 'type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Required toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Required Field</Label>
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => handleFieldChange(index, 'required', checked)}
                    />
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveField(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No fields yet. Add your first field below.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddField}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>

          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
