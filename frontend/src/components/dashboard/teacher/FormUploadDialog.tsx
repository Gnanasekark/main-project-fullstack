import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Upload, Loader2, X, FolderOpen, Eye, UserPlus } from "lucide-react";

interface Folder {
  id: string;
  name: string;
}

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string;
}

interface FormUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  onSuccess: () => void;
}

export function FormUploadDialog({
  open,
  onOpenChange,
  folders,
  onSuccess,
}: FormUploadDialogProps) {
  const { user } = useAuth();

  const [staffList, setStaffList] = useState<any[]>([]);
const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const [viewPermission, setViewPermission] =
    useState<"staff_only" | "students_only" | "both">("staff_only");

  const [assignPermission, setAssignPermission] =
    useState<"creator_only" | "specific_staff">("creator_only");

  const [selectedAssigners, setSelectedAssigners] = useState<Set<string>>(
    new Set()
  );
  const [selectedViewers, setSelectedViewers] = useState<Set<string>>(
    new Set()
  );

  const [selectedFolderId, setSelectedFolderId] = useState<string>("none");
  useEffect(() => {
    if (open) {
      fetchStaff();
    }
  }, [open]);
  
  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("token");
  
      const res = await fetch("http://localhost:5000/api/teacher/staff", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) return;
  
      const data = await res.json();
      setStaffMembers(data);

    } catch (err) {
      console.error("Failed to fetch staff");
    }
  };
  

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];

    if (!f) return;

    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setFile(f);
  };

  
  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as string[][];

      if (jsonData.length < 1) {
        toast.error("Excel file must have at least a header row");
        setIsUploading(false);
        return;
      }

      const headers = jsonData[0];

      const fields = headers.map((header, index) => ({
        id: `field_${index}`,
        label: String(header),
        type: "text",
        required: false,
      }));

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: file.name.replace(/\.(xlsx|xls)$/, ""),
          description: `Form generated from ${file.name}`,
          original_filename: file.name,
          created_by: user.id,
          config: { fields },
          view_permission: viewPermission,
          assign_permission: assignPermission,
          folder_id: selectedFolderId !== "none" ? selectedFolderId : null,
          assigners: Array.from(selectedAssigners),
          viewers: Array.from(selectedViewers),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Upload failed");
        setIsUploading(false);
        return;
      }

      toast.success("Form created successfully!");

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to process Excel file");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setViewPermission("staff_only");
    setAssignPermission("creator_only");
    setSelectedAssigners(new Set());
    setSelectedViewers(new Set());
    setSelectedFolderId("none");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleAssigner = (id: string) => {
    setSelectedAssigners((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleViewer = (id: string) => {
    setSelectedViewers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Form</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls"
            className="hidden"
          />

          {/* File Selection */}
          <div className="space-y-2">
            <Label>Excel File *</Label>

            {file ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <Upload className="w-4 h-4 text-primary" />
                <span className="text-sm truncate flex-1">
                  {file.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => resetForm()}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Excel File
              </Button>
            )}
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Select Folder
            </Label>
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Permission */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Who can View?
            </Label>
            <Select
              value={viewPermission}
              onValueChange={(v: any) => setViewPermission(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff_only">Staff Only</SelectItem>
                <SelectItem value="students_only">Students Only</SelectItem>
                <SelectItem value="both">Both Staff & Students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assign Permission */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Who can Assign?
              
            </Label>
            {assignPermission === "specific_staff" && (
  <div className="mt-3">
    <label className="text-sm font-medium">Select Staff</label>

    <div className="mt-2 space-y-2">
      {staffMembers
        .filter((staff) => staff.id !== user?.id)
        .map((staff) => {
          const isSelected = selectedAssigners.has(staff.id);

          return (
            <div
              key={staff.id}
              onClick={() => toggleAssigner(staff.id)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer border transition
                ${
                  isSelected
                    ? "bg-green-100 border-green-500"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
            >
              <span className="text-sm font-medium">
                {staff.full_name || "No Name"} ({staff.email})
              </span>

              {isSelected && (
                <div className="text-green-600 font-bold text-lg">
                  ✓
                </div>
              )}
            </div>
          );
        })}
    </div>
  </div>
)}

            <Select
              value={assignPermission}
              onValueChange={(v: any) => setAssignPermission(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator_only">
                  Only Me (Creator)
                </SelectItem>
                <SelectItem value="specific_staff">
                  Specific Staff
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload & Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
