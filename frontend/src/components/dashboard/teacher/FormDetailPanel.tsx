import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useAuth } from '@/hooks/useAuth';
import { 
  Eye, 
  Users, 
  Download, 
  Trash2, 
  Loader2, 
  Settings2,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Bell,
  UserCheck,
  UserX,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { FormResponsesDialog } from './FormResponsesDialog';
 
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
 
 interface StudentStatus {
   id: string;
   full_name: string | null;
   email: string;
   reg_no: string | null;
   phone?: string;      // ADD THIS
   submitted: boolean;
   submitted_at?: string;
   submission_data?: Record<string, unknown>;
 }
 
 interface FormDetailPanelProps {
   form: Form | null;
   onPreview: (form: Form) => void;
   onAssign: (form: Form) => void;
   onEditFields: (form: Form) => void;
   onRefresh: () => void;
 }
 
 export function FormDetailPanel({ 
   form, 
   onPreview, 
   onAssign, 
   onEditFields,
   onRefresh 
 }: FormDetailPanelProps) {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [responsesForm, setResponsesForm] = useState<Form | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [assignedGroups, setAssignedGroups] = useState<{ id: number; name: string }[]>([]);
  
   useEffect(() => {
    if (form) {
      fetchStudentStatuses();
      fetchAssignedGroups();
    }
  }, [form?.id]);


  const fetchAssignedGroups = async () => {
    if (!form) return;
  
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}/assigned-groups`
      );
  
      if (!res.ok) throw new Error("Failed");
  
      const data = await res.json();
      setAssignedGroups(data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };
 
   const fetchStudentStatuses = async () => {
    if (!form) return;
  
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}/student-status`
      );
  
      if (!res.ok) throw new Error("Failed to fetch student statuses");
  
      const data = await res.json();
      setStudents(data);
  
    } catch (error) {
      console.error("Error fetching student statuses:", error);
      toast.error("Failed to load student data");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!form || !confirm('Are you sure you want to delete this form?')) return;
  
    setIsDeleting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}`,
        { method: "DELETE" }
      );
  
      if (!res.ok) throw new Error("Delete failed");
  
      toast.success("Form deleted");
      onRefresh();
  
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form");
    } finally {
      setIsDeleting(false);
    }
  };
  
 
  const handleDownload = async (type: "submitted" | "pending" | "all") => {
    if (!form) return;
  
    setIsDownloading(true);
    try {
      let dataToExport: StudentStatus[] = [];
  
      if (type === "submitted") {
        dataToExport = submittedStudents;
      } else if (type === "pending") {
        dataToExport = pendingStudents;
      } else {
        dataToExport = students; // full list
      }
  
      if (dataToExport.length === 0) {
        toast.info("No data to download");
        setIsDownloading(false);
        return;
      }
  
      const headers = [
        "Status",
        "Submitted At",
        "Reg No",
        "Name",
        "Email",
        "Contact No",  // ADD
      ];
  
      const rows = dataToExport.map((student) => [
        student.submitted ? "Submitted" : "Pending",
        student.submitted_at
          ? new Date(student.submitted_at).toLocaleString()
          : "-",
        student.reg_no || "",
        student.full_name || "",
        student.email,
        student.phone || "-",   // ADD
      ]);
  
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Form Status");
  
      XLSX.writeFile(
        workbook,
        `${form.title.replace(/[^a-zA-Z0-9]/g, "_")}_${type}.xlsx`
      );
  
      toast.success("Download successful");
    } catch (error) {
      toast.error("Download failed");
    } finally {
      setIsDownloading(false);
    }
  };
 
   const handleRemind = async (student: StudentStatus) => {
    if (!form || !user) return;
  
    setSendingReminder(student.id);
  
    try {
      const res = await fetch("http://localhost:5000/api/notifications/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // 🔥 REQUIRED
        },
        body: JSON.stringify({
          user_ids: [student.id], 
          form_id: form.id,   // ✅ VERY IMPORTANT             // ✅ must be array
          title: `Reminder: ${form.title}`,
          message: `Please complete the form "${form.title}" at your earliest convenience.`,
          channel: "both",
        }),
      });
  
      if (!res.ok) throw new Error("Reminder failed");
  
      toast.success(`Reminder sent to ${student.full_name || student.email}`);
  
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };
  

  



  const handleRemindAll = async () => {
    if (!form || pendingStudents.length === 0) return;
  
    setSendingReminder("all");
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
  
      const res = await fetch(
        `http://localhost:5000/api/forms/${form.id}/remind-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_ids: pendingStudents.map(s => s.id),
            form_id: form.id,
            channel: "both"
          }),
        }
      );
  
      if (!res.ok) {
        const text = await res.text();
        console.log("Backend error:", text);
        throw new Error("Bulk reminder failed");
      }
  
      toast.success(`Reminder sent to ${pendingStudents.length} student(s)`);
    } catch (error) {
      console.error("Error sending reminders:", error);
      toast.error("Failed to send reminders");
    } finally {
      setSendingReminder(null);
    }
  };





  const pendingStudents = students.filter(s => !s.submitted);
  const submittedStudents = students.filter(s => s.submitted);
  const completionRate = students.length > 0 ? (submittedStudents.length / students.length) * 100 : 0;
 
   if (!form) {
     return (
       <div className="flex-1 flex items-center justify-center bg-muted/20">
         <div className="text-center px-8">
           <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
             <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
           </div>
           <h3 className="text-lg font-semibold mb-2">Select a Form</h3>
           <p className="text-muted-foreground text-sm max-w-sm">
             Choose a form from the list to view details, track submissions, and manage pending students.
           </p>
         </div>
       </div>
     );
   }
 
   return (
    <div className="flex-1 flex flex-col overflow-auto">
       {/* Form Header */}
       <div className="p-6 border-b border-border">
         <motion.div
           key={form.id}
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex items-start justify-between gap-4"
         >
           <div className="flex-1 min-w-0">
             <h2 className="text-xl font-bold truncate">{form.title}</h2>
             <p className="text-sm text-muted-foreground mt-1">
  {form.config.fields.length} fields • Created {new Date(form.created_at).toLocaleDateString()}
</p>

{assignedGroups.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3">
    {assignedGroups.map(group => (
      <Badge key={group.id} variant="secondary">
        {group.name}
      </Badge>
    ))}
  </div>
)}
           </div>
           <div className="flex items-center gap-2 shrink-0">
             <Button size="sm" variant="outline" onClick={() => onPreview(form)}>
               <Eye className="w-4 h-4 mr-1" />
               Preview
             </Button>
             <Button size="sm" variant="outline" onClick={() => onEditFields(form)}>
               <Settings2 className="w-4 h-4 mr-1" />
               Edit
             </Button>
             <Button size="sm" onClick={() => onAssign(form)}>
               <Users className="w-4 h-4 mr-1" />
               Assign
             </Button>
           </div>
         </motion.div>
 
         {/* Stats Cards */}
         <div className="grid grid-cols-4 gap-4 mt-6">
           <Card className="bg-blue-500/10 border-blue-500/20">
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                   <Users className="w-5 h-5 text-blue-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">{students.length}</p>
                   <p className="text-xs text-muted-foreground">Assigned</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-green-500/10 border-green-500/20">
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                   <UserCheck className="w-5 h-5 text-green-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">{submittedStudents.length}</p>
                   <p className="text-xs text-muted-foreground">Submitted</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-orange-500/10 border-orange-500/20">
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                   <UserX className="w-5 h-5 text-orange-600" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">{pendingStudents.length}</p>
                   <p className="text-xs text-muted-foreground">Pending</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="border-primary/20">
             <CardContent className="p-4">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <p className="text-xs text-muted-foreground">Completion</p>
                   <p className="text-sm font-bold">{Math.round(completionRate)}%</p>
                 </div>
                 <Progress value={completionRate} className="h-2" />
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
 
       {/* Tabs for Pending/Submitted */}
       <div className="flex-1 flex flex-col">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
           <div className="px-6 pt-4 border-b border-border">
             <TabsList className="bg-muted/50">
               <TabsTrigger value="pending" className="gap-2">
                 <Clock className="w-4 h-4" />
                 Pending
                 {pendingStudents.length > 0 && (
                   <Badge variant="secondary" className="ml-1 bg-orange-500/20 text-orange-600">
                     {pendingStudents.length}
                   </Badge>
                 )}
               </TabsTrigger>
               <TabsTrigger value="submitted" className="gap-2">
                 <CheckCircle2 className="w-4 h-4" />
                 Submitted
                 {submittedStudents.length > 0 && (
                   <Badge variant="secondary" className="ml-1 bg-green-500/20 text-green-600">
                     {submittedStudents.length}
                   </Badge>
                 )}
               </TabsTrigger>
             </TabsList>
           </div>
 
           <TabsContent value="pending" className="m-0">
           <div className="overflow-auto">
               <div className="p-6">
                 {isLoading ? (
                   <div className="flex items-center justify-center py-12">
                     <Loader2 className="w-6 h-6 animate-spin text-primary" />
                   </div>
                 ) : pendingStudents.length === 0 ? (
                   <div className="text-center py-12">
                     <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                       <CheckCircle2 className="w-6 h-6 text-green-600" />
                     </div>
                     <h3 className="font-semibold mb-1">All caught up!</h3>
                     <p className="text-sm text-muted-foreground">
                       {students.length > 0 ? 'All assigned students have submitted.' : 'No students assigned yet.'}
                     </p>
                   </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">{pendingStudents.length} student(s) haven't submitted yet</p>
                        {pendingStudents.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleRemindAll}
                            disabled={sendingReminder === 'all'}
                          >
                            {sendingReminder === 'all' ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Bell className="w-4 h-4 mr-1" />
                            )}
                            Remind All
                          </Button>
                        )}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reg No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Contact No</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingStudents.map((student) => (
                            <TableRow key={student.id}>
  <TableCell className="font-medium">{student.reg_no || '-'}</TableCell>
  <TableCell>{student.full_name || 'Unknown'}</TableCell>
  <TableCell className="text-muted-foreground">{student.email}</TableCell>

  {/* ✅ CONTACT NUMBER COLUMN */}
  <TableCell>
    {student.phone || "-"}
  </TableCell>

  {/* ✅ ACTION COLUMN */}
  <TableCell className="text-right">
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleRemind(student)}
      disabled={sendingReminder === student.id}
    >
      {sendingReminder === student.id ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1" />
      ) : (
        <Bell className="w-4 h-4 mr-1" />
      )}
      Remind
    </Button>
  </TableCell>
</TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
               </div>
               </div>
           </TabsContent>
 
           <TabsContent value="submitted" className="m-0">
          <div className="overflow-auto">
               <div className="p-6">
                 {isLoading ? (
                   <div className="flex items-center justify-center py-12">
                     <Loader2 className="w-6 h-6 animate-spin text-primary" />
                   </div>
                 ) : submittedStudents.length === 0 ? (
                   <div className="text-center py-12">
                     <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                       <Clock className="w-6 h-6 text-muted-foreground" />
                     </div>
                     <h3 className="font-semibold mb-1">No submissions yet</h3>
                     <p className="text-sm text-muted-foreground">
                       Students haven't submitted their responses.
                     </p>
                   </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">{submittedStudents.length} submission(s)</p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setResponsesForm(form)}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          View Full Responses
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Submitted At</TableHead>
                            <TableHead>Reg No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Contact No</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
  {submittedStudents.map((student) => (
    <TableRow key={student.id}>
      <TableCell className="text-muted-foreground">
        {student.submitted_at
          ? new Date(student.submitted_at).toLocaleString()
          : '-'}
      </TableCell>

      <TableCell className="font-medium">
        {student.reg_no || '-'}
      </TableCell>

      <TableCell>
        {student.full_name || 'Unknown'}
      </TableCell>

      <TableCell className="text-muted-foreground">
        {student.email}
      </TableCell>

      {/* ✅ ADD THIS */}
      <TableCell>
        {student.phone || '-'}
      </TableCell>
    </TableRow>
  ))}
</TableBody>
                      </Table>
                    </>
                  )}
               </div>
               </div>
           </TabsContent>
         </Tabs>
       </div>
 
       {/* Footer Actions */}
       <div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDownload("pending")}
  >
    Download Pending
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={() => handleDownload("submitted")}
  >
    Download Submitted
  </Button>

  <Button
    variant="default"
    size="sm"
    onClick={() => handleDownload("all")}
  >
    Download Full Status
  </Button>
</div>

        {/* Responses Dialog */}
        <FormResponsesDialog
          form={responsesForm}
          open={!!responsesForm}
          onOpenChange={(open) => !open && setResponsesForm(null)}
        />
      </div>
    );
  }