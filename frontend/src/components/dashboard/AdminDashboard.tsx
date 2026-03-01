import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { 
  Users, 
  FileSpreadsheet, 
  UserCheck, 
  Building2,
  Plus,
  Loader2,
  GraduationCap,
  BookOpen,
  Shield
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface GroupCount {
  count: number;
}

export default function AdminDashboard() {

  const { profile } = useAuth();
  const navigate = useNavigate();
  
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [uploadFile, setUploadFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);
const [users, setUsers] = useState<User[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [groups, setGroups] = useState<any[]>([]);
const [selectedGroup, setSelectedGroup] = useState("");

  const [stats, setStats] = useState({
    
    totalUsers: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    groups: 0,
    forms: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        credentials: 'include',
      });
  
      if (!res.ok) {
        throw new Error('Failed to fetch admin dashboard data');
      }

      // Fetch groups
const groupRes = await fetch("http://localhost:5000/api/groups", {
  credentials: "include",
});

const groupData = await groupRes.json();
setGroups(groupData || []);
  
      /*
        Expected backend response:
        {
          stats: {
            totalUsers: number,
            students: number,
            teachers: number,
            admins: number,
            groups: number,
            forms: number
          },
          users: Array<{
            id: string,
            email: string,
            full_name: string | null,
            role: string,
            created_at: string
          }>
        }
      */
  
      const data = await res.json();
  
      setStats({
        totalUsers: data.stats?.totalUsers || 0,
        students: data.stats?.students || 0,
        teachers: data.stats?.teachers || 0,
        admins: data.stats?.admins || 0,
        groups: data.stats?.groups || 0,
        forms: data.stats?.forms || 0,
      });
  
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const roleIcons = {
    student: GraduationCap,
    teacher: BookOpen,
    admin: Shield,
    unknown: Users,
  };

  const roleColors = {
    student: 'bg-blue-500/10 text-blue-500',
    teacher: 'bg-emerald-500/10 text-emerald-500',
    admin: 'bg-purple-500/10 text-purple-500',
    unknown: 'bg-muted text-muted-foreground',
  };


  const handleUploadStudents = async () => {
    if (!uploadFile) {
      toast.error("Please select an Excel file");
      return;
    }
  
    if (!selectedGroup) {
      toast.error("Please select a group");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("groupId", selectedGroup);
  
    try {
      setIsUploading(true);
  
      const res = await fetch(
        "http://localhost:5000/api/students/upload",
        {
          method: "POST",
          body: formData,
        }
      );
  
      if (!res.ok) throw new Error();
  
      toast.success("Students uploaded to selected group");
      setIsUploadOpen(false);
      setUploadFile(null);
      setSelectedGroup("");
      fetchData();
      if (selectedGroup) {
        await loadStudents(selectedGroup);
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const loadStudents = async (groupId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/groups/${groupId}/members`
      );
  
      const data = await res.json();
  
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId ? { ...g, students: data } : g
        )
      );
    } catch (err) {
      console.error("Load students error:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">
            {greeting()}, {profile?.full_name?.split(' ')[0] || 'Admin'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage users, groups, and system settings.
          </p>
        </div>
        <div className="flex gap-2">
  <Button onClick={() => setIsUploadOpen(true)}>
    Upload Students
  </Button>
</div>



      </motion.div>

      <Card>
  <CardContent className="p-6 flex justify-between">
    <div>
      <p className="text-sm text-muted-foreground">Total Students</p>
      <p className="text-3xl font-bold">
      {stats.students}
      </p>
    </div>

    <GraduationCap className="w-10 h-10 text-primary" />
  </CardContent>
</Card>


      {/* Groups & Students Section */}
      <div className="space-y-6">

{groups.map((group) => (
  <motion.div
    key={group.id}
    
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="overflow-hidden">

      {/* GROUP HEADER */}
      <div className="flex justify-between items-center p-5 bg-muted/30 border-b">
        
        <div>
          <h3 className="text-lg font-semibold">
            {group.name}
          </h3>

          <Badge variant="secondary" className="mt-1">
  {group.member_count || 0} Students
</Badge>
        </div>

        <div className="flex gap-2">
        <Button
  size="sm"
  variant="outline"
  onClick={() => navigate(`/dashboard/groups/${group.id}/students`)}
>
  View
</Button>
        </div>
      </div>

      {/* STUDENT TABLE */}
      {expandedGroup === group.id && (
  <div className="p-5">

        {/* Top Controls */}
        <div className="flex justify-between items-center mb-4">
        <Input
  placeholder="Search student..."
  className="max-w-xs"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

          <div className="flex gap-2">
          <Button
  onClick={() => navigate(`/dashboard/groups/${groupId}/add-student`)}
>
  + Add Student
</Button>
            {selectedStudents.length > 0 && (
  <Button
    size="sm"
    variant="destructive"
    onClick={async () => {
      await fetch("http://localhost:5000/api/students/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedStudents }),
      });
      toast.success("Deleted selected students");
      setSelectedStudents([]);
      fetchData();
    }}
  >
    Delete Selected
  </Button>
)}

            <Button size="sm" variant="outline">
              Export Excel
            </Button>
          </div>
          
        </div>
        

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
              <th className="p-3"></th>
              <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Reg No</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Mobile</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
            {group.students
  ?.filter((student: any) =>
    student.full_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
  .map((student: any) => (
                <tr
                  key={student.id}
                  className="border-b hover:bg-muted/30 transition"
                >
<td className="p-3">
  <input
    type="checkbox"
    checked={selectedStudents.includes(student.id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedStudents([...selectedStudents, student.id]);
      } else {
        setSelectedStudents(
          selectedStudents.filter((id) => id !== student.id)
        );
      }
    }}
  />
</td>

<td className="p-3 font-medium">
                    {student.full_name}
                  </td>
                  <td className="p-3">
                    {student.registration_no}
                  </td>
                  <td className="p-3">
                    {student.email}
                  </td>
                  <td className="p-3">
                    {student.mobile}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                    <Button
  variant="outline"
  onClick={() =>
    navigate(`/dashboard/students/${student.id}/edit`)
  }
>
  Edit
</Button>
                      <Button
  variant="destructive"
  onClick={async () => {
    if (!window.confirm("Are you sure?")) return;

    await fetch(
      `http://localhost:5000/api/students/${student.id}`,
      { method: "DELETE" }
    );

    toast.success("Student deleted");
    fetchStudents(); // reload list
  }}
>
  Delete
</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
      )}
    </Card>
  </motion.div>
))}

</div>

     

     

      {/* Upload Students Dialog */}
<Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Upload Students Excel</DialogTitle>
    </DialogHeader>

    <div className="py-4 space-y-4">

  <select
    className="w-full border rounded-md p-2"
    value={selectedGroup}
    onChange={(e) => setSelectedGroup(e.target.value)}
  >
    <option value="">Select Group</option>
    {groups.map((group) => (
      <option key={group.id} value={group.id}>
        {group.name}
      </option>
    ))}
  </select>

  <Input
    type="file"
    accept=".xlsx,.xls"
    onChange={(e) => {
      if (e.target.files) setUploadFile(e.target.files[0]);
    }}
  />

</div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
        Cancel
      </Button>

      <Button onClick={handleUploadStudents} disabled={isUploading}>
        {isUploading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        Upload
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
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
        <div className="flex flex-col items-center text-center">
          <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-2`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-muted-foreground text-xs">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
