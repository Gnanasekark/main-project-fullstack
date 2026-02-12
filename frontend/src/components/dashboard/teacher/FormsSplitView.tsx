import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { toast } from 'sonner';
import { FormsListPanel } from './FormsListPanel';
import { FormDetailPanel } from './FormDetailPanel';
import { FormPreviewDialog } from './FormPreviewDialog';
import { FormAssignmentDialog } from './FormAssignmentDialog';
import { FormFieldEditorDialog } from './FormFieldEditorDialog';

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

export function FormsSplitView() {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formStats, setFormStats] = useState<Record<string, { assigned: number; submitted: number; pending: number }>>({});
  
  // Dialog states
  const [previewForm, setPreviewForm] = useState<Form | null>(null);
  const [assignForm, setAssignForm] = useState<Form | null>(null);
  const [editFieldsForm, setEditFieldsForm] = useState<Form | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    if (forms.length > 0) {
      fetchFormStats();
    }
  }, [forms]);

  const fetchForms = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/forms");
  
      if (!res.ok) throw new Error("Failed to fetch forms");
  
      const data = await res.json();
  
      const formsList = data.map((form: any) => ({
        ...form,
        config: typeof form.config === "string"
          ? JSON.parse(form.config)
          : form.config
      }));
  
      setForms(formsList);
  
      if (formsList.length > 0 && !selectedFormId) {
        setSelectedFormId(formsList[0].id);
      }
  
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  };
  

  const fetchFormStats = async () => {
    try {
      const statsMap: Record<string, { assigned: number; submitted: number; pending: number }> = {};
  
      for (const form of forms) {
  
        const res = await fetch(`http://localhost:5000/api/forms/${form.id}/stats`);
  
        if (!res.ok) continue;
  
        const stats = await res.json();
  
        statsMap[form.id] = stats;
      }
  
      setFormStats(statsMap);
  
    } catch (error) {
      console.error('Error fetching form stats:', error);
    }
  };
  

  const selectedForm = forms.find(f => f.id === selectedFormId) || null;

  const handleRefresh = () => {
    fetchForms();
    fetchFormStats();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-8rem)] flex rounded-xl border border-border bg-background overflow-hidden"
    >
      {/* Left Panel - Forms List */}
      <div className="w-80 shrink-0">
        <FormsListPanel
          forms={forms}
          selectedFormId={selectedFormId}
          onSelectForm={setSelectedFormId}
          formStats={formStats}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Right Panel - Form Details */}
      <FormDetailPanel
        form={selectedForm}
        onPreview={setPreviewForm}
        onAssign={setAssignForm}
        onEditFields={setEditFieldsForm}
        onRefresh={handleRefresh}
      />

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
          handleRefresh();
        }}
      />
      <FormFieldEditorDialog
        form={editFieldsForm}
        open={!!editFieldsForm}
        onOpenChange={(open) => !open && setEditFieldsForm(null)}
        onSave={() => {
          setEditFieldsForm(null);
          handleRefresh();
        }}
      />
    </motion.div>
  );
}