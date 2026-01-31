import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipForward,
  Radio,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Heart,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  codec: string;
  bitrate: number;
}

interface FavoriteStation {
  id: string;
  station_uuid: string;
  station_name: string;
  station_url: string;
  station_favicon: string | null;
  station_country: string | null;
  station_bitrate: number | null;
  category: string;
}

interface Category {
  id: string;
  label: string;
  color: string;
  searchTags: string[];
}

const CATEGORIES: Category[] = [
  { 
    id: 'lofi', 
    label: 'Lo-Fi', 
    color: 'from-purple-500 to-pink-500',
    searchTags: ['lofi', 'chillhop']
  },
  { 
    id: 'jazz', 
    label: 'Jazz', 
    color: 'from-amber-500 to-orange-500',
    searchTags: ['jazz', 'smooth jazz']
  },
  { 
    id: 'classical', 
    label: 'Classical', 
    color: 'from-blue-500 to-cyan-500',
    searchTags: ['classical', 'piano']
  },
  { 
    id: 'ambient', 
    label: 'Ambient', 
    color: 'from-green-500 to-emerald-500',
    searchTags: ['ambient', 'relaxation']
  },
  { 
    id: 'electronic', 
    label: 'Electronic', 
    color: 'from-indigo-500 to-violet-500',
    searchTags: ['chillout', 'downtempo']
  }
];

// Radio Browser API - completely free, no API key needed
const RADIO_BROWSER_APIS = [
  'https://de1.api.radio-browser.info/json',
  'https://nl1.api.radio-browser.info/json',
  'https://at1.api.radio-browser.info/json'
];

interface FocusMusicPlayerProps {
  isPomodoroRunning?: boolean;
  pomodoroMode?: 'focus' | 'shortBreak' | 'longBreak';
}

