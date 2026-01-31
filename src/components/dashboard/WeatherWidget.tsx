import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, MapPin, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  city: string;
  icon: string;
}

const getWeatherIcon = (condition: string) => {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
  if (c.includes('snow')) return Snowflake;
  if (c.includes('cloud')) return Cloud;
  return Sun;
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Using wttr.in - a free weather API that doesn't require API keys
      const location = lat && lon ? `${lat},${lon}` : 'auto';
      const response = await fetch(`https://wttr.in/${location}?format=j1`);
      
      if (!response.ok) throw new Error('Weather data unavailable');
      
      const data = await response.json();
      const current = data.current_condition[0];
      const area = data.nearest_area[0];
      
      setWeather({
        temp: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedKmph),
        city: area.areaName[0].value,
        icon: current.weatherCode,
      });
    } catch {
      setError('Unable to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchWeather(); // Fallback to IP-based location
        }
      );
    } else {
      fetchWeather();
    }
  }, []);

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Sun;

  return (
    <Card className="gradient-card border shadow-soft hover-lift overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            Weather
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchWeather()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : error ? (
          <p className="text-muted-foreground text-center py-4">{error}</p>
        ) : weather ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 flex items-center justify-center">
                <WeatherIcon className="w-10 h-10 text-blue-500" />
              </div>
              <div>
                <p className="text-4xl font-bold">{weather.temp}°C</p>
                <p className="text-muted-foreground">{weather.condition}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {weather.city}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Droplets className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className="font-semibold">{weather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Wind className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Wind</p>
                  <p className="font-semibold">{weather.windSpeed} km/h</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
