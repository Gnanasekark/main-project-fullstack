import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Users, User, Loader2, Calendar, Clock, Search } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  degree: string | null;
  branch: string | null;
  year: string | null;
  section: string | null;
  member_count?: number;
}

interface Student {
  id: string;
  full_name: string | null;
  email: string;
  reg_no: string | null;
  degree: string | null;
  branch: string | null;
  year: string | null;
  section: string | null;
}

interface FormAssignmentDialogProps {
  formId: string | null;
  formTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FormAssignmentDialog({ formId, formTitle, open, onOpenChange, onSuccess }: FormAssignmentDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'groups' | 'students'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [reminderInterval, setReminderInterval] = useState('24');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupStudents, setGroupStudents] = useState([]);


  useEffect(() => {
    if (open) {
      fetchData();
      // Reset selections when dialog opens
      setSelectedGroups([]);
      setSelectedStudents([]);
    }
  }, [open]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch groups with member count
      const groupsRes = await fetch("http://localhost:5000/api/groups");
      if (!groupsRes.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
  
      // Fetch students
      const studentsRes = await fetch("http://localhost:5000/api/students");
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const studentsData = await studentsRes.json();
      setStudents(studentsData);
  
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAssign = async () => {
    if (!formId) return;
  
    if (selectedGroups.length === 0 && selectedStudents.length === 0) {
      toast.error("Please select at least one group or student");
      return;
    }
  
    setIsSaving(true);
  
    try {
      const assignments = [];

// Assign to selected groups
selectedGroups.forEach(groupId => {
  assignments.push({
    form_id: formId,
    assigned_by: user?.id,
    assigned_to_group_id: groupId,
    assigned_to_user_id: null,
    due_date: dueDate || null,
    reminder_interval_hours: parseInt(reminderInterval),
    reminder_trigger_time: reminderTime,
  });
});

// Assign to selected students
selectedStudents.forEach(studentId => {
  assignments.push({
    form_id: formId,
    assigned_by: user?.id,
    assigned_to_group_id: null,
    assigned_to_user_id: studentId,
    due_date: dueDate || null,
    reminder_interval_hours: parseInt(reminderInterval),
    reminder_trigger_time: reminderTime,
  });
});

await fetch("http://localhost:5000/api/form-assignments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(assignments), // 🔥 now sending array
});

      toast.success("Form assigned successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning form:", error);
      toast.error("Failed to assign form");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGroupSelect = async (groupId: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/groups/${groupId}/students`
      );
  
      const data = await res.json();
      // Remove duplicates using Map
const uniqueStudents = Array.from(
  new Map(data.map((s: any) => [s.id, s])).values()
);

setGroupStudents(uniqueStudents);

    } catch (error) {
      console.error("Failed to fetch group students");
    }
  };
  

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.degree?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueStudents = Array.from(
    new Map(students.map(s => [s.id, s])).values()
  );
  
  const filteredStudents = uniqueStudents.filter(s =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.reg_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Assign Form</DialogTitle>
          <DialogDescription>
            Assign "{formTitle}" to groups or individual students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'groups' | 'students')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Groups ({selectedGroups.length})
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
  <User className="w-4 h-4" />
  Students ({selectedStudents.length})

</TabsTrigger>


            </TabsList>

            <TabsContent value="groups" className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {filteredGroups.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No groups found</p>
                    ) : (
                      filteredGroups.map((group) => (
                        <div
                          key={group.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedGroups.includes(group.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={async () => {
                            const isAlreadySelected = selectedGroups.includes(group.id);
                          
                            toggleGroup(group.id);
                          
                            try {
                              const res = await fetch(
                                `http://localhost:5000/api/groups/${group.id}/students`
                              );
                          
                              if (res.ok) {
                                const data = await res.json();
                          
                                const unique = Array.from(
                                  new Map(data.map((s: any) => [s.id, s])).values()
                                );
                          
                                setGroupStudents(unique);
                          
                                // 🔥 AUTO SELECT STUDENTS WHEN GROUP SELECTED
                                if (!isAlreadySelected) {
                                  setSelectedStudents(unique.map((s: any) => s.id));
                                } else {
                                  setSelectedStudents([]);
                                  setGroupStudents([]);
                                }
                              }
                            } catch (error) {
                              console.error("Failed to fetch group students");
                            }
                          }}
                          

                        >
                          <Checkbox checked={selectedGroups.includes(group.id)} />
                          <div className="flex-1">
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-muted-foreground">
                            {group.member_count || 0} members
</p>

                          </div>
                          <Badge variant="outline">
                            {group.degree} - {group.branch}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="students" className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                  {groupStudents.length > 0 ? (
  groupStudents.map((student: any) => (
    <div
      key={student.id}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
        selectedStudents.includes(student.id)
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={() => toggleStudent(student.id)}
    >
      <Checkbox checked={selectedStudents.includes(student.id)} />
      <div className="flex-1">
        <p className="font-medium">
          {student.full_name || "Unnamed"}
        </p>
        <p className="text-sm text-muted-foreground">
          Reg No: {student.reg_no || "-"}
        </p>
      </div>
    </div>
  ))
) : filteredStudents.length === 0 ? (
  <p className="text-center text-muted-foreground py-4">
    No students found
  </p>
) : (
  filteredStudents.map((student) => (

                        <div
                          key={student.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedStudents.includes(student.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => toggleStudent(student.id)}
                        >
                          <Checkbox checked={selectedStudents.includes(student.id)} />
                          <div className="flex-1">
                            <p className="font-medium">{student.full_name || 'Unnamed'}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.reg_no || student.email}
                            </p>
                          </div>
                          {student.degree && (
                            <Badge variant="outline">
                              {student.degree} - {student.branch}
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          {/* Settings */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reminder Interval (hrs)
              </Label>
              <Input
                type="number"
                min="1"
                value={reminderInterval}
                onChange={(e) => setReminderInterval(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reminder Time
              </Label>
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign to ${selectedGroups.length + selectedStudents.length} recipients`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
