import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { FileSpreadsheet, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

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
  config: {
    fields: FormField[];
  };
}

export default function FormSubmission() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (formId) {
      fetchForm();
      checkExistingSubmission();
    }
  }, [formId]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/forms/${formId}`);
  
      if (!res.ok) {
        throw new Error('Failed to fetch form');
      }
  
      const data = await res.json();
  
      // 🔥 PARSE CONFIG SAFELY
      const parsedConfig =
        typeof data.config === "string"
          ? JSON.parse(data.config)
          : data.config;
  
      if (!parsedConfig || !parsedConfig.fields) {
        throw new Error("Invalid form configuration");
      }
  
      setForm({
        ...data,
        config: parsedConfig,
      });
  
      // 🔥 Initialize form data safely
      const initialData: Record<string, string> = {};
      parsedConfig.fields.forEach((field: FormField) => {
        initialData[field.id] = '';
      });
  
      setFormData(initialData);
  
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form');
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const checkExistingSubmission = async () => {
    if (!user || !formId) return;
  
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${formId}/submission-status/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
  
      if (!res.ok) return;
  
      const data = await res.json();
      if (data.submitted) {
        setIsSubmitted(true);
      }
    } catch {
      // No existing submission — OK
    }
  };
  
  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form || !user) return;

    // Validate required fields
    const missingRequired = form.config.fields
      .filter(f => f.required && !formData[f.id]?.trim())
      .map(f => f.label);

    if (missingRequired.length > 0) {
      toast.error(`Please fill in required fields: ${missingRequired.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/forms/${formId}/submit`, {

          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            submission_data: formData,
          }),
        }
      );
      
      
      if (!res.ok) {
        throw new Error('Submission failed');
      }
      

      toast.success('Form submitted successfully!');
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Form not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Form Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for submitting "{form.title}". Your response has been recorded.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{form.title}</CardTitle>
                  <CardDescription>{form.description || 'Please fill out all required fields'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {form?.config?.fields?.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : field.type === 'date' ? (
                      <Input
                        id={field.id}
                        type="date"
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    ) : field.type === 'number' ? (
                      <Input
                        id={field.id}
                        type="number"
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : field.type === 'boolean' ? (
                      <div className="flex items-center space-x-3 pt-2">
                        <Switch
                          id={field.id}
                          checked={formData[field.id] === 'true'}
                          onCheckedChange={(checked) => handleInputChange(field.id, checked ? 'true' : 'false')}
                        />
                        <Label htmlFor={field.id} className="text-sm text-muted-foreground">
                          {formData[field.id] === 'true' ? 'Yes' : 'No'}
                        </Label>
                      </div>
                    ) : (
                      <Input
                        id={field.id}
                        type="text"
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </motion.div>
                ))}

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Form'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
