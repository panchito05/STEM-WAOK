import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Youtube, X, Maximize2, Minimize2 } from "lucide-react";

// Interface para los metadatos de videos de YouTube
export interface YoutubeVideoMetadata {
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
const YoutubeVideoDialog = ({
  isOpen,
  onClose,
  videos,
  onSave
}: YoutubeVideoDialogProps) => {
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
                title: data.title || "Video sin título",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                videoId,
                loading: false,
                error: false
              });
            } else {
              metadata.push({
                url: videoUrl,
                title: "Error al cargar video",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                videoId,
                loading: false,
                error: true
              });
            }
          } catch (error) {
            metadata.push({
              url: videoUrl,
              title: "Error al cargar video",
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              videoId,
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

  const handleAddVideo = () => {
    setVideoLinks([...videoLinks, ""]);
  };

  const handleRemoveVideo = (index: number) => {
    const newLinks = [...videoLinks];
    newLinks.splice(index, 1);
    setVideoLinks(newLinks);
  };

  const handleVideoLinkChange = (index: number, value: string) => {
    const newLinks = [...videoLinks];
    newLinks[index] = value;
    setVideoLinks(newLinks);
  };

  const handleSave = () => {
    // Filtrar enlaces vacíos
    const filteredLinks = videoLinks.filter(link => link.trim() !== "");
    onSave(filteredLinks);
    setIsEditMode(false);
  };

  const handlePlayVideo = (videoId: string) => {
    setCurrentPlayingVideo(videoId);
  };

  const handleCloseVideo = () => {
    setCurrentPlayingVideo(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] h-[90vh]' : 'max-w-4xl'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            {isEditMode ? "Editar videos explicativos" : "Videos explicativos"}
          </DialogTitle>
        </DialogHeader>

        {currentPlayingVideo ? (
          <div className="relative w-full h-full">
            <div className="absolute top-0 right-0 z-10 flex gap-1">
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCloseVideo}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                src={`https://www.youtube.com/embed/${currentPlayingVideo}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={`${isFullscreen ? 'w-full h-full' : 'w-full aspect-video'}`}
              ></iframe>
            </div>
          </div>
        ) : isEditMode ? (
          <div className="space-y-4">
            {videoLinks.map((link, index) => (
              <div key={`video-link-${index}`} className="flex gap-2 items-center">
                <Input
                  value={link}
                  onChange={(e) => handleVideoLinkChange(index, e.target.value)}
                  placeholder="URL del video de YouTube (ej: https://www.youtube.com/watch?v=...)"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveVideo(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddVideo} className="w-full">
              Añadir video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videosMetadata.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No hay videos disponibles
              </div>
            ) : (
              videosMetadata.map((video, index) => (
                <div
                  key={`video-${index}`}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="relative aspect-video bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
                    onClick={() => !video.error && handlePlayVideo(video.videoId)}
                  >
                    {video.error ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                        Video no disponible
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                          <div className="w-3 h-4 bg-white ml-1"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium line-clamp-2">{video.title}</h3>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          {isEditMode ? (
            <>
              <Button variant="outline" onClick={() => {
                setVideoLinks([...videos]);
                setIsEditMode(false);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Guardar</Button>
            </>
          ) : (
            <>
              {videos.length > 0 && (
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  Editar
                </Button>
              )}
              <Button onClick={onClose}>Cerrar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YoutubeVideoDialog;