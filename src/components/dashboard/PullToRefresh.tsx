import { ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export const PullToRefresh = ({ children, onRefresh, className }: PullToRefreshProps) => {
  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold: 80,
  });

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-all duration-200 pointer-events-none z-40",
          pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: -60 + pullDistance,
          transform: `translateY(${Math.min(pullDistance, 60)}px)`,
        }}
      >
        <div className={cn(
          "bg-primary/10 backdrop-blur-sm rounded-full p-3 shadow-lg border border-primary/20",
          isRefreshing && "animate-pulse"
        )}>
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <ArrowDown 
              className={cn(
                "h-5 w-5 text-primary transition-transform duration-200",
                progress >= 1 && "rotate-180"
              )}
              style={{ 
                transform: `rotate(${progress * 180}deg)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
