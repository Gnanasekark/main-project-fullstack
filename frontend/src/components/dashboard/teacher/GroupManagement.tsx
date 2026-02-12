import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string | null;
  degree: string | null;
  branch: string | null;
  year: string | null;
  section: string | null;
  is_auto_generated: boolean;
  created_at: string;
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

interface GroupMember {
  user_id: string;
  profiles: Student;
}

export function GroupManagement() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Map<string, Student[]>>(new Map());

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    degree: '',
    branch: '',
    year: '',
    section: '',
  });

  // Member management state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch groups with member count
      const groupsRes = await fetch("http://localhost:5000/api/groups");
      if (!groupsRes.ok) throw new Error();
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
  
      // Fetch students
      const studentsRes = await fetch("http://localhost:5000/api/students");
      if (!studentsRes.ok) throw new Error();
      const studentsData = await studentsRes.json();
      setStudents(studentsData);
  
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/groups/${groupId}/members`
      );
  
      if (!res.ok) throw new Error('Failed to fetch members');
  
      const data = await res.json();
  
      // keep SAME mapping structure
      const members = (data || []) as Student[];
  
      setGroupMembers(prev => new Map(prev).set(groupId, members));
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };
  

  const handleToggleExpand = async (groupId: string) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      if (!groupMembers.has(groupId)) {
        await fetchGroupMembers(groupId);
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const res = await fetch("http://localhost:5000/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          degree: formData.degree,
          branch: formData.branch,
          year: formData.year,
          section: formData.section,
        }),
      });
  
      if (!res.ok) throw new Error();
  
      toast.success("Group created successfully");
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  
  const handleUpdateGroup = async () => {
    if (!selectedGroup || !formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }
  
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/groups/${selectedGroup.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
  
      if (!res.ok) throw new Error();
  
      toast.success("Group updated successfully");
      setIsEditOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) return;
  
    try {
      await fetch(`http://localhost:5000/api/groups/${group.id}`, {
        method: "DELETE",
      });
  
      toast.success("Group deleted");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete group");
    }
  };
  

  const handleOpenManageMembers = async (group: Group) => {
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);

    // Set currently selected members
    const currentMembers = groupMembers.get(group.id) || [];
    setSelectedStudents(new Set(currentMembers.map(m => m.id)));
    setIsManageMembersOpen(true);
  };

  const handleSaveMembers = async () => {
    if (!selectedGroup) return;
  
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/groups/${selectedGroup.id}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            members: Array.from(selectedStudents),
          }),
        }
      );
  
      if (!res.ok) throw new Error();
  
      toast.success("Members updated successfully");
      setIsManageMembersOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update members");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      degree: group.degree || '',
      branch: group.branch || '',
      year: group.year || '',
      section: group.section || '',
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      degree: '',
      branch: '',
      year: '',
      section: '',
    });
    setSelectedGroup(null);
  };

  const filteredGroups = groups.filter(
    g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.degree?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.branch?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudentsForMembers = students.filter(
    s =>
      s.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      s.reg_no?.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Group Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage student groups for form assignments.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </motion.div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Groups ({filteredGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No groups found</h3>
              <p className="text-muted-foreground">Create a group to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map(group => (
                <div
                  key={group.id}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{group.name}</h4>
                          {group.is_auto_generated && (
                            <Badge variant="secondary" className="text-xs">
                              Auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {group.member_count} members
                          {group.degree && ` • ${group.degree}`}
                          {group.branch && ` - ${group.branch}`}
                          {group.year && ` - ${group.year} Year`}
                          {group.section && ` - Sec ${group.section}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleExpand(group.id)}
                      >
                        {expandedGroup === group.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenManageMembers(group)}
                        title="Manage members"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(group)}
                        title="Edit group"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteGroup(group)}
                        className="text-destructive hover:text-destructive"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded members view */}
                  {expandedGroup === group.id && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      {groupMembers.get(group.id)?.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Reg No</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupMembers.get(group.id)?.map(member => (
                              <TableRow key={member.id}>
                                <TableCell className="font-medium">
                                  {member.full_name || 'Unknown'}
                                </TableCell>
                                <TableCell>{member.reg_no || '-'}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {[member.degree, member.branch, member.year, member.section]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No members in this group yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Group Name *</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., B.Tech CSE 3rd Year Section A"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Degree</label>
                <Input
                  value={formData.degree}
                  onChange={e => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g., B.Tech"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Branch</label>
                <Input
                  value={formData.branch}
                  onChange={e => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g., CSE"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Year</label>
                <Input
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  placeholder="e.g., 3"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Section</label>
                <Input
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                  placeholder="e.g., A"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Group Name *</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Degree</label>
                <Input
                  value={formData.degree}
                  onChange={e => setFormData({ ...formData, degree: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Branch</label>
                <Input
                  value={formData.branch}
                  onChange={e => setFormData({ ...formData, branch: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Year</label>
                <Input
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Section</label>
                <Input
                  value={formData.section}
                  onChange={e => setFormData({ ...formData, section: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Dialog */}
      <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Members - {selectedGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Reg No</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentsForMembers.map(student => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer"
                      onClick={() => {
                        const newSet = new Set(selectedStudents);
                        if (newSet.has(student.id)) {
                          newSet.delete(student.id);
                        } else {
                          newSet.add(student.id);
                        }
                        setSelectedStudents(newSet);
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={checked => {
                            const newSet = new Set(selectedStudents);
                            if (checked) {
                              newSet.add(student.id);
                            } else {
                              newSet.delete(student.id);
                            }
                            setSelectedStudents(newSet);
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{student.reg_no || '-'}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedStudents.size} student(s) selected
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageMembersOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMembers} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
