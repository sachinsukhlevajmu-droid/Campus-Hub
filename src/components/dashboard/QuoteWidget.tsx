import { useState, useEffect } from 'react';
import { Quote, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteData {
  content: string;
  author: string;
}

export const QuoteWidget = () => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.quotable.io/random?tags=education|inspirational|wisdom|motivation');
      if (!response.ok) throw new Error('Failed to fetch quote');
      const data = await response.json();
      setQuote({
        content: data.content,
        author: data.author,
      });
    } catch (err) {
      // Fallback quotes
      const fallbackQuotes = [
        { content: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
        { content: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
        { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      ];
      setQuote(fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <Card className="gradient-hero border-0 shadow-soft hover-lift relative overflow-hidden">
      <div className="absolute top-4 right-4">
        <Sparkles className="w-6 h-6 text-primary/30" />
      </div>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/3 mt-4" />
          </div>
        ) : quote ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Quote className="w-8 h-8 text-primary/50 shrink-0 rotate-180" />
              <p className="text-lg font-medium leading-relaxed text-foreground/90">
                {quote.content}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-primary font-semibold">
                — {quote.author}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchQuote}
                className="text-muted-foreground hover:text-primary"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                New Quote
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
