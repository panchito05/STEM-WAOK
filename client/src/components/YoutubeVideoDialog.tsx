import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Maximize2, Minimize2, Play, X, Plus } from "lucide-react";

// Interface para los metadatos de videos de YouTube
interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  loading: boolean;
  error: boolean;
}

interface YoutubeVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videos: string[];
  onSave: (newVideos: string[]) => void;
}

// Componente para gestionar videos explicativos de YouTube
const YoutubeVideoDialog = ({ isOpen, onClose, videos, onSave }: YoutubeVideoDialogProps) => {
  const [videoLinks, setVideoLinks] = useState<string[]>([...videos]);
  const [videosMetadata, setVideosMetadata] = useState<YoutubeVideoMetadata[]>([]);
  const [isEditMode, setIsEditMode] = useState(videos.length === 0);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Función para extraer el ID de video de YouTube de una URL
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Cargar los metadatos de los videos cuando se abre el diálogo
  useEffect(() => {
    if (isOpen && videos.length > 0 && !isEditMode) {
      const fetchVideoMetadata = async () => {
        const metadata: YoutubeVideoMetadata[] = [];

        for (const videoUrl of videos) {
          const videoId = extractYoutubeId(videoUrl);
          if (!videoId) {
            metadata.push({
              url: videoUrl,
              title: "Video no válido",
              thumbnailUrl: "",
              videoId: "",
              loading: false,
              error: true
            });
            continue;
          }

          try {
            // Usamos la API de oEmbed de YouTube para obtener metadatos
            const response = await fetch(`https://www.youtube.com/oembed?url=${videoUrl}&format=json`);

            if (response.ok) {
              const data = await response.json();
              metadata.push({
                url: videoUrl,
                title: data.title || "Video de YouTube",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                videoId: videoId,
                loading: false,
                error: false
              });
            } else {
              metadata.push({
                url: videoUrl,
                title: "Video no encontrado",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                videoId: videoId,
                loading: false,
                error: true
              });
            }
          } catch (error) {
            metadata.push({
              url: videoUrl,
              title: "Error al cargar información",
              thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "",
              videoId: videoId || "",
              loading: false,
              error: true
            });
          }
        }

        setVideosMetadata(metadata);
      };

      fetchVideoMetadata();
    }
  }, [isOpen, videos, isEditMode]);

  // Limpiar estado cuando se cierra el diálogo
  useEffect(() => {
    if (!isOpen) {
      setCurrentPlayingVideo(null);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  const handleVideoChange = (index: number, value: string) => {
    const newLinks = [...videoLinks];
    newLinks[index] = value;
    setVideoLinks(newLinks);
  };

  const addVideoInput = () => {
    if (videoLinks.length < 2) {
      setVideoLinks([...videoLinks, '']);
    }
  };

  const removeVideo = (index: number) => {
    const newLinks = [...videoLinks];
    newLinks.splice(index, 1);
    setVideoLinks(newLinks);
  };

  const handleSave = () => {
    // Filtrar enlaces vacíos
    const filteredLinks = videoLinks.filter(link => link.trim() !== '');
    onSave(filteredLinks);
    setIsEditMode(false);
    if (filteredLinks.length === 0) {
      onClose();
    }
  };

  const handleEnterEditMode = () => {
    setCurrentPlayingVideo(null);
    setIsEditMode(true);
    setVideoLinks([...videos]);
  };

  const playVideo = (videoId: string) => {
    setCurrentPlayingVideo(videoId);
  };

  const stopVideo = () => {
    setCurrentPlayingVideo(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCurrentPlayingVideo(null);
          setIsFullscreen(false);
          onClose();
        }
      }}
    >
      <DialogContent className={`${isFullscreen ? 'w-screen h-screen max-w-none !rounded-none' : 'w-full max-w-3xl'}`}>
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Videos Explicativos</DialogTitle>
            <div className="flex gap-2">
              {currentPlayingVideo && (
                <Button
                  variant="outline" 
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-8 w-8"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
              {!isEditMode && (
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={handleEnterEditMode}
                  className="h-8"
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {isEditMode ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Agrega enlaces a videos de YouTube que expliquen los conceptos de este módulo.</p>
            
            {videoLinks.map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  value={link}
                  onChange={(e) => handleVideoChange(index, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1"
                />
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => removeVideo(index)}
                  className="h-10 w-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {videoLinks.length < 2 && (
              <Button
                variant="outline"
                onClick={addVideoInput}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar otro video
              </Button>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {currentPlayingVideo ? (
              <div className={`relative ${isFullscreen ? 'h-[calc(100vh-10rem)]' : 'h-[300px] sm:h-[400px]'}`}>
                <iframe
                  src={`https://www.youtube.com/embed/${currentPlayingVideo}?autoplay=1`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={stopVideo}
                  className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videosMetadata.map((video, index) => (
                  <div
                    key={index}
                    className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="aspect-video bg-gray-100 relative">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-500">No hay vista previa</span>
                        </div>
                      )}
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors cursor-pointer"
                        onClick={() => video.videoId && playVideo(video.videoId)}
                      >
                        <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium line-clamp-2">{video.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!currentPlayingVideo && videosMetadata.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay videos disponibles.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default YoutubeVideoDialog;