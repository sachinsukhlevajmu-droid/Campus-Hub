import { useState, useEffect } from 'react';
import { Plus, Trash2, StickyNote, Edit2, Save, Cloud, Loader2, Calendar, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string | null;
  color: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const noteColors = [
  'bg-primary/10 border-primary/20',
  'bg-accent/10 border-accent/20',
  'bg-success/10 border-success/20',
  'bg-warning/10 border-warning/20',
  'bg-secondary border-border',
  'bg-muted border-border',
];

const noteCategories = [
  { name: 'General', color: 'bg-muted text-muted-foreground' },
  { name: 'Study', color: 'bg-primary/20 text-primary' },
  { name: 'Work', color: 'bg-accent/20 text-accent-foreground' },
  { name: 'Personal', color: 'bg-success/20 text-success' },
  { name: 'Ideas', color: 'bg-warning/20 text-warning' },
  { name: 'Important', color: 'bg-destructive/20 text-destructive' },
];

export const QuickNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(noteColors[0]);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Fetch notes from database
  useEffect(() => {
    if (!user) return;

    const fetchNotes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error loading notes",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setNotes(data || []);
      }
      setLoading(false);
    };

    fetchNotes();
  }, [user, toast]);

  const addNote = async () => {
    if ((!newTitle.trim() && !newContent.trim()) || !user) return;
    
    setSyncing(true);
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: newTitle || 'Untitled',
        content: newContent,
        color: selectedColor,
        category: selectedCategory,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding note",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setNotes([data, ...notes]);
      setNewTitle('');
      setNewContent('');
      setSelectedCategory('General');
      setIsAdding(false);
    }
    setSyncing(false);
  };

  const updateNote = async () => {
    if (!selectedNote) return;
    
    setSyncing(true);
    const { error } = await supabase
      .from('notes')
      .update({ 
        title: editTitle, 
        content: editContent,
        color: editColor,
        category: editCategory,
      })
      .eq('id', selectedNote.id);

    if (error) {
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const updatedNote = { 
        ...selectedNote, 
        title: editTitle, 
        content: editContent,
        color: editColor,
        category: editCategory,
        updated_at: new Date().toISOString() 
      };
      setNotes(notes.map(note => 
        note.id === selectedNote.id ? updatedNote : note
      ));
      setSelectedNote(updatedNote);
      setIsEditing(false);
      toast({
        title: "Note updated",
        description: "Your changes have been saved.",
      });
    }
    setSyncing(false);
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNotes(notes.filter(note => note.id !== id));
      setSelectedNote(null);
      toast({
        title: "Note deleted",
        description: "The note has been removed.",
      });
    }
  };

  const openNoteDialog = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
    setEditColor(note.color);
    setEditCategory(note.category || 'General');
    setIsEditing(false);
  };

  const closeDialog = () => {
    setSelectedNote(null);
    setIsEditing(false);
  };

  const getCategoryStyle = (categoryName: string) => {
    return noteCategories.find(c => c.name === categoryName)?.color || noteCategories[0].color;
  };

  const filteredNotes = filterCategory 
    ? notes.filter(note => note.category === filterCategory)
    : notes;

  if (loading) {
    return (
      <Card className="gradient-card border shadow-soft">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border shadow-soft hover-lift h-full">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="font-display flex items-center gap-2 text-sm sm:text-base">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg gradient-accent flex items-center justify-center shrink-0">
              <StickyNote className="w-3 h-3 sm:w-4 sm:h-4 text-accent-foreground" />
            </div>
            <span className="truncate">Quick Notes</span>
            <Cloud className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground ml-1 shrink-0" />
          </CardTitle>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            size="sm"
            variant={isAdding ? 'secondary' : 'default'}
            className={cn(!isAdding ? 'gradient-accent' : '', 'h-7 sm:h-8 text-xs shrink-0')}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {isAdding ? 'Cancel' : 'Add'}
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge
            variant={filterCategory === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setFilterCategory(null)}
          >
            All
          </Badge>
          {noteCategories.map((cat) => (
            <Badge
              key={cat.name}
              variant={filterCategory === cat.name ? "default" : "outline"}
              className={cn(
                "cursor-pointer text-xs transition-all",
                filterCategory === cat.name && cat.color
              )}
              onClick={() => setFilterCategory(cat.name)}
            >
              {cat.name}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <div className="space-y-3 p-4 rounded-lg border bg-background animate-fade-in">
            <Input
              placeholder="Note title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={syncing}
            />
            <Textarea
              placeholder="Write your note..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              disabled={syncing}
            />
            
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" /> Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {noteCategories.map((cat) => (
                  <Badge
                    key={cat.name}
                    variant={selectedCategory === cat.name ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-xs",
                      selectedCategory === cat.name && cat.color
                    )}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {noteColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform",
                      color,
                      selectedColor === color && "scale-125 ring-2 ring-primary"
                    )}
                  />
                ))}
              </div>
              <Button onClick={addNote} size="sm" className="gradient-primary" disabled={syncing}>
                {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
          {filteredNotes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 col-span-2">
              {filterCategory ? `No ${filterCategory} notes yet.` : "No notes yet. Click \"Add\" to create one!"}
            </p>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "p-4 rounded-lg border transition-all animate-fade-in cursor-pointer hover:shadow-md hover:scale-[1.02]",
                  note.color
                )}
                onClick={() => openNoteDialog(note)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-[10px] px-1.5 py-0", getCategoryStyle(note.category || 'General'))}>
                        {note.category || 'General'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-foreground truncate">{note.title}</h4>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {new Date(note.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Note Detail/Edit Dialog */}
        <Dialog open={!!selectedNote} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="w-[90vw] max-w-md sm:max-w-lg h-auto max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-2">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Note title..."
                />
              ) : (
                <DialogTitle className="text-lg sm:text-xl font-display break-words pr-6">
                  {selectedNote?.title}
                </DialogTitle>
              )}
            </DialogHeader>
            
            {selectedNote && (
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Category Badge */}
                {!isEditing && (
                  <Badge className={cn("text-xs", getCategoryStyle(selectedNote.category || 'General'))}>
                    <Tag className="w-3 h-3 mr-1" />
                    {selectedNote.category || 'General'}
                  </Badge>
                )}

                {/* Category Selection in Edit Mode */}
                {isEditing && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Category
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {noteCategories.map((cat) => (
                        <Badge
                          key={cat.name}
                          variant={editCategory === cat.name ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer text-xs",
                            editCategory === cat.name && cat.color
                          )}
                          onClick={() => setEditCategory(cat.name)}
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content */}
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="resize-none"
                    placeholder="Write your note..."
                  />
                ) : (
                  <div className={cn("p-4 rounded-lg border min-h-[120px]", selectedNote.color)}>
                    <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                      {selectedNote.content || 'No content'}
                    </p>
                  </div>
                )}

                {/* Color Selection in Edit Mode */}
                {isEditing && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Color</label>
                    <div className="flex gap-2">
                      {noteColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setEditColor(color)}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 transition-transform",
                            color,
                            editColor === color && "scale-125 ring-2 ring-primary"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {!isEditing && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Created: {format(new Date(selectedNote.created_at), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Last updated: {format(new Date(selectedNote.updated_at), 'PPP p')}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setIsEditing(false)}
                        disabled={syncing}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gradient-primary"
                        onClick={updateNote}
                        disabled={syncing}
                      >
                        {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => deleteNote(selectedNote.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
