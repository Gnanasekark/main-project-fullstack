import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import axios from "axios";
import NotificationAnalytics from "./NotificationAnalytics";
import TemplatesManager from "./TemplatesManager";
import NotificationChart from "./NotificationChart";
import { useNavigate } from "react-router-dom";
import SentRemindersHistory from "./SentRemindersHistory";
import { useSocket } from "@/hooks/useSocket";



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
  channel: 'email' | 'whatsapp' | 'email,whatsapp';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  is_read: boolean | null;
  sender_name?: string;
  sender_email?: string;
  related_form_id?: number;
  priority?: 'low' | 'medium' | 'high';
  type?: string;
}

export function NotificationsPage() {
  
  const { user, role } = useAuth();
  useSocket("newNotification", (data) => {
    toast.success(data.title);
  });
  
  useSocket("analyticsUpdated", () => {
    fetchData();
  });
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forms, setForms] = useState<{ id: number; title: string }[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
const [students, setStudents] = useState<{ id: number; name: string }[]>([]);
const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
const [selectedReminder, setSelectedReminder] = useState<any>(null);
const [expandedId, setExpandedId] = useState<number | null>(null);
const [detailsData, setDetailsData] = useState<any>({});


const [formData, setFormData] = useState({
  title: 'Form Submission Reminder',   // ✅ DEFAULT VALUE
  message: 'Dear Student , This is a reminder to complete and submit the assigned form at the earliest.  Please ensure you submit it before the deadline. Thank you',
  channel: 'both',
  targetType: 'all',
  relatedFormId: "none",   // ✅ ADDED
  selectedGroupIds: new Set<number>(),

  selectedStudentIds: new Set<number>(),
});
const [analytics, setAnalytics] = useState({
    total: 0,
    read: 0,
    unread: 0,
    successRate: 0,
  });


  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';
  console.log("Role:", role);


  

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
  
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found");
        return;
      }
      
  
      // 🔔 1. Fetch notifications
      const notifRes = await fetch(
        isTeacherOrAdmin
          ? "http://localhost:5000/api/notifications"
          : "http://localhost:5000/api/notifications/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      } else {
        setNotifications([]);
      }
      // 📊 2. Fetch analytics
      const analyticsRes = await fetch(
        "http://localhost:5000/api/notificationAnalytics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        console.log("Analytics:", analyticsData);
        setAnalytics(analyticsData);
      }
          

      // 👥 4. Fetch groups (teacher/admin only)