export const FocusMusicPlayer = ({ isPomodoroRunning, pomodoroMode }: FocusMusicPlayerProps) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStations, setIsFetchingStations] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('lofi');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [apiIndex, setApiIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch favorites from database
  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorite_stations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFavorites(data || []);
    } catch {
      // Silently fail - favorites will be empty
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Fetch stations from Radio Browser API with fallback
  const fetchStations = useCallback(async (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    setIsFetchingStations(true);
    setError(null);

    const tryFetch = async (apiUrl: string): Promise<RadioStation[]> => {
      const allStations: RadioStation[] = [];
      
      for (const tag of category.searchTags) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(
            `${apiUrl}/stations/bytag/${encodeURIComponent(tag)}?limit=8&order=clickcount&reverse=true&hidebroken=true`,
            {
              signal: controller.signal,
              headers: { 'User-Agent': 'StudyDashboard/1.0' }
            }
          );
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data: RadioStation[] = await response.json();
            // Filter for MP3/AAC streams which have better browser support
            const validStations = data.filter(s => 
              s.url_resolved && 
              s.name && 
              (s.codec === 'MP3' || s.codec === 'AAC' || s.codec === 'OGG' || !s.codec)
            );
            allStations.push(...validStations);
          }
        } catch {
          // Silently continue to next tag
        }
      }
      
      return allStations;
    };

    try {
      let allStations: RadioStation[] = [];
      
      // Try current API, then fallback to others
      for (let i = 0; i < RADIO_BROWSER_APIS.length; i++) {
        const idx = (apiIndex + i) % RADIO_BROWSER_APIS.length;
        allStations = await tryFetch(RADIO_BROWSER_APIS[idx]);
        
        if (allStations.length > 0) {
          if (i > 0) setApiIndex(idx); // Remember working API
          break;
        }
      }

      // Remove duplicates
      const uniqueStations = allStations
        .filter((station, index, self) => 
          index === self.findIndex(s => s.stationuuid === station.stationuuid)
        )
        .slice(0, 12);

      if (uniqueStations.length > 0) {
        setStations(uniqueStations);
        if (!currentStation || !uniqueStations.find(s => s.stationuuid === currentStation.stationuuid)) {
          setCurrentStation(uniqueStations[0]);
        }
      } else {
        setError('No stations found');
      }
    } catch {
      setError('Failed to load stations');
    } finally {
      setIsFetchingStations(false);
    }
  }, [currentStation, apiIndex]);

  // Fetch stations when category changes
  useEffect(() => {
    if (isOnline && activeTab === 'browse') {
      fetchStations(selectedCategory);
    }
  }, [selectedCategory, isOnline, fetchStations, activeTab]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Stream unavailable');
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setError(null);
      setIsPlaying(true);
    };

    const handleStalled = () => {
      setError('Buffering...');
    };

    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('stalled', handleStalled);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Auto-play/pause based on Pomodoro timer state
  useEffect(() => {
    if (autoSync && isPomodoroRunning !== undefined && currentStation) {
      if (isPomodoroRunning && pomodoroMode === 'focus') {
        handlePlay();
      } else if (!isPomodoroRunning || pomodoroMode !== 'focus') {
        handlePause();
      }
    }
  }, [isPomodoroRunning, pomodoroMode, autoSync, currentStation]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const handlePlay = async () => {
    if (!audioRef.current || !currentStation) {
      setError('Select a station first');
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      const streamUrl = currentStation.url_resolved || currentStation.url;
      
      // Always set new source to avoid stale streams
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      
      // Wait for load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof Error) {
        if (err.name === 'NotSupportedError') {
          setError('Format not supported - try another');
        } else if (err.name !== 'AbortError') {
          setError('Tap play to start');
        }
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const selectStation = (station: RadioStation) => {
    const wasPlaying = isPlaying;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setIsPlaying(false);
    setCurrentStation(station);
    setError(null);
    
    if (wasPlaying) {
      setTimeout(handlePlay, 200);
    }
  };

  const selectFavoriteStation = (fav: FavoriteStation) => {
    const station: RadioStation = {
      stationuuid: fav.station_uuid,
      name: fav.station_name,
      url: fav.station_url,
      url_resolved: fav.station_url,
      favicon: fav.station_favicon || '',
      tags: '',
      country: fav.station_country || '',
      codec: '',
      bitrate: fav.station_bitrate || 0
    };
    selectStation(station);
  };

  const nextStation = () => {
    const stationList = activeTab === 'favorites' 
      ? favorites.map(f => ({
          stationuuid: f.station_uuid,
          name: f.station_name,
          url: f.station_url,
          url_resolved: f.station_url,
          favicon: f.station_favicon || '',
          tags: '',
          country: f.station_country || '',
          codec: '',
          bitrate: f.station_bitrate || 0
        }))
      : stations;
    
    if (stationList.length === 0) return;
    
    const currentIndex = currentStation 
      ? stationList.findIndex(s => s.stationuuid === currentStation.stationuuid)
      : -1;
    const nextIndex = (currentIndex + 1) % stationList.length;
    selectStation(stationList[nextIndex]);
  };

  const isFavorite = (stationUuid: string) => {
    return favorites.some(f => f.station_uuid === stationUuid);
  };

  const toggleFavorite = async (station: RadioStation) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    const existing = favorites.find(f => f.station_uuid === station.stationuuid);
    
    if (existing) {
      // Remove from favorites
      try {
        const { error } = await supabase
          .from('favorite_stations')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        
        setFavorites(prev => prev.filter(f => f.id !== existing.id));
        toast.success('Removed from favorites');
      } catch {
        toast.error('Failed to remove favorite');
      }
    } else {
      // Add to favorites
      try {
        const { data, error } = await supabase
          .from('favorite_stations')
          .insert({
            user_id: user.id,
            station_uuid: station.stationuuid,
            station_name: station.name,
            station_url: station.url_resolved || station.url,
            station_favicon: station.favicon || null,
            station_country: station.country || null,
            station_bitrate: station.bitrate || null,
            category: selectedCategory
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setFavorites(prev => [data, ...prev]);
        toast.success('Added to favorites');
      } catch {
        toast.error('Failed to add favorite');
      }
    }
  };

  const getCategoryGradient = (categoryId: string) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    return cat ? `bg-gradient-to-r ${cat.color}` : '';
  };

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);

  const StationItem = ({ station, isFav }: { station: RadioStation; isFav?: boolean }) => (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
        currentStation?.stationuuid === station.stationuuid && 
          `bg-gradient-to-r ${currentCategory?.color} text-white border-0`
      )}
      onClick={() => selectStation(station)}
    >
      <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
        {station.favicon ? (
          <img 
            src={station.favicon} 
            alt="" 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <Radio className="w-3 h-3" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{station.name}</p>
        <p className={cn(
          "text-[10px] truncate",
          currentStation?.stationuuid === station.stationuuid ? "text-white/70" : "text-muted-foreground"
        )}>
          {station.country} {station.bitrate ? `• ${station.bitrate}kbps` : ''}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 shrink-0",
          currentStation?.stationuuid === station.stationuuid && "hover:bg-white/20"
        )}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(station);
        }}
      >
        <Heart className={cn(
          "w-3.5 h-3.5",
          (isFav || isFavorite(station.stationuuid)) && "fill-current text-red-500"
        )} />
      </Button>
      {currentStation?.stationuuid === station.stationuuid && isPlaying && (
        <Wifi className="w-3 h-3 animate-pulse shrink-0" />
      )}
    </div>
  );

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              currentCategory ? `bg-gradient-to-br ${currentCategory.color}` : "bg-gradient-to-br from-purple-500 to-pink-500"
            )}>
              <Radio className="w-4 h-4 text-white" />
            </div>
            <span>Focus Radio</span>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {autoSync && isPomodoroRunning !== undefined && isOnline && (
              <Badge variant="outline" className={cn(
                "text-xs",
                isPomodoroRunning && pomodoroMode === 'focus' 
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30" 
                  : "bg-muted"
              )}>
                {isPomodoroRunning && pomodoroMode === 'focus' ? '🎵 Synced' : '⏸ Ready'}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Station Display */}
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
          isPlaying ? "bg-primary/5 border-primary/20" : "bg-muted/30"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden",
            isPlaying ? `bg-gradient-to-br ${currentCategory?.color || 'from-purple-500 to-pink-500'}` : "bg-muted"
          )}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : currentStation?.favicon ? (
              <img 
                src={currentStation.favicon} 
                alt="" 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Music className={cn("w-4 h-4", isPlaying && "text-white")} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {currentStation?.name || 'Select a station'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentStation?.country || 'Live radio stream'}
              {currentStation?.bitrate ? ` • ${currentStation.bitrate}kbps` : ''}
            </p>
            {error && <p className="text-xs text-orange-500">{error}</p>}
          </div>
          {isPlaying && !isLoading && (
            <div className="flex gap-0.5 items-end h-4">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{ 
                    height: `${8 + (i % 3) * 4}px`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="h-9 w-9"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          <Button
            onClick={togglePlay}
            size="lg"
            disabled={isLoading || !currentStation || !isOnline}
            className={cn(
              "w-12 h-12 rounded-full transition-all",
              isPlaying 
                ? "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" 
                : `bg-gradient-to-br ${currentCategory?.color || 'from-purple-500 to-pink-500'}`
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 text-white" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextStation}
            disabled={stations.length === 0 && favorites.length === 0}
            className="h-9 w-9"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 px-1">
          <VolumeX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>

        {/* Tabs for Browse/Favorites */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="browse" className="text-xs">
              <Radio className="w-3 h-3 mr-1" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Favorites ({favorites.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="mt-3 space-y-3">
            {/* Category Tabs */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Genre
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchStations(selectedCategory)}
                disabled={isFetchingStations || !isOnline}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className={cn("w-3 h-3 mr-1", isFetchingStations && "animate-spin")} />
                Refresh
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "text-xs h-7 px-3",
                    selectedCategory === cat.id && `${getCategoryGradient(cat.id)} text-white border-0`
                  )}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Station List */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stations {stations.length > 0 && `(${stations.length})`}
              </p>
              
              {isFetchingStations ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : stations.length > 0 ? (
                <ScrollArea className="h-36">
                  <div className="space-y-1.5 pr-2">
                    {stations.map((station) => (
                      <StationItem key={station.stationuuid} station={station} />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {error || (isOnline ? 'No stations available' : 'Connect to load stations')}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="favorites" className="mt-3">
            {favorites.length > 0 ? (
              <ScrollArea className="h-48">
                <div className="space-y-1.5 pr-2">
                  {favorites.map((fav) => (
                    <StationItem 
                      key={fav.id} 
                      station={{
                        stationuuid: fav.station_uuid,
                        name: fav.station_name,
                        url: fav.station_url,
                        url_resolved: fav.station_url,
                        favicon: fav.station_favicon || '',
                        tags: '',
                        country: fav.station_country || '',
                        codec: '',
                        bitrate: fav.station_bitrate || 0
                      }}
                      isFav
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No favorites yet</p>
                <p className="text-xs mt-1">Browse and tap ❤️ to save stations</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* API Attribution */}
        <p className="text-[10px] text-center text-muted-foreground/60">
          Powered by Radio Browser API • Free & Open Source
        </p>
      </CardContent>
    </Card>
  );
};
