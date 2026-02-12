import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, FileSpreadsheet, File, Download, Loader2, Calendar, Eye } from 'lucide-react';

interface Circular {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

export function StudentCircularsView() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCirculars();
  }, []);

  const fetchCirculars = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/circulars');
      if (!res.ok) throw new Error('Failed to fetch');
  
      const data = await res.json();
      setCirculars(data || []);
    } catch (error) {
      console.error('Error fetching circulars:', error);
      toast.error('Failed to load circulars');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getFileIcon = (fileType?: string | null) => {
    if (!fileType) {
      return <File className="w-5 h-5 text-muted-foreground" />;
    }
  
    const type = fileType.toLowerCase();
  
    if (type.includes('pdf'))
      return <FileText className="w-5 h-5 text-red-500" />;
  
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx'))
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  
    if (type.includes('word') || type.includes('document'))
      return <FileText className="w-5 h-5 text-blue-500" />;
  
    return <File className="w-5 h-5 text-muted-foreground" />;
  };
  

  const getFileTypeBadge = (fileType?: string | null) => {
    if (!fileType) {
      return <Badge variant="secondary">File</Badge>;
    }
  
    const type = fileType.toLowerCase();
  
    if (type.includes('pdf'))
      return <Badge variant="destructive">PDF</Badge>;
  
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx'))
      return <Badge className="bg-green-500">Excel</Badge>;
  
    if (type.includes('word') || type.includes('document'))
      return <Badge className="bg-blue-500">Word</Badge>;
  
    return <Badge variant="secondary">File</Badge>;
  };
  

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (circular: Circular) => {
    window.open(
      `http://localhost:5000/api/circulars/${circular.id}/download`,
      '_blank'
    );
  };
  
  const handleView = (circular: Circular) => {
    window.open(
      `http://localhost:5000/api/circulars/${circular.id}/view`,
      '_blank'
    );
  };
  

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-2">Circulars</h1>
        <p className="text-muted-foreground">
          View and download important documents shared by your institution.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              All Circulars
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : circulars.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No circulars available</h3>
                <p className="text-muted-foreground">
                  No documents have been shared yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {circulars.map((circular) => (
                  <div
                    key={circular.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        {getFileIcon(circular.file_type)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{circular.title}</h4>
                        {circular.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{circular.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(circular.created_at).toLocaleDateString()}
                          <span>•</span>
                          {formatFileSize(circular.file_size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getFileTypeBadge(circular.file_type)}
                      <Button size="sm" variant="ghost" onClick={() => handleView(circular)} title="View">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(circular)} title="Download">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
