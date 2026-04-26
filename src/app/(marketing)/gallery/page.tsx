"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image";
import { 
  Camera, 
  Maximize2, 
  X, 
  Loader2, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  type?: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    // Fetch images from the media API
    fetch("/api/media/list?type=image&prefix=gallery/")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setImages(data);
        }
      })
      .catch((err) => console.error("Gallery fetch failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleNext = () => {
    if (selectedImage === null) return;
    setSelectedImage((selectedImage + 1) % images.length);
  };

  const handlePrev = () => {
    if (selectedImage === null) return;
    setSelectedImage((selectedImage - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          {images.length > 0 && (
            <NextImage
              src={images[0].url}
              alt="Gallery Background"
              fill
              className="object-cover blur-sm"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/60 to-slate-950/20" />
        
        <div className="container relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 text-sm font-bold mb-6 backdrop-blur-md">
            <Camera className="w-4 h-4" />
            Visual Excellence
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
            Excel <span className="text-cyan-400">Academy</span> Gallery
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto font-medium drop-shadow-lg">
            Capturing the vibrant moments, academic achievements, and campus life at one of Ethiopia's leading institutions.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-24 container px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              Curating our moments...
            </p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
            <ImageIcon className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Images Yet</h3>
            <p className="text-slate-500">Admin hasn't uploaded any school images to the gallery yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {images.map((img, idx) => (
              <Card 
                key={img.id || idx}
                className="group relative h-80 rounded-3xl overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer bg-slate-100"
                onClick={() => setSelectedImage(idx)}
              >
                <NextImage
                  src={img.url}
                  alt={img.title || "School Life"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority={idx < 4}
                  loading={idx < 4 ? undefined : "lazy"}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-black text-lg uppercase tracking-tight">
                        {img.title || "Campus View"}
                      </h3>
                      <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-1">
                        {img.type || "School Event"}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 hover:bg-white/40 transition-colors">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl animate-fade-in transition-all">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-8 right-8 text-white hover:bg-white/20 rounded-full h-12 w-12 z-50 transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-8 text-white hover:bg-white/20 rounded-full h-16 w-16 hidden md:flex items-center justify-center transition-all"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-10 h-10" />
          </Button>

          <div className="relative w-full h-[85vh] mx-12">
            <NextImage
              src={images[selectedImage].url}
              alt={images[selectedImage].title || "School Life"}
              fill
              className="object-contain animate-zoom-in"
            />
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-full">
              <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-2 drop-shadow-lg">
                {images[selectedImage].title || "Excel Academy Moment"}
              </h3>
              <p className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-sm">
                Image {selectedImage + 1} of {images.length}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-8 text-white hover:bg-white/20 rounded-full h-16 w-16 hidden md:flex items-center justify-center transition-all"
            onClick={handleNext}
          >
            <ChevronRight className="w-10 h-10" />
          </Button>
        </div>
      )}
    </div>
  );
}
