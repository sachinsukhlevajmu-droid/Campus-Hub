import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Search, ExternalLink, Loader2 } from 'lucide-react';

interface WikipediaResult {
  pageid: number;
  title: string;
  snippet: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

export const WikipediaSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<WikipediaResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchWikipedia = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=10&srsearch=${encodeURIComponent(searchQuery.trim())}`
      );

      if (!response.ok) {
        throw new Error('Failed to search Wikipedia');
      }

      const data = await response.json();
      
      if (data.query?.search) {
        // Fetch thumbnails for results
        const pageIds = data.query.search.map((r: WikipediaResult) => r.pageid).join('|');
        const thumbnailResponse = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=pageimages&format=json&origin=*&pithumbsize=100`
        );
        const thumbnailData = await thumbnailResponse.json();
        
        const resultsWithThumbnails = data.query.search.map((result: WikipediaResult) => ({
          ...result,
          thumbnail: thumbnailData.query?.pages?.[result.pageid]?.thumbnail
        }));
        
        setResults(resultsWithThumbnails);
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchWikipedia();
    }
  };

  const openWikipediaPage = (title: string) => {
    window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`, '_blank');
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <Card className="gradient-card hover-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-accent" />
          Wikipedia Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search Wikipedia..."
            className="flex-1"
          />
          <Button onClick={searchWikipedia} disabled={isLoading} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="h-64">
          {error && (
            <div className="text-center text-destructive py-4">
              <p>{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.pageid}
                  className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors group"
                  onClick={() => openWikipediaPage(result.title)}
                >
                  <div className="flex gap-3">
                    {result.thumbnail && (
                      <img
                        src={result.thumbnail.source}
                        alt={result.title}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {result.title}
                        </h4>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {stripHtml(result.snippet)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !error && !isLoading && (
            <div className="text-center text-muted-foreground py-8">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Search Wikipedia for any topic</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
