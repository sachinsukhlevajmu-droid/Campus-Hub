import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Plus, Trash2, Play, CheckCircle, XCircle, Clock, Sparkles, Cloud, Loader2 } from 'lucide-react';

interface Deck {
  id: string;
  name: string;
  color: string;
}

interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  easiness: number;
  interval: number;
  repetitions: number;
  next_review: string;
}

const DECK_COLORS = [
  'bg-destructive',
  'bg-primary',
  'bg-success',
  'bg-warning',
  'bg-accent',
  'bg-secondary',
  'bg-muted-foreground',
  'bg-primary/80',
];

export function FlashcardSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [isStudying, setIsStudying] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [newDeckName, setNewDeckName] = useState('');

  // Fetch decks and flashcards from database
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch decks
      const { data: deckData, error: deckError } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (deckError) {
        toast({
          title: "Error loading decks",
          description: deckError.message,
          variant: "destructive",
        });
      } else {
        const processedDecks = (deckData || []).map((deck, index) => ({
          ...deck,
          color: DECK_COLORS[index % DECK_COLORS.length],
        }));
        setDecks(processedDecks);
        if (processedDecks.length > 0) {
          setSelectedDeck(processedDecks[0].id);
        }
      }

      // Fetch flashcards
      const { data: cardData, error: cardError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id);

      if (cardError) {
        toast({
          title: "Error loading flashcards",
          description: cardError.message,
          variant: "destructive",
        });
      } else {
        setFlashcards(cardData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, toast]);

  // Get cards due for review
  const getDueCards = () => {
    const now = new Date().toISOString();
    return flashcards.filter(card => card.next_review <= now);
  };

  // SM-2 Algorithm implementation
  const calculateNextReview = (card: Flashcard, quality: number) => {
    let easiness = card.easiness;
    let interval = card.interval;
    let repetitions = card.repetitions;

    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easiness);
      }
      repetitions += 1;
    }

    easiness = Math.max(1.3, easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      easiness,
      interval,
      repetitions,
      next_review: nextReview.toISOString(),
    };
  };

  const addDeck = async () => {
    if (!newDeckName.trim() || !user) return;

    setSyncing(true);
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: user.id,
        name: newDeckName.trim(),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating deck",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      const newDeck = {
        ...data,
        color: DECK_COLORS[decks.length % DECK_COLORS.length],
      };
      setDecks([...decks, newDeck]);
      setNewDeckName('');
      if (!selectedDeck) {
        setSelectedDeck(data.id);
      }
    }
    setSyncing(false);
  };

  const addFlashcard = async () => {
    if (!newFront.trim() || !newBack.trim() || !selectedDeck || !user) return;

    setSyncing(true);
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        user_id: user.id,
        deck_id: selectedDeck,
        front: newFront.trim(),
        back: newBack.trim(),
        easiness: 2.5,
        interval: 0,
        repetitions: 0,
        next_review: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding flashcard",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setFlashcards([...flashcards, data]);
      setNewFront('');
      setNewBack('');
    }
    setSyncing(false);
  };

  const deleteDeck = async (deckId: string) => {
    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId);

    if (error) {
      toast({
        title: "Error deleting deck",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDecks(decks.filter(d => d.id !== deckId));
      setFlashcards(flashcards.filter(c => c.deck_id !== deckId));
      if (selectedDeck === deckId) {
        setSelectedDeck(decks.length > 1 ? decks[0].id : '');
      }
    }
  };

  const deleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId);

    if (error) {
      toast({
        title: "Error deleting card",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setFlashcards(flashcards.filter(c => c.id !== cardId));
    }
  };

  const startStudySession = (deckId?: string) => {
    let cardsToStudy = getDueCards();
    if (deckId) {
      cardsToStudy = cardsToStudy.filter(c => c.deck_id === deckId);
    }
    
    cardsToStudy.sort(() => Math.random() - 0.5);
    
    if (cardsToStudy.length === 0) {
      cardsToStudy = deckId 
        ? flashcards.filter(c => c.deck_id === deckId)
        : [...flashcards];
      cardsToStudy.sort(() => Math.random() - 0.5);
    }

    if (cardsToStudy.length > 0) {
      setStudyQueue(cardsToStudy);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setIsStudying(true);
    }
  };

  const handleAnswer = async (quality: number) => {
    const currentCard = studyQueue[currentCardIndex];
    const updates = calculateNextReview(currentCard, quality);
    
    const { error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', currentCard.id);

    if (!error) {
      setFlashcards(flashcards.map(c => 
        c.id === currentCard.id ? { ...c, ...updates } : c
      ));
    }

    if (currentCardIndex < studyQueue.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      setIsStudying(false);
      setStudyQueue([]);
    }
  };

  const getDeckStats = (deckId: string) => {
    const deckCards = flashcards.filter(c => c.deck_id === deckId);
    const dueCards = deckCards.filter(c => c.next_review <= new Date().toISOString());
    return { total: deckCards.length, due: dueCards.length };
  };

  const dueCount = getDueCards().length;

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isStudying && studyQueue.length > 0) {
    const currentCard = studyQueue[currentCardIndex];
    const deck = decks.find(d => d.id === currentCard.deck_id);

    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Study Session
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentCardIndex + 1} / {studyQueue.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsStudying(false)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {deck && (
            <Badge className={`${deck.color} text-primary-foreground`}>{deck.name}</Badge>
          )}
          
          <div 
            className="min-h-[200px] flex items-center justify-center p-6 bg-muted/50 rounded-lg cursor-pointer transition-all hover:bg-muted/70"
            onClick={() => setShowAnswer(true)}
          >
            <div className="text-center">
              {!showAnswer ? (
                <>
                  <p className="text-lg font-medium mb-2 text-foreground">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground">Click to reveal answer</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">{currentCard.front}</p>
                  <div className="border-t border-border my-3"></div>
                  <p className="text-lg font-medium text-foreground">{currentCard.back}</p>
                </>
              )}
            </div>
          </div>

          {showAnswer && (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">How well did you remember?</p>
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant="outline" 
                  className="flex flex-col h-auto py-3 border-destructive/50 hover:bg-destructive/10"
                  onClick={() => handleAnswer(1)}
                >
                  <XCircle className="w-4 h-4 text-destructive mb-1" />
                  <span className="text-xs">Again</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex flex-col h-auto py-3 border-warning/50 hover:bg-warning/10"
                  onClick={() => handleAnswer(3)}
                >
                  <Clock className="w-4 h-4 text-warning mb-1" />
                  <span className="text-xs">Hard</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex flex-col h-auto py-3 border-primary/50 hover:bg-primary/10"
                  onClick={() => handleAnswer(4)}
                >
                  <CheckCircle className="w-4 h-4 text-primary mb-1" />
                  <span className="text-xs">Good</span>
                </Button>
                <Button 
                  variant="outline"
                  className="flex flex-col h-auto py-3 border-success/50 hover:bg-success/10"
                  onClick={() => handleAnswer(5)}
                >
                  <Sparkles className="w-4 h-4 text-success mb-1" />
                  <span className="text-xs">Easy</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Flashcards
            <Cloud className="w-4 h-4 text-muted-foreground" />
          </CardTitle>
          {dueCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {dueCount} due
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="study" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="study">Study</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="decks">Decks</TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="space-y-3">
            {flashcards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No flashcards yet</p>
                <p className="text-sm">Create some cards to start studying!</p>
              </div>
            ) : (
              <>
                <Button 
                  className="w-full" 
                  onClick={() => startStudySession()}
                  disabled={flashcards.length === 0}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Study All ({flashcards.length} cards)
                </Button>
                
                <div className="space-y-2">
                  {decks.map(deck => {
                    const stats = getDeckStats(deck.id);
                    if (stats.total === 0) return null;
                    
                    return (
                      <div 
                        key={deck.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${deck.color}`}></div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{deck.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {stats.total} cards • {stats.due} due
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => startStudySession(deck.id)}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-3">
            {decks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Create a deck first in the Decks tab</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Question / Front side"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  disabled={syncing}
                />
                <Textarea
                  placeholder="Answer / Back side"
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  rows={3}
                  disabled={syncing}
                />
                <select
                  value={selectedDeck}
                  onChange={(e) => setSelectedDeck(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  disabled={syncing}
                >
                  {decks.map(deck => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                  ))}
                </select>
                <Button className="w-full" onClick={addFlashcard} disabled={syncing}>
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Flashcard
                </Button>
              </div>
            )}

            {flashcards.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                <p className="text-sm font-medium text-muted-foreground">Recent Cards</p>
                {flashcards.slice(-5).reverse().map(card => {
                  const deck = decks.find(d => d.id === card.deck_id);
                  return (
                    <div 
                      key={card.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${deck?.color || 'bg-gray-500'} flex-shrink-0`}></div>
                        <p className="text-sm truncate">{card.front}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteCard(card.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="decks" className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="New deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDeck()}
                disabled={syncing}
              />
              <Button onClick={addDeck} disabled={syncing}>
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              {decks.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Create your first deck to get started
                </p>
              ) : (
                decks.map(deck => {
                  const stats = getDeckStats(deck.id);
                  return (
                    <div 
                      key={deck.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${deck.color}`}></div>
                        <div>
                          <p className="font-medium text-sm">{deck.name}</p>
                          <p className="text-xs text-muted-foreground">{stats.total} cards</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteDeck(deck.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
