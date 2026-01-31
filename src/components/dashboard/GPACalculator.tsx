import { useState } from 'react';
import { Plus, Trash2, Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Grade } from '@/types/dashboard';

const GRADES = [
  { letter: 'A+', points: 4.0 },
  { letter: 'A', points: 4.0 },
  { letter: 'A-', points: 3.7 },
  { letter: 'B+', points: 3.3 },
  { letter: 'B', points: 3.0 },
  { letter: 'B-', points: 2.7 },
  { letter: 'C+', points: 2.3 },
  { letter: 'C', points: 2.0 },
  { letter: 'C-', points: 1.7 },
  { letter: 'D+', points: 1.3 },
  { letter: 'D', points: 1.0 },
  { letter: 'F', points: 0.0 },
];

export const GPACalculator = () => {
  const [grades, setGrades] = useLocalStorage<Grade[]>('student-grades', []);
  const [newCourse, setNewCourse] = useState('');
  const [newCredits, setNewCredits] = useState('3');
  const [newGrade, setNewGrade] = useState('A');
  const [newSemester, setNewSemester] = useState('Current');

  const addGrade = () => {
    if (!newCourse.trim()) return;
    
    const grade: Grade = {
      id: Date.now().toString(),
      courseName: newCourse,
      credits: parseInt(newCredits) || 3,
      grade: newGrade,
      semester: newSemester,
    };
    
    setGrades([...grades, grade]);
    setNewCourse('');
  };

  const deleteGrade = (id: string) => {
    setGrades(grades.filter(g => g.id !== id));
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    grades.forEach((grade) => {
      const gradeInfo = GRADES.find(g => g.letter === grade.grade);
      if (gradeInfo) {
        totalPoints += gradeInfo.points * grade.credits;
        totalCredits += grade.credits;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return 'text-success';
    if (gpa >= 3.0) return 'text-primary';
    if (gpa >= 2.0) return 'text-warning';
    return 'text-destructive';
  };

  const gpa = parseFloat(calculateGPA().toString());

  return (
    <Card className="gradient-card border shadow-soft hover-lift h-full">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="font-display flex items-center gap-2 text-sm sm:text-base">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg gradient-success flex items-center justify-center shrink-0">
            <Calculator className="w-3 h-3 sm:w-4 sm:h-4 text-success-foreground" />
          </div>
          <span className="truncate">GPA Calculator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-6 rounded-xl gradient-hero">
          <p className="text-sm text-muted-foreground mb-1">Current GPA</p>
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className={`w-6 h-6 ${getGPAColor(gpa)}`} />
            <p className={`text-5xl font-bold ${getGPAColor(gpa)}`}>
              {gpa || '0.00'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on {grades.length} course{grades.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Course name"
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <Select value={newCredits} onValueChange={setNewCredits}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Credits" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((c) => (
                  <SelectItem key={c} value={c.toString()}>
                    {c} credit{c > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newGrade} onValueChange={setNewGrade}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g.letter} value={g.letter}>
                    {g.letter} ({g.points})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addGrade} className="gradient-primary">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {grades.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Add courses to calculate your GPA
            </p>
          ) : (
            grades.map((grade) => (
              <div
                key={grade.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background/50 animate-fade-in"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate text-foreground">{grade.courseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {grade.credits} credits
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">{grade.grade}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteGrade(grade.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
