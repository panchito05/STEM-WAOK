import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Cog, Play, Pause } from 'lucide-react';

// Interface para los metadatos de videos de YouTube
interface YoutubeVideoMetadata {
  url: string;
  title: string;
  thumbnailUrl: string;
  videoId: string;
  loading: boolean;
  error: boolean;
}

interface YouTubeVideoManagerProps {
  isVideoPlaying: boolean;
  currentVideo: YoutubeVideoMetadata | null;
  videoLinks: string[];
  isEditMode: boolean;
  onStartVideo: (video: YoutubeVideoMetadata) => void;
  onStopVideo: () => void;
  onEnterEditMode: () => void;
  onExitEditMode: () => void;
  onSaveVideos: (videos: YoutubeVideoMetadata[]) => void;
  onVideoChange: (index: number, value: string) => void;
  onRemoveVideo: (index: number) => void;
  onAddVideo: () => void;
}

const YouTubeVideoManager: React.FC<YouTubeVideoManagerProps> = ({
  isVideoPlaying,
  currentVideo,
  videoLinks,
  isEditMode,
  onStartVideo,
  onStopVideo,
  onEnterEditMode,
  onExitEditMode,
  onSaveVideos,
  onVideoChange,
  onRemoveVideo,
  onAddVideo
}) => {
  const [videos, setVideos] = useState<YoutubeVideoMetadata[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Función para extraer el ID del video de YouTube
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Función para obtener metadatos del video
  const fetchVideoMetadata = async (url: string): Promise<YoutubeVideoMetadata> => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return {
        url,
        title: 'Video inválido',
        thumbnailUrl: '',
        videoId: '',
        loading: false,
        error: true
      };
    }

    try {
      // Usar la URL de thumbnail de YouTube directamente
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      return {
        url,
        title: `Video de YouTube: ${videoId}`,
        thumbnailUrl,
        videoId,
        loading: false,
        error: false
      };
    } catch (error) {
      return {
        url,
        title: 'Error al cargar video',
        thumbnailUrl: '',
        videoId: videoId || '',
        loading: false,
        error: true
      };
    }
  };

  // Procesar videos cuando cambian los enlaces
  useEffect(() => {
    const processVideos = async () => {
      const processedVideos: YoutubeVideoMetadata[] = [];
      
      for (const link of videoLinks) {
        if (link.trim()) {
          const metadata = await fetchVideoMetadata(link);
          processedVideos.push(metadata);
        }
      }
      
      setVideos(processedVideos);
    };

    processVideos();
  }, [videoLinks]);

  const handleSaveVideos = () => {
    onSaveVideos(videos);
    setIsDialogOpen(false);
    onExitEditMode();
  };

  if (isVideoPlaying && currentVideo) {
    return (
      <div className="mb-4 p-4 border border-blue-300 rounded-lg bg-blue-50">
        <div className="aspect-video bg-black rounded-lg mb-2">
          <iframe
            src={`https://www.youtube.com/embed/${currentVideo.videoId}?autoplay=1`}
            className="w-full h-full rounded-lg"
            allowFullScreen
            allow="autoplay"
            title={currentVideo.title}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{currentVideo.title}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onStopVideo}>
              <X className="h-4 w-4 mr-2" />
              Cerrar video
            </Button>
            <Button variant="outline" size="sm" onClick={onEnterEditMode}>
              <Cog className="h-4 w-4 mr-2" />
              Editar videos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <Dialog open={isEditMode} onOpenChange={(open) => !open && onExitEditMode()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Videos Explicativos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600 mb-2">
              Añade hasta 2 enlaces de YouTube para videos explicativos de este ejercicio.
            </div>
            
            {videoLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => onVideoChange(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveVideo(index)}
                  disabled={videoLinks.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {videoLinks.length < 2 && (
              <Button variant="outline" onClick={onAddVideo} className="w-full">
                Añadir otro video
              </Button>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onExitEditMode}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVideos}>
              Guardar videos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Vista normal con videos disponibles
  if (videos.length > 0) {
    return (
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Videos explicativos disponibles:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map((video, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => !video.error && onStartVideo(video)}
            >
              <div className="flex items-center gap-3">
                {video.thumbnailUrl && !video.error ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-16 h-12 object-cover rounded flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://img.youtube.com/vi/${video.videoId}/default.jpg`;
                    }}
                  />
                ) : (
                  <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <Play className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {video.error ? 'Video no válido' : video.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {video.error ? 'URL incorrecta' : 'Clic para reproducir'}
                  </div>
                </div>
                
                {!video.error && (
                  <Play className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onEnterEditMode}
          className="mt-2"
        >
          <Cog className="h-4 w-4 mr-2" />
          Editar videos
        </Button>
      </div>
    );
  }

  return null;
};

export default YouTubeVideoManager;