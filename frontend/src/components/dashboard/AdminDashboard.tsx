import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
const [uploadFile, setUploadFile] = useState<File | null>(null);
const [isUploading, setIsUploading] = useState(false);
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
  
    const formData = new FormData();
    formData.append("file", uploadFile);
  
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
  
      toast.success("Students uploaded successfully");
      setIsUploadOpen(false);
      setUploadFile(null);
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
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
    <FileSpreadsheet className="w-4 h-4 mr-2" />
    Upload Students
  </Button>

  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Add User
  </Button>
</div>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          title="Students"
          value={stats.students}
          icon={GraduationCap}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          title="Teachers"
          value={stats.teachers}
          icon={BookOpen}
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          title="Admins"
          value={stats.admins}
          icon={Shield}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
        />
        <StatCard
          title="Groups"
          value={stats.groups}
          icon={Building2}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          title="Forms"
          value={stats.forms}
          icon={FileSpreadsheet}
          color="text-rose-500"
          bgColor="bg-rose-500/10"
        />
      </motion.div>

      {/* Recent users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No users yet</h3>
                <p className="text-muted-foreground">
                  Users will appear here as they sign up.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => {
                  const Icon = roleIcons[user.role as keyof typeof roleIcons] || Users;
                  const colorClass = roleColors[user.role as keyof typeof roleColors] || roleColors.unknown;
                  
                  return (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{user.full_name || 'Unnamed User'}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Upload Students Dialog */}
<Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Upload Students Excel</DialogTitle>
    </DialogHeader>

    <div className="py-4">
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
