import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  Trash2,
  Download,
  Loader2,
  Plus,
  X,
  Calendar,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Circular {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

export function CircularsSection() {
  const { user } = useAuth();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/circulars');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCirculars(data);
    } catch (err) {
      toast.error('Failed to load circulars');
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= ICON + BADGE ================= */
  const getFileIcon = (type?: string, fileName?: string) => {
    const lowerType = type?.toLowerCase() || '';
    const lowerName = fileName?.toLowerCase() || '';
  
    // PDF
    if (
      lowerType.includes('pdf') ||
      lowerName.endsWith('.pdf')
    ) {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
  
    // Excel
    if (
      lowerType.includes('spreadsheet') ||
      lowerType.includes('excel') ||
      lowerType.includes('sheet') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls')
    ) {
      return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    }
  
    // Word
    if (
      lowerType.includes('word') ||
      lowerName.endsWith('.doc') ||
      lowerName.endsWith('.docx')
    ) {
      return <FileText className="w-6 h-6 text-blue-500" />;
    }
  
    // Image
    if (
      lowerType.includes('image') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png')
    ) {
      return <File className="w-6 h-6 text-purple-500" />;
    }
  
    // Default
    return <File className="w-6 h-6 text-gray-500" />;
  };
  

  const getFileTypeBadge = (type?: string, fileName?: string) => {
    const lowerName = fileName?.toLowerCase() || '';
    const lowerType = type?.toLowerCase() || '';
  
    // ---- CHECK EXTENSION FIRST ----
  
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      return <Badge className="bg-green-500 text-white">Excel</Badge>;
    }
  
    if (lowerName.endsWith('.pdf')) {
      return <Badge variant="destructive">PDF</Badge>;
    }
  
    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      return <Badge className="bg-blue-500 text-white">Word</Badge>;
    }
  
    if (
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png')
    ) {
      return <Badge className="bg-purple-500 text-white">Image</Badge>;
    }
  
    // ---- FALLBACK USING MIME TYPE ----
  
    if (lowerType.includes('spreadsheet') || lowerType.includes('excel')) {
      return <Badge className="bg-green-500 text-white">Excel</Badge>;
    }
  
    if (lowerType.includes('pdf')) {
      return <Badge variant="destructive">PDF</Badge>;
    }
  
    if (lowerType.includes('word')) {
      return <Badge className="bg-blue-500 text-white">Word</Badge>;
    }
  
    return <Badge variant="secondary">File</Badge>;
  };
  
  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ================= HANDLERS ================= */

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim() || !user) {
      toast.error('Missing required fields');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', selectedFile);
      formData.append('uploadedBy', user.id);

      const res = await fetch('http://localhost:5000/api/circulars', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error();

      toast.success('Circular uploaded');
      setShowUploadDialog(false);
      resetForm();
      fetchCirculars();
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this circular?')) return;
    await fetch(`http://localhost:5000/api/circulars/${id}`, { method: 'DELETE' });
    fetchCirculars();
  };

  const handleDownload = (id: string) => {
    window.open(`http://localhost:5000/api/circulars/${id}/download`, '_blank');
  };

  const handleView = (id: string, fileName: string) => {
    const fileUrl = `http://localhost:5000/api/circulars/${id}/view`;
  
    const lower = fileName.toLowerCase();
  
    // Excel files → use Microsoft viewer
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      window.open(
        `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`,
        "_blank"
      );
      return;
    }
  
    // Other files open normally
    window.open(fileUrl, "_blank");
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ================= UI ================= */

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card>
        <CardHeader className="flex justify-between flex-row">
          <CardTitle className="flex gap-2">
            <FileText className="w-5 h-5" />
            Circulars
          </CardTitle>
          <Button size="sm" onClick={() => setShowUploadDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Circular
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" />
            </div>
          ) : circulars.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No circulars yet</p>
          ) : (
            <div className="space-y-4">
              {circulars.map(c => (
                <div
                  key={c.id}
                  className="flex justify-between items-center p-5 rounded-xl border bg-white hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100">
                      {getFileIcon(c.file_type, c.file_name)}
                    </div>

                    <div>
                      <p className="font-semibold text-base">
                        {c.title.replace(/\.[^/.]+$/, '')}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(c.created_at).toLocaleDateString()}
                        • {formatSize(c.file_size)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getFileTypeBadge(c.file_type, c.file_name)}

                    <Button size="icon" variant="ghost" onClick={() => handleView(c.id, c.file_name)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button size="icon" variant="ghost" onClick={() => handleDownload(c.id)}>
                      <Download className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Circular</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />

            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} />

            <Label>File *</Label>

            <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} />

            {!selectedFile ? (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Select PDF, Word, Excel, or Image file
              </Button>
            ) : (
              <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFile.type, selectedFile.name)}
                  <span className="text-sm font-medium">
                    {selectedFile.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-muted-foreground hover:text-destructive transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin" /> : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
