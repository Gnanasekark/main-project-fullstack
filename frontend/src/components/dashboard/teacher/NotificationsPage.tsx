import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Bell,
  Send,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at: string | null;
  user_id: string;
  related_form_id: string | null;
  is_read: boolean | null;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface Form {
  id: string;
  title: string;
}

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  full_name: string | null;
  email: string;
  reg_no: string | null;
}

export function NotificationsPage() {
  const { user, role } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    channel: 'in_app' as 'in_app' | 'email' | 'whatsapp',
    relatedFormId: '',
    targetType: 'all' as 'all' | 'group' | 'individual',
    selectedGroupId: '',
    selectedStudentIds: new Set<string>(),
  });

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    fetchData();
  }, [role, user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (role === 'teacher' || role === 'admin') {
        const [notifRes, formsRes, groupsRes, studentsRes] = await Promise.all([
          fetch('http://localhost:5000/api/notifications'),
          fetch('http://localhost:5000/api/forms'),
          fetch('http://localhost:5000/api/groups'),
          fetch('http://localhost:5000/api/students'),
        ]);

        if (!notifRes.ok) throw new Error();

        setNotifications(await notifRes.json());
        setForms(formsRes.ok ? await formsRes.json() : []);
        setGroups(groupsRes.ok ? await groupsRes.json() : []);
        setStudents(studentsRes.ok ? await studentsRes.json() : []);
      } else {
        const res = await fetch(`http://localhost:5000/api/notifications/user/${user?.id}`);
        if (!res.ok) throw new Error();
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= SEND ================= */

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        selectedStudentIds: Array.from(formData.selectedStudentIds),
        senderId: user?.id,
      };

      const res = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success('Notification sent');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  /* ================= HELPERS ================= */

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      channel: 'in_app',
      relatedFormId: '',
      targetType: 'all',
      selectedGroupId: '',
      selectedStudentIds: new Set(),
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === 'pending') return <Clock className="w-4 h-4 text-warning" />;
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-destructive" />;
    return null;
  };

  const getChannelBadge = (channel: string) => {
    const map: any = {
      in_app: 'bg-primary/10 text-primary',
      email: 'bg-accent/10 text-accent',
      whatsapp: 'bg-success/10 text-success',
    };
    return (
      <Badge variant="outline" className={map[channel]}>
        {channel === 'in_app' ? 'In-App' : channel.toUpperCase()}
      </Badge>
    );
  };

  const filteredNotifications = notifications.filter(
    n =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin ? 'Send notifications' : 'Your notifications'}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Send Notification
          </Button>
        )}
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Bell className="inline w-5 h-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : filteredNotifications.length === 0 ? (
            <p className="text-muted-foreground text-center">No notifications</p>
          ) : (
            filteredNotifications.map(n => (
              <div
                key={n.id}
                className={`p-4 mb-3 border rounded-xl ${
                  n.is_read ? 'bg-muted/30' : 'bg-primary/5'
                }`}
                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{n.title}</h4>
                  {getChannelBadge(n.channel)}
                  {getStatusIcon(n.status)}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dialog UI remains unchanged */}
    </div>
  );
}
