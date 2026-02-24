import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileSpreadsheet, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface FormWithAssignment {
  id: string;
  form_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_submitted: boolean;
  submitted_at: string | null;

  sender_name?: string;
  sender_email?: string;
}

interface StudentDashboardProps {
  showFormsOnly?: boolean;
}

export function StudentDashboard({ showFormsOnly = false }: StudentDashboardProps) {
  const { profile, user, loading } = useAuth();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
const highlightId = searchParams.get("highlight");
  const [forms, setForms] = useState<FormWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    overdue: 0,
  });
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  

  useEffect(() => {
    if (user && profile) {
      fetchAssignedForms();
    }
  }, [user, profile]);
  

  const fetchAssignedForms = async () => {
    if (!user) return;
  
    try {
      const res = await fetch(
        `http://localhost:5000/api/students/${user.id}/assigned-forms`
      );
  
      if (!res.ok) throw new Error("Failed to fetch forms");
  
      const data = await res.json();
  
      setForms(data.forms);
      setStats(data.stats);
  
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingForms = forms.filter(f => !f.is_submitted);
  const completedForms = forms.filter(f => f.is_submitted);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">
          {greeting()}, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your pending forms and submissions.
        </p>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatCard
          title="Pending Forms"
          value={stats.pending}
          icon={Clock}
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="text-success"
          bgColor="bg-success/10"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          color="text-destructive"
          bgColor="bg-destructive/10"
        />
      </motion.div>

      {/* Pending forms list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingForms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  You have no pending forms at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
               {pendingForms.map((form) => (
              <FormCard 
                key={form.id}
                form={form}
                highlight={form.form_id.toString() === highlightId}
                onFill={() => navigate(`/form/${form.form_id}`)}
              />
            ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Completed forms */}
      {completedForms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Completed Forms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedForms.map((form) => (
                  <div
                    key={form.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-success" />
                      </div>
                      <div>
  <h4 className="font-semibold">{form.title}</h4>

  <p className="text-xs text-muted-foreground mt-1">
    From: {form.sender_name || "Unknown"}
    {form.sender_email && <> ({form.sender_email})</>}
  </p>

  <p className="text-sm text-muted-foreground">
    Submitted {form.submitted_at ? new Date(form.submitted_at).toLocaleDateString() : ''}
  </p>
</div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      Completed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Student info card */}
      {profile?.reg_no && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <InfoItem label="Reg No" value={profile.reg_no} />
                <InfoItem label="Degree" value={profile.degree || '-'} />
                <InfoItem label="Branch" value={profile.branch || '-'} />
                <InfoItem label="Year" value={profile.year ? `${profile.year} Year` : '-'} />
                <InfoItem label="Section" value={profile.section || '-'} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormCard({ 
  form, 
  onFill,
  highlight 
}: { 
  form: FormWithAssignment; 
  onFill: () => void;
  highlight?: boolean;
}) {
  const isOverdue = form.due_date && new Date(form.due_date) < new Date();

  return (
    <div
  id={`form-${form.form_id}`}
  className={`flex items-center justify-between p-4 rounded-xl border transition-all
    ${highlight 
      ? 'border-primary ring-2 ring-primary shadow-lg bg-primary/5' 
      : 'border-border hover:border-primary/50'
    }
  `}
>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isOverdue ? 'bg-destructive/10' : 'bg-primary/10'
        }`}>
          <FileSpreadsheet className={`w-5 h-5 ${isOverdue ? 'text-destructive' : 'text-primary'}`} />
        </div>
        <div>
  <h4 className="font-semibold">{form.title}</h4>

  {/* Staff Info */}
  <p className="text-xs text-muted-foreground mt-1">
    From: {form.sender_name || "Unknown"}
    {form.sender_email && (
      <> ({form.sender_email})</>
    )}
  </p>

  {/* Due Date */}
  <p className="text-sm text-muted-foreground">
    {form.due_date
      ? `Due: ${new Date(form.due_date).toLocaleDateString()}`
      : 'No due date'}
  </p>
</div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={isOverdue ? 'bg-destructive/10 text-destructive border-destructive/30' : ''}>
          {isOverdue ? 'Overdue' : 'Pending'}
        </Badge>
        <Button size="sm" onClick={onFill}>
          Fill Form
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
