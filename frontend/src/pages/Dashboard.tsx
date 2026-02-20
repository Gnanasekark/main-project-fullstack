import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboard/TeacherDashboard';
import  AdminDashboard  from '@/components/dashboard/AdminDashboard';
import { GroupManagement } from '@/components/dashboard/teacher/GroupManagement';
import { NotificationsPage } from '@/components/dashboard/teacher/NotificationsPage';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StudentCircularsView } from '@/components/dashboard/StudentCircularsView';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth?mode=login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    const path = location.pathname;

    // Handle specific sub-routes
    if (path === '/dashboard/groups') {
      // Only teachers and admins can access groups
      if (role === 'teacher' || role === 'admin') {
        return <GroupManagement />;
      }
      // Redirect students to main dashboard
      navigate('/dashboard');
      return null;
    }

    if (path === '/dashboard/notifications') {
      return <NotificationsPage />;
    }

    if (path === '/dashboard/forms') {
      // Dedicated forms list page
      switch (role) {
        case 'student':
          return <StudentDashboard showFormsOnly />;
        case 'teacher':
        case 'admin':
          return <TeacherDashboard showFormsOnly />;
        default:
          return <StudentDashboard showFormsOnly />;
      }
    }

    if (path === '/dashboard/circulars') {
      // Dedicated circulars page - accessible by all roles
      if (role === 'student') {
        return <StudentCircularsView />;
      }
      return <TeacherDashboard showCircularsOnly />;
    }

    // Main dashboard view
    switch (role) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}