if (isTeacherOrAdmin) {
  const groupsRes = await fetch(
    "http://localhost:5000/api/groups",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (groupsRes.ok) {
    const groupsData = await groupsRes.json();
    setGroups(groupsData);
  } else {
    setGroups([]);
  }
}
      
      

      
  
      // 📄 3. Fetch forms (teacher/admin only)
      if (isTeacherOrAdmin) {
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
          setForms(formsData);
        } else {
          setForms([]);
        }
      }
  
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const handleMarkAsRead = async (id: number) => {
    const token = localStorage.getItem("token");

await fetch(
  `http://localhost:5000/api/notifications/read/${id}`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
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
    if (status === 'completed')
      return <CheckCircle className="w-4 h-4 text-green-600" />;
  
    if (status === 'pending')
      return <Clock className="w-4 h-4 text-yellow-500" />;
  
    if (status === 'failed')
      return <AlertCircle className="w-4 h-4 text-red-500" />;
  
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
          "http://localhost:5000/api/students",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!res.ok) throw new Error("Failed to fetch students");
        const studentsData = await res.json();
        selectedUserIds = studentsData.map((s: any) => s.user_id);
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
            channel: formData.channel,   // ✅ ADD THIS LINE
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
  
      {/* ✅ Analytics Section FIRST */}
    

    {/* ===== ANALYTICS CARDS ===== */}
    {isTeacherOrAdmin && (
  <div className="grid grid-cols-5 gap-6 mb-6">

<div className="bg-white shadow p-6 rounded-xl">
  <p className="text-gray-500">Total Sent</p>
  <h2 className="text-3xl font-bold">{analytics.total}</h2>
</div>

<div className="bg-green-50 shadow p-6 rounded-xl">
  <p className="text-gray-500">Read</p>
  <h2 className="text-3xl font-bold text-green-600">
    {analytics.read}
  </h2>
</div>

<div className="bg-yellow-50 shadow p-6 rounded-xl">
  <p className="text-gray-500">Unread</p>
  <h2 className="text-3xl font-bold text-yellow-600">
    {analytics.unread}
  </h2>
</div>

<div className="bg-blue-50 shadow p-6 rounded-xl">
  <p className="text-gray-500">Success Rate</p>
  <h2 className="text-3xl font-bold text-blue-600">
    {analytics.successRate}%
  </h2>
</div>

<div className="flex items-center justify-center bg-white shadow rounded-xl">
  <Button variant="outline">
    Export as CSV
  </Button>

  </div>
</div>
    )}
  
  
    {/* ===== SENT NOTIFICATIONS SECTION ===== */}
    

{/* LEFT SIDE */}
  {/* MAIN CONTENT GRID */}

  <div className="space-y-6">
{/* LEFT SECTION */}
<div className="lg:col-span-2 space-y-6">

  {/* SEARCH + SORT */}
  <div className="bg-white shadow rounded-xl p-6">
    <div className="flex justify-between items-center">
      <div className="relative w-2/3">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-sm">Sort:</span>
        <Select defaultValue="today">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>

  {/* REMINDER HISTORY */}
  {isTeacherOrAdmin && (
  <div className="bg-white shadow rounded-xl p-6">
    <SentRemindersHistory />
  </div>
)}

  {/* NOTIFICATIONS LIST */}
  <div className="bg-white shadow rounded-xl p-6 space-y-4">
    {filteredNotifications.map(notification => (
      <div
        key={notification.id}
        className="rounded-2xl border p-5 hover:shadow-lg transition cursor-pointer"
        onClick={async () => {
          await handleMarkAsRead(notification.id);
          setSelectedNotification(notification);
        }}
      >
        <div className="flex justify-between items-start">
  <div>
    <h4 className="font-semibold text-lg">
      {notification.title}
    </h4>
  </div>

  <div className="flex items-center gap-3">
    {notification.status === "sent" && (
      <div className="flex items-center gap-2 text-green-600 font-medium">
        <CheckCircle className="w-4 h-4" />
        Sent
      </div>
    )}


{isTeacherOrAdmin && (
  <Button
    variant="outline"
    size="sm"
    onClick={async (e) => {
      e.stopPropagation();

      if (expandedId === notification.id) {
        setExpandedId(null);
        return;
      }

      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/notifications/${notification.id}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setDetailsData(data);
      setExpandedId(notification.id);
    }}
  >
    View Details
  </Button>
)}


  </div>

        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {notification.message}
        </p>
        {isTeacherOrAdmin &&
  expandedId === notification.id &&
  detailsData && (
  <div className="mt-6 p-6 bg-gray-50 rounded-2xl border space-y-6">

    {/* 🔹 Reminder Type */}
    <div>
      <h4 className="font-semibold mb-3">Reminder Type</h4>
      <div className="flex gap-6 items-center">
        <span className="flex items-center gap-2 text-blue-600">
          📧 Email Sent <CheckCircle className="w-4 h-4 text-green-600" />
        </span>
        <span className="flex items-center gap-2 text-green-600">
          🟢 WhatsApp Sent <CheckCircle className="w-4 h-4 text-green-600" />
        </span>
      </div>
    </div>

    {/* 🔹 Summary Row (ONLY ONCE) */}
    <div className="grid grid-cols-4 gap-6 bg-white p-4 rounded-xl border">
      <div>
        <p className="text-gray-500 text-sm">Total Students</p>
        <p className="font-bold text-lg">{detailsData.total}</p>
      </div>

      <div>
        <p className="text-green-600 text-sm">Read</p>
        <p className="font-bold text-lg">{detailsData.read}</p>
      </div>

      <div>
        <p className="text-yellow-600 text-sm">Unread</p>
        <p className="font-bold text-lg">{detailsData.unread}</p>
      </div>

      <div>
        <p className="text-blue-600 text-sm">Success Rate</p>
        <p className="font-bold text-lg">
          {detailsData.successRate}%
        </p>
      </div>
    </div>

    {/* 🔹 Student Lists in Rows */}
    <div className="grid grid-cols-3 gap-6">
    <div>
  <h4 className="font-semibold mb-3">Total Students</h4>
  <div className="space-y-2 max-h-60 overflow-y-auto">
    {detailsData?.allStudents?.map((student: any) => (
      <div key={student.id} className="bg-white p-3 rounded-lg border text-sm">
        <p className="font-medium">
  {student.full_name} 
  <span className="text-gray-500">
    ({student.reg_no})
  </span>
</p>
      </div>
    ))}
  </div>
</div>
      {/* Total Students */}
      

      {/* Read Students */}
      <div>
  <h4 className="font-semibold text-green-600 mb-3">
    Read Students
  </h4>

  <div className="space-y-3 max-h-60 overflow-y-auto">
    {detailsData?.readStudents?.length === 0 && (
      <p className="text-gray-400 text-sm">No students have read yet.</p>
    )}

    {detailsData?.readStudents?.map((student: any) => (
      <div
        key={student.id}
        className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm"
      >
       

        <p className="text-green-600 text-xs font-semibold mt-1">
          ✅ {new Date(student.read_at).toLocaleString()}
        </p>
      </div>
    ))}
  </div>
</div>

      {/* Unread Students */}
      <div>
  <h4 className="font-semibold text-yellow-600 mb-3">
    Unread Students
  </h4>

  <div className="space-y-3 max-h-60 overflow-y-auto">
    {detailsData?.unreadStudents?.length === 0 && (
      <p className="text-gray-400 text-sm">All students have read.</p>
    )}

    {detailsData?.unreadStudents?.map((student: any) => (
      <div
        key={student.id}
        className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm flex justify-between items-center"
      >
       

        <span className="text-red-600 text-xs font-semibold">
          UNREAD
        </span>
      </div>
    ))}
  </div>
</div>





    </div>

  </div>
)}

         

        <div className="text-xs text-muted-foreground mt-3">
          {new Date(notification.created_at).toLocaleString()}
        </div>

      </div>
    ))}
  </div>
  

</div>

{/* RIGHT SECTION - PIE CHART */}


</div>
{isTeacherOrAdmin && selectedNotification && (
  <div className="mt-6 bg-white rounded-xl shadow p-6">
    <h3 className="text-lg font-semibold mb-4 text-center">
      Read vs Unread
    </h3>

    <div className="flex justify-center">
      <NotificationChart
        read={analytics.read}
        unread={analytics.unread}
      />
    </div>
  </div>
)}
     
  
      {/* 🔵 Keep Your Dialog Below (UNCHANGED) */}

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
export default NotificationsPage;