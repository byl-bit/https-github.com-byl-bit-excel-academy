"use client";

import { useState, useEffect } from "react";
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Loader2, 
  Plus, 
  ExternalLink,
  Eye,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/ToastContext";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface GalleryItem {
  id: string;
  url: string;
  title?: string;
  created_at?: string;
  file_name?: string;
  type?: string;
}

export function GalleryManager() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { success, error: notifyError } = useToast();
  const [dragActive, setDragActive] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media/list?type=image&prefix=gallery/");
      const data = await res.json();
      if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      notifyError("Failed to load gallery images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      notifyError("Only image files are allowed");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "gallery");

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: {
          "x-actor-role": "admin",
          "x-actor-id": user?.id || "",
        },
        body: formData,
      });

      if (res.ok) {
        success("Image uploaded to gallery");
        fetchImages();
      } else {
        const err = await res.json();
        notifyError(err.error || "Upload failed");
      }
    } catch (err) {
      notifyError("Connection error during upload");
    } finally {
      setUploading(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; fileName?: string }>({
    open: false,
    id: "",
  });

  const handleDelete = async (id: string, fileName?: string) => {
    setDeleteConfirm({ open: true, id, fileName });
  };

  const confirmDeleteAction = async () => {
    const { id, fileName } = deleteConfirm;
    setDeleteConfirm({ ...deleteConfirm, open: false });
    try {
      const res = await fetch(`/api/media/upload?id=${id}${fileName ? `&fileName=${fileName}` : ''}`, {
        method: "DELETE",
        headers: {
          "x-actor-role": "admin",
          "x-actor-id": user?.id || "",
        }
      });

      if (res.ok) {
        success("Image deleted");
        setImages(images.filter(img => img.id !== id));
      } else {
        notifyError("Failed to delete image");
      }
    } catch (err) {
      notifyError("Error deleting image");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Upload Header */}
      <Card className="border-none shadow-2xl shadow-cyan-500/5 bg-white/40 backdrop-blur-md overflow-hidden ring-1 ring-slate-200/50">
        <CardContent className="p-10 text-center">
          <div 
            className={cn(
              "group relative border-2 border-dashed rounded-3xl p-12 transition-all duration-500 cursor-pointer flex flex-col items-center gap-6",
              dragActive ? "border-cyan-500 bg-cyan-50/50" : "border-slate-200 hover:border-cyan-400 hover:bg-slate-50/50"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('gallery-upload')?.click()}
          >
            <input 
              id="gallery-upload"
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            
            <div className="h-20 w-20 rounded-2xl bg-cyan-50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner ring-4 ring-cyan-50/50">
              <Upload className="h-10 w-10 text-cyan-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                {uploading ? "Broadcasting Image..." : "Upload New Visual"}
              </h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                Drag and drop high-resolution assets or click to browse
              </p>
            </div>

            {uploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center rounded-3xl z-10">
                <Loader2 className="h-12 w-12 text-cyan-600 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner">
              <ImageIcon className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                Active Gallery <span className="text-cyan-500 ml-2">[{images.length}]</span>
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Real-time asset management • Public-facing content
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchImages}
            className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 hover:text-cyan-600 transition-all border border-slate-100"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {loading && images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Synchronizing Assets...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="card-premium p-24 text-center border-none ring-1 ring-slate-100 bg-white/40">
            <div className="h-24 w-24 rounded-4xl bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ImageIcon className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest italic">
              Digital Canvas Empty
            </h3>
            <p className="text-slate-400 text-sm mt-2">Start by uploading the first masterpiece.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {images.map((img) => (
              <Card 
                key={img.id} 
                className="group relative h-72 rounded-3xl overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-slate-50 ring-1 ring-slate-100/50"
              >
                <NextImage 
                  src={img.url} 
                  alt="Gallery" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay UI */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-sm uppercase tracking-tight truncate">
                        {img.file_name || "School Asset"}
                      </p>
                      <p className="text-cyan-400 text-[9px] font-black uppercase tracking-widest mt-1">
                        {new Date(img.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <a 
                        href={img.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/40 transition-all active:scale-90"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(img.id, img.file_name)}
                        className="h-9 w-9 rounded-xl shadow-lg active:scale-90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}
        onConfirm={confirmDeleteAction}
        title="Delete School Asset"
        description="Are you sure you want to delete this image? This will remove it from the home page and public gallery. This action cannot be reversed."
        confirmText="Remove Asset"
        variant="destructive"
      />
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="24 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1-9-9 9.75-9.75 0 0..5-2-2m-.5 8.5 4 4" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 0-3-2.5 2 2 0 0 1 2-2m-.5-8.5-4-4" />
    </svg>
  )
}
