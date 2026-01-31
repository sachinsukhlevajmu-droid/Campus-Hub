import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Search, Volume2, Loader2 } from 'lucide-react';

interface DictionaryResult {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms: string[];
    }>;
  }>;
}

export const DictionaryWidget = () => {
  const [searchWord, setSearchWord] = useState('');
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDictionary = async () => {
    if (!searchWord.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchWord.trim())}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Word not found. Please check the spelling.');
        }
        throw new Error('Failed to fetch definition');
      }

      const data = await response.json();
      setResult(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchDictionary();
    }
  };

  return (
    <Card className="gradient-card hover-lift h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-3 h-3 sm:h-4 sm:w-4 text-primary" />
          </div>
          <span className="truncate">Dictionary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for a word..."
            className="flex-1"
          />
          <Button onClick={searchDictionary} disabled={isLoading} size="icon">
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

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-foreground">{result.word}</h3>
                {result.phonetic && (
                  <span className="text-muted-foreground">{result.phonetic}</span>
                )}
                {result.phonetics?.find((p) => p.audio) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const audio = result.phonetics.find((p) => p.audio);
                      if (audio?.audio) playAudio(audio.audio);
                    }}
                  >
                    <Volume2 className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </div>

              {result.meanings.map((meaning, idx) => (
                <div key={idx} className="space-y-2">
                  <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">
                    {meaning.partOfSpeech}
                  </span>
                  <ol className="list-decimal list-inside space-y-2">
                    {meaning.definitions.slice(0, 3).map((def, defIdx) => (
                      <li key={defIdx} className="text-sm text-foreground">
                        <span>{def.definition}</span>
                        {def.example && (
                          <p className="ml-5 mt-1 text-muted-foreground italic">
                            "{def.example}"
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                  {meaning.definitions[0]?.synonyms?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Synonyms:</span>
                      {meaning.definitions[0].synonyms.slice(0, 5).map((syn, synIdx) => (
                        <span
                          key={synIdx}
                          className="text-xs px-2 py-0.5 bg-secondary rounded-full text-secondary-foreground cursor-pointer hover:bg-primary/20"
                          onClick={() => {
                            setSearchWord(syn);
                            searchDictionary();
                          }}
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!result && !error && !isLoading && (
            <div className="text-center text-muted-foreground py-8">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Enter a word to look up its definition</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
