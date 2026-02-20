import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import {
  Upload,
  FileSpreadsheet,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  Pencil,
  Trash2
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  folder_id?: string | null;
  sender_name?: string;
  sender_email?: string;
  config: {
    fields: FormField[];
  };
}


interface Folder {
  id: string;
  name: string;
}

interface FormStats {
  assigned: number;
  submitted: number;
  pending: number;
}

interface FormsListPanelProps {
  forms: Form[];
  selectedFormId: string | null;
  onSelectForm: (formId: string) => void;
  formStats: Record<string, FormStats>;
  isLoading: boolean;
  onRefresh: () => void;

  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;

  onUploadClick: () => void;   // important
}

export function FormsListPanel({
  forms,
  selectedFormId,
  onSelectForm,
  formStats,
  isLoading,
  onRefresh,
  folders,
  selectedFolderId,
  onSelectFolder,
  onUploadClick
}: FormsListPanelProps) {
  const { user } = useAuth();


  const [searchQuery, setSearchQuery] = useState("");

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);

  // FILTER FORMS
  const filteredForms = forms
    .filter(form =>
      form.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(form =>
      selectedFolderId
        ? form.folder_id === selectedFolderId
        : true
    );

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name required");
      return;
    }

    try {
      setIsCreatingFolder(true);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newFolderName }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create folder");
        return;
      }

      toast.success("Folder created");
      setNewFolderName("");
      setIsFolderModalOpen(false);
      onRefresh();

    } catch {
      toast.error("Folder creation failed");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm("Delete this folder?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/folders/${folderId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        toast.error("Delete failed");
        return;
      }

      toast.success("Folder deleted");
      onRefresh();

    } catch {
      toast.error("Delete failed");
    }
  };

  const handleRenameFolder = async () => {
    if (!renameFolderId || !renameValue.trim()) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5000/api/folders/${renameFolderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: renameValue }),
        }
      );

      if (!res.ok) {
        toast.error("Rename failed");
        return;
      }

      toast.success("Folder renamed");
      setIsRenameOpen(false);
      onRefresh();

    } catch {
      toast.error("Rename failed");
    }
  };

  const getFormStatus = (stats: FormStats | undefined) => {
    if (!stats || stats.assigned === 0)
      return { label: "Not Assigned", color: "bg-muted text-muted-foreground", icon: Clock };

    if (stats.pending === 0 && stats.submitted > 0)
      return { label: "Completed", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 };

    if (stats.pending > 0)
      return { label: `${stats.pending} Pending`, color: "bg-orange-500/10 text-orange-600", icon: AlertCircle };

    return { label: "Not Assigned", color: "bg-muted text-muted-foreground", icon: Clock };
  };

  return (
    <div className="flex flex-col h-full border-r border-border">

      {/* HEADER */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Forms</h2>

          <Button
            size="sm"
            onClick={onUploadClick}
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* FOLDERS */}
      <div className="px-3 py-2 border-b space-y-1">

        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full text-left p-2 rounded-md text-sm ${
            selectedFolderId === null
              ? "bg-muted font-medium"
              : "hover:bg-muted"
          }`}
        >
          📁 All Forms
        </button>

        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="w-full text-left p-2 rounded-md text-sm text-primary hover:bg-muted"
        >
          ➕ New Folder
        </button>

        <ScrollArea className="h-28 overflow-y-auto pr-2">
          <div className="space-y-1 mt-1">
            {folders.map(folder => (
              <div
                key={folder.id}
                className={`group flex items-center justify-between p-2 rounded-md text-sm ${
                  selectedFolderId === folder.id
                    ? "bg-muted font-medium"
                    : "hover:bg-muted"
                }`}
              >
                <button
                  onClick={() => onSelectFolder(folder.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span>{folder.name}</span>
                </button>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <Pencil
                    className="w-4 h-4 text-black cursor-pointer"
                    onClick={() => {
                      setRenameFolderId(folder.id);
                      setRenameValue(folder.name);
                      setIsRenameOpen(true);
                    }}
                  />
                  <Trash2
                    className="w-4 h-4 text-red-500 cursor-pointer"
                    onClick={() => handleDeleteFolder(folder.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* FORMS LIST */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileSpreadsheet className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No forms found.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredForms.map((form, index) => {
                const stats = formStats[form.id];
                const status = getFormStatus(stats);
                const isSelected = selectedFormId === form.id;

                return (
                  <motion.button
                    key={form.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onSelectForm(form.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                   <div className="flex items-start gap-3">

{/* ICON */}
<div
  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
    isSelected ? "bg-primary/20" : "bg-muted"
  }`}
>
  <FileSpreadsheet
    className={`w-4 h-4 ${
      isSelected ? "text-primary" : "text-muted-foreground"
    }`}
  />
</div>

{/* CONTENT */}
<div className="flex-1 min-w-0">

  {/* TITLE */}
  <p
    className={`font-medium truncate text-sm ${
      isSelected ? "text-primary" : ""
    }`}
  >
    {form.title}
  </p>

  {/* STATUS + SHARED INFO */}
  <div className="mt-1 flex flex-col items-start gap-1">

    <Badge
      variant="outline"
      className={`text-xs ${status.color}`}
    >
      <status.icon className="w-3 h-3 mr-1" />
      {status.label}
    </Badge>

    {/* SHOW ONLY IF FORM IS SHARED (NOT CREATED BY CURRENT USER) */}
    {form.sender_email &&
  user?.email &&
  form.sender_email !== user.email && (
    <span
      className="text-[11px] px-2 py-0.5 rounded-md
                 bg-blue-50 text-blue-700
                 border border-blue-200"
    >
      Sent by {form.sender_name} ({form.sender_email})
    </span>
)}

  </div>

</div>
</div>

                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* CREATE FOLDER DIALOG */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsFolderModalOpen(false)}>
              Cancel
            </Button>

            <Button onClick={createFolder} disabled={isCreatingFolder}>
              {isCreatingFolder ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RENAME DIALOG */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>

          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
} 