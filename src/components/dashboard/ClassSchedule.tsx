import { useState } from 'react';
import { Plus, Trash2, Clock, MapPin, User, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ClassSchedule as ClassScheduleType } from '@/types/dashboard';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const COLORS = [
  'bg-primary',
  'bg-success',
  'bg-accent',
  'bg-warning',
  'bg-secondary',
  'bg-muted-foreground',
  'bg-destructive',
];

export const ClassSchedule = () => {
  const [classes, setClasses] = useLocalStorage<ClassScheduleType[]>('student-classes', []);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');
  
  const [newClass, setNewClass] = useState({
    name: '',
    instructor: '',
    room: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    color: COLORS[0],
  });

  const addClass = () => {
    if (!newClass.name.trim()) return;
    
    const classItem: ClassScheduleType = {
      id: Date.now().toString(),
      ...newClass,
    };
    
    setClasses([...classes, classItem]);
    setNewClass({
      name: '',
      instructor: '',
      room: '',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
    setIsOpen(false);
  };

  const deleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  const todayClasses = classes
    .filter(c => c.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <Card className="gradient-card border shadow-soft hover-lift h-full">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="font-display flex items-center gap-2 text-sm sm:text-base">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <span className="truncate">Class Schedule</span>
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary">
                <Plus className="w-4 h-4 mr-1" /> Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Class name (e.g., Calculus II)"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                />
                <Input
                  placeholder="Instructor"
                  value={newClass.instructor}
                  onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                />
                <Input
                  placeholder="Room (e.g., Room 101)"
                  value={newClass.room}
                  onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                />
                <Select
                  value={newClass.day}
                  onValueChange={(v) => setNewClass({ ...newClass, day: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Start Time</label>
                    <Input
                      type="time"
                      value={newClass.startTime}
                      onChange={(e) => setNewClass({ ...newClass, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">End Time</label>
                    <Input
                      type="time"
                      value={newClass.endTime}
                      onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewClass({ ...newClass, color })}
                        className={cn(
                          "w-8 h-8 rounded-full transition-transform",
                          color,
                          newClass.color === color && "scale-125 ring-2 ring-primary ring-offset-2"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={addClass} className="w-full gradient-primary">
                  Add Class
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {DAYS.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedDay(day)}
              className={cn(
                "text-xs shrink-0",
                selectedDay === day && "gradient-primary"
              )}
            >
              {day.slice(0, 3)}
            </Button>
          ))}
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {todayClasses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No classes on {selectedDay}
            </p>
          ) : (
            todayClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="flex items-center gap-3 p-4 rounded-lg border bg-background/50 animate-fade-in"
              >
                <div className={cn("w-1 h-14 rounded-full", classItem.color)} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-foreground">{classItem.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {classItem.startTime} - {classItem.endTime}
                    </span>
                    {classItem.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {classItem.room}
                      </span>
                    )}
                    {classItem.instructor && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {classItem.instructor}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteClass(classItem.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
