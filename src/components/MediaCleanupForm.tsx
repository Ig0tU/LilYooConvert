import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface MediaFile {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isOrphaned: boolean;
}

interface JsonDumpEntry {
  name: string;
  type: string;
  size?: number;
  lastModified?: string;
  children?: JsonDumpEntry[];
}

const MediaCleanupForm: React.FC = () => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [jsonDump, setJsonDump] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredMediaFiles, setFilteredMediaFiles] = useState<MediaFile[]>([]);
  const [filterScope, setFilterScope] = useState<'all' | 'media' | 'child' | 'img' | 'orphaned'>('all');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const extractFileNamesFromJson = useCallback((data: JsonDumpEntry[]): string[] => {
    const fileNames: string[] = [];
    
    const traverse = (items: JsonDumpEntry[]) => {
      items.forEach(item => {
        if (item.type === 'file' && item.name) {
          fileNames.push(item.name);
        }
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    
    traverse(data);
    return fileNames;
  }, []);

  // Filter media files based on filterScope
  React.useEffect(() => {
    let filtered = mediaFiles;
    switch (filterScope) {
      case 'media':
        filtered = mediaFiles.filter(f => f.path.toLowerCase().includes('media'));
        break;
      case 'child':
        filtered = mediaFiles.filter(f => f.path.toLowerCase().includes('child'));
        break;
      case 'img':
        filtered = mediaFiles.filter(f => /\.(jpg|jpeg|png|gif|svg)$/i.test(f.name));
        break;
      case 'orphaned':
        filtered = mediaFiles.filter(f => f.isOrphaned);
        break;
      case 'all':
      default:
        filtered = mediaFiles;
    }
    setFilteredMediaFiles(filtered);
  }, [filterScope, mediaFiles]);

  const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setJsonDump(content);
          toast({
            title: "JSON loaded successfully",
            description: "The JSON dump has been loaded and is ready for processing.",
          });
        } catch (error) {
          toast({
            title: "Error loading JSON",
            description: "Please ensure the file contains valid JSON.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFilterChange = (scope: 'all' | 'media' | 'child' | 'img' | 'orphaned') => {
    setFilterScope(scope);
  };

  const handleScanMedia = async () => {
    if (!jsonDump.trim()) {
      toast({
        title: "JSON dump required",
        description: "Please provide a JSON dump to compare against.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const jsonData = JSON.parse(jsonDump) as JsonDumpEntry[];
      const activeFiles = extractFileNamesFromJson(jsonData);
      
      // In a real implementation, this would scan the actual file system
      // For now, we'll use a placeholder that would be replaced with actual file scanning
      const response = await fetch('/api/scan-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl,
          activeFiles,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to scan media files');
      }

      const files = await response.json();
      setMediaFiles(files);
      
      const orphanedCount = files.filter((f: MediaFile) => f.isOrphaned).length;
      toast({
        title: "Scan complete",
        description: `Found ${orphanedCount} orphaned media files.`,
      });
    } catch (error) {
      toast({
        title: "Error scanning media",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteOrphaned = async (filePath: string) => {
    try {
      const response = await fetch('/api/delete-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      setMediaFiles(prev => prev.filter(f => f.path !== filePath));
      toast({
        title: "File deleted",
        description: `${filePath} has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting file",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const orphanedFiles = mediaFiles.filter(file => file.isOrphaned);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Cleanup Tool</CardTitle>
          <CardDescription>
            Scan and clean up orphaned media files by comparing against your JSON dump
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Source URL</label>
            <Input
              type="url"
              placeholder="https://www.lfdcs.org"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">JSON Dump</label>
            <div className="space-y-2">
              <Textarea
                placeholder="Paste your JSON dump here..."
                value={jsonDump}
                onChange={(e) => setJsonDump(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <Input
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex space-x-4 mb-4">
            <Button variant={filterScope === 'all' ? 'default' : 'outline'} onClick={() => handleFilterChange('all')}>
              All Files
            </Button>
            <Button variant={filterScope === 'media' ? 'default' : 'outline'} onClick={() => handleFilterChange('media')}>
              Media
            </Button>
            <Button variant={filterScope === 'child' ? 'default' : 'outline'} onClick={() => handleFilterChange('child')}>
              Child
            </Button>
            <Button variant={filterScope === 'img' ? 'default' : 'outline'} onClick={() => handleFilterChange('img')}>
              Images
            </Button>
            <Button variant={filterScope === 'orphaned' ? 'default' : 'outline'} onClick={() => handleFilterChange('orphaned')}>
              Orphaned
            </Button>
          </div>

          <Button 
            onClick={handleScanMedia} 
            disabled={processing || !jsonDump.trim()}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Media...
              </>
            ) : (
              'Scan for Orphaned Files'
            )}
          </Button>
        </CardContent>
      </Card>

      {filteredMediaFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Media Files ({filteredMediaFiles.length})</CardTitle>
            <CardDescription>
              Displaying files filtered by: <strong>{filterScope}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMediaFiles.map((file) => (
                <div key={file.path} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{file.path}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  {file.isOrphaned && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOrphaned(file.path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {mediaFiles.length > 0 && orphanedFiles.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            No orphaned media files found. All files are properly referenced in your JSON dump.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MediaCleanupForm;
