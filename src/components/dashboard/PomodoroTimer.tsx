import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const TIMER_SETTINGS = {
  focus: { duration: 25 * 60, label: 'Focus Time', icon: BookOpen },
  shortBreak: { duration: 5 * 60, label: 'Short Break', icon: Coffee },
  longBreak: { duration: 15 * 60, label: 'Long Break', icon: Coffee },
};

interface PomodoroTimerProps {
  onStateChange?: (isRunning: boolean, mode: TimerMode) => void;
}

export const PomodoroTimer = ({ onStateChange }: PomodoroTimerProps) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalTime = TIMER_SETTINGS[mode].duration;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(isRunning, mode);
  }, [isRunning, mode, onStateChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      
      if (mode === 'focus') {
        setSessions((prev) => prev + 1);
        // Auto switch to break
        if ((sessions + 1) % 4 === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('focus');
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessions]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(TIMER_SETTINGS[newMode].duration);
    setIsRunning(false);
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setTimeLeft(TIMER_SETTINGS[mode].duration);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ModeIcon = TIMER_SETTINGS[mode].icon;

  return (
    <Card className="gradient-card border shadow-soft hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="font-display flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            mode === 'focus' ? 'gradient-primary' : 'gradient-success'
          )}>
            <ModeIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
        
        <div className="flex justify-center gap-2">
          {(Object.keys(TIMER_SETTINGS) as TimerMode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchMode(m)}
              className={cn(
                "text-xs",
                mode === m && (m === 'focus' ? 'gradient-primary' : 'gradient-success')
              )}
            >
              {TIMER_SETTINGS[m].label}
            </Button>
          ))}
        </div>

        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={553}
                strokeDashoffset={553 - (553 * progress) / 100}
                className={cn(
                  "transition-all duration-1000",
                  mode === 'focus' ? 'text-primary' : 'text-success'
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-5xl font-mono font-bold text-foreground">{formatTime(timeLeft)}</p>
              <p className="text-sm text-muted-foreground mt-1">{TIMER_SETTINGS[mode].label}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            onClick={toggleTimer}
            size="lg"
            className={cn(
              "w-24",
              mode === 'focus' ? 'gradient-primary' : 'gradient-success'
            )}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Sessions completed today: <span className="font-bold text-primary">{sessions}</span>
        </div>
      </CardContent>
    </Card>
  );
};
