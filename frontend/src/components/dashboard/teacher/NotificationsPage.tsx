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
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  channel: 'in_app' | 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  is_read: boolean | null;
  priority?: 'low' | 'medium' | 'high';
  type?: string;
}

export function NotificationsPage() {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forms, setForms] = useState<{ id: number; title: string }[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
const [students, setStudents] = useState<{ id: number; name: string }[]>([]);



const [formData, setFormData] = useState({
  title: 'Form Submission Reminder',   // ✅ DEFAULT VALUE
  message: 'Dear Student , This is a reminder to complete and submit the assigned form at the earliest.  Please ensure you submit it before the deadline. Thank you',
  channel: 'both',
  targetType: 'all',
  selectedGroupIds: new Set<number>(),

  selectedStudentIds: new Set<number>(),
});


  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
  
      // 🔔 Fetch notifications
      const notifRes = await fetch(
        isTeacherOrAdmin
          ? "http://localhost:5000/api/notifications"
          : `http://localhost:5000/api/notifications/user/${user?.id}`,
        { credentials: "include" }
      );
  
      setNotifications(notifRes.ok ? await notifRes.json() : []);
  
      // 📄 Fetch forms (ONLY ONCE, CORRECT WAY)
      // Fetch Forms (only once)
      if (isTeacherOrAdmin) {
        const token = localStorage.getItem("token");
      
        const formsRes = await fetch(
          "http://localhost:5000/api/forms",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      
        if (formsRes.ok) {
          const formsData = await formsRes.json();
          console.log("Forms Loaded:", formsData);
          setForms(formsData);
        } else {
          console.error("Forms failed");
          setForms([]);
        }
      }
      
  
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
    // ✅ Fetch Groups
if (isTeacherOrAdmin) {
  const res = await fetch(
    "http://localhost:5000/api/groups",
    { credentials: "include" }
  );

  if (res.ok) {
    const data = await res.json();
    console.log("Groups Loaded:", data);
    setGroups(data);
  } else {
    console.error("Groups fetch failed");
    setGroups([]);
  }
}

// ✅ Fetch students
if (isTeacherOrAdmin) {
    const token = localStorage.getItem("token");
  
    const res = await fetch(
      "http://localhost:5000/api/users/students",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  
    if (res.ok) {
      const data = await res.json();
      setStudents(data);
    } else {
      setStudents([]);
    }
  }
  

  };
  
  

  const handleMarkAsRead = async (id: number) => {
    await fetch(
      `http://localhost:5000/api/notifications/read/${id}`,
      { method: 'PUT', credentials: 'include' }
    );

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const filteredNotifications = notifications.filter(
    n =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
    if (status === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getPriorityColor = (priority?: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'secondary';
    return 'outline';
  };


  const handleSendNotification = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
  
      let selectedUserIds: number[] = [];
  
      // 🔥 CASE 1: ALL STUDENTS
      if (formData.targetType === "all") {
        const res = await fetch(
          "http://localhost:5000/api/users/students",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!res.ok) throw new Error("Failed to fetch students");
  
        const students = await res.json();
        selectedUserIds = students.map((s: any) => s.id);
      }
  
      // 🔥 CASE 2: GROUP
     // 🔥 CASE 2: MULTIPLE GROUPS
if (formData.targetType === "group") {
    const groupIds = Array.from(formData.selectedGroupIds);
  
    for (const groupId of groupIds) {
      const res = await fetch(
        `http://localhost:5000/api/groups/${groupId}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!res.ok) throw new Error("Failed to fetch group students");
  
      const groupStudents = await res.json();
      selectedUserIds.push(...groupStudents.map((s: any) => s.id));
    }
  }
  
  
      // 🔥 CASE 3: INDIVIDUAL
      if (formData.targetType === "individual") {
        selectedUserIds = Array.from(formData.selectedStudentIds);
      }
  
      if (selectedUserIds.length === 0) {
        toast.error("No recipients selected");
        return;
      }
  
      const res = await fetch(
        "http://localhost:5000/api/notifications/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,  // ✅ CORRECT PLACE
          },
          body: JSON.stringify({
            user_ids: selectedUserIds,
            title: formData.title,
            message: formData.message,
            form_id:
              formData.relatedFormId && formData.relatedFormId !== "none"
                ? formData.relatedFormId
                : null,
          }),
        }
      );
  
      if (!res.ok) throw new Error("Send failed");
  
      toast.success("Notification sent successfully");
      setIsCreateOpen(false);
  
    } catch (error) {
      console.error(error);
      toast.error("Failed to send notification");
    }
  };
  
  console.log("Forms state:", forms);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {isTeacherOrAdmin
              ? 'Send reminders and notifications to students.'
              : 'View your notifications.'}
          </p>
        </div>

        {isTeacherOrAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        )}
      </div>

      

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {isTeacherOrAdmin ? 'Sent Notifications' : 'Your Notifications'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-10">
              No notifications found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl border cursor-pointer ${
                    notification.is_read
                      ? 'bg-muted'
                      : 'bg-primary/5 border-primary'
                  }`}
                  onClick={() =>
                    !notification.is_read &&
                    handleMarkAsRead(notification.id)
                  }
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">
                      {notification.title}
                    </h4>

                    {notification.priority && (
                      <Badge variant={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>

                  <div className="flex items-center gap-2 text-xs mt-2 text-muted-foreground">
                    {getStatusIcon(notification.status)}
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      {/* Send Notification Dialog */}
<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">
        Send Notification
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-5">

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="e.g. Form Submission Reminder"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Message <span className="text-red-500">*</span>
        </label>
        <Textarea
          placeholder="Enter your notification message..."
          rows={4}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
        />
      </div>

      {/* Channel + Related Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Channel */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Channel</label>
          <Select
  value={formData.channel}
  onValueChange={(value) =>
    setFormData({ ...formData, channel: value })
  }
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="email">Email</SelectItem>
    <SelectItem value="whatsapp">WhatsApp</SelectItem>
    <SelectItem value="both">Email + WhatsApp</SelectItem>
  </SelectContent>
</Select>

        </div>

        {/* Related Form */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Related Form (Optional)
          </label>
          <Select
  value={formData.relatedFormId || "none"}
  onValueChange={(value) =>
    setFormData({ ...formData, relatedFormId: value })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Select a form" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">None</SelectItem>
    {forms.map((form) => (
      <SelectItem
        key={form.id}
        value={form.id.toString()}
      >
        {form.title}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

        </div>
      </div>

      {/* Send To */}
      {/* Send To */}
<div className="space-y-2">
  <label className="text-sm font-medium">Send To</label>

  <Select
    value={formData.targetType}
    onValueChange={(value) =>
      setFormData({
        ...formData,
        targetType: value as 'all' | 'group' | 'individual',
      })
    }
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="all">All Students</SelectItem>
      <SelectItem value="group">Specific Group</SelectItem>
      <SelectItem value="individual">Individual Students</SelectItem>
    </SelectContent>
  </Select>

  {/* ✅ THIS APPEARS BELOW Send To */}
  {formData.targetType === "group" && (
  <div className="space-y-3 mt-3">
    <label className="text-sm font-medium">Select Groups</label>

    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
      {groups.map((group) => {
        const isSelected = formData.selectedGroupIds.has(group.id);

        return (
          <div
            key={group.id}
            onClick={() => {
              const newSet = new Set(formData.selectedGroupIds);

              if (isSelected) {
                newSet.delete(group.id);
              } else {
                newSet.add(group.id);
              }

              setFormData({
                ...formData,
                selectedGroupIds: newSet,
              });
            }}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition
              ${
                isSelected
                  ? "bg-green-100 border border-green-500"
                  : "hover:bg-muted"
              }`}
          >
            <span className="text-sm">{group.name}</span>

            {isSelected && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
        );
      })}
    </div>
  </div>
)}


</div>


    </div>

    <DialogFooter className="mt-6">
      <Button
        variant="outline"
        onClick={() => setIsCreateOpen(false)}
      >
        Cancel
      </Button>

      <Button
        onClick={handleSendNotification}
        disabled={isSubmitting}
      >
        {isSubmitting && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        Send Notification
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
  
  
          
        
  
}
