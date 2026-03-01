import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import  { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import  AdminDashboard  from "@/components/dashboard/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import GroupStudents from "@/components/dashboard/GroupStudents";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FormSubmission from "./pages/FormSubmission";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
  v7_startTransition: true,
  v7_relativeSplatPath: true
}}>

        <AuthProvider>
    
        <Routes>
  <Route path="/" element={<Index />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/dashboard/*" element={<Dashboard />} />

  <Route path="/student" element={<StudentDashboard />} />
  <Route path="/teacher" element={<TeacherDashboard />} />
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/form/:formId" element={<FormSubmission />} />
  <Route path="/student/form/:formId" element={<FormSubmission />} />
  <Route path="/dashboard/students-master" element={<AdminStudents />} />
  <Route
  path="/dashboard/groups/:id/students"
  element={<GroupStudents />}
/>


  <Route path="*" element={<NotFound />} />
</Routes>


          
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
