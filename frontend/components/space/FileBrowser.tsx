"use client";

import { useState, useEffect } from "react";
import { File, Folder, Code, Type, Image, Database, Settings, FileText, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  children?: FileInfo[];
}

interface FileBrowserProps {
  repoPath: string;
  cloneUrl: string;
}

const fileIcons: Record<string, React.ElementType> = {
  py: Code,
  js: Code,
  ts: Code,
  jsx: Code,
  tsx: Code,
  json: Settings,
  yaml: Settings,
  yml: Settings,
  txt: FileText,
  md: FileText,
  csv: Database,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  svg: Image,
  pdf: FileText,
  html: FileText,
  css: FileText,
  req: FileText,
  Dockerfile: Type,
};

const FileIcon: React.FC<{ type: 'file' | 'directory'; extension?: string }> = ({ type, extension }) => {
  if (type === 'directory') {
    return <Folder className="w-4 h-4 text-yellow-500" />;
  }

  const ext = extension?.toLowerCase() || '';
  const Icon = fileIcons[ext] || File;
  return <Icon className="w-4 h-4 text-blue-400" />;
};

export function FileBrowser({ repoPath, cloneUrl }: FileBrowserProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/spaces/files?repoPath=${encodeURIComponent(repoPath)}`);

        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
        } else {
          setFiles([
            { name: 'README.md', path: `${repoPath}/README.md`, type: 'file', extension: 'md' },
            { name: 'app.py', path: `${repoPath}/app.py`, type: 'file', extension: 'py' },
            { name: 'requirements.txt', path: `${repoPath}/requirements.txt`, type: 'file', extension: 'txt' },
            { name: '.env.example', path: `${repoPath}/.env.example`, type: 'file', extension: '' },
          ]);
        }
      } catch (err) {
        setError('Failed to load files');
        console.error('Failed to fetch files:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [repoPath]);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const getFileType = (name: string): 'file' | 'directory' => {
    if (name.includes('.')) return 'file';
    return 'directory';
  };

  const renderFileTree = (items: FileInfo[], depth = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expanded.has(item.path);
      const fileType = item.type || getFileType(item.name);
      const ext = item.name.split('.').pop();

      return (
        <div key={item.path} className={`ml-${depth * 4}`}>
          <div
            className="flex items-center gap-2 py-1 hover:bg-coreed-panel-raised rounded px-2 cursor-pointer"
            onClick={() => hasChildren && toggleExpand(item.path)}
          >
            <div className="flex items-center gap-2 flex-1">
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-4 h-4 text-coreed-sage" /> : <ChevronRight className="w-4 h-4 text-coreed-sage" />
              ) : (
                <div className="w-4" />
              )}
              <FileIcon type={fileType} extension={ext} />
              <span className="font-mono text-sm text-coreed-bone">{item.name}</span>
            </div>

            {fileType === 'file' && (
              <a
                href={`file://${item.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-coreed-sage/50 hover:text-coreed-bone"
                title="Open file"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderFileTree(item.children || [], depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="rounded border border-coreed-line bg-coreed-panel p-5">
        <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
          <File className="w-4 h-4" />
          Files
        </h3>
        <p className="font-mono text-sm text-coreed-sage/70">Loading files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-coreed-clay bg-coreed-panel-raised p-5">
        <h3 className="font-mono text-xs text-coreed-clay mb-3 flex items-center gap-2">
          <File className="w-4 h-4" />
          Files
        </h3>
        <p className="font-mono text-sm text-coreed-clay">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-coreed-line bg-coreed-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-xs text-coreed-sage flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Repository Files
        </h3>
        <a
          href={cloneUrl}
          className="font-mono text-[10px] text-coreed-moss-bright hover:text-coreed-bone flex items-center gap-1"
          title="Clone repository"
        >
          <ExternalLink className="w-3 h-3" />
          clone
        </a>
      </div>

      {files.length > 0 ? (
        <div className="space-y-1">
          {renderFileTree(files)}
        </div>
      ) : (
        <p className="font-mono text-sm text-coreed-sage/50 text-center py-4">
          No files found
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-coreed-line">
        <p className="font-mono text-[10px] text-coreed-sage/50">
          Path: {repoPath}
        </p>
      </div>
    </div>
  );
}
