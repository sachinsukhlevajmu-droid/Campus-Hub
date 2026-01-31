import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, Trash2, TrendingDown, DollarSign, Cloud, Loader2 } from 'lucide-react';

interface Expense {
  id: string;
  description: string | null;
  amount: number;
  category: string;
  date: string;
}

const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: 'bg-accent' },
  { name: 'Books', icon: '📚', color: 'bg-primary' },
  { name: 'Entertainment', icon: '🎮', color: 'bg-secondary' },
  { name: 'Transport', icon: '🚌', color: 'bg-success' },
  { name: 'Supplies', icon: '✏️', color: 'bg-warning' },
  { name: 'Other', icon: '📦', color: 'bg-muted-foreground' },
];

export function ExpenseTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(500);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // Fetch expenses and settings from database
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch current month's expenses
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', `${currentMonth}-01`)
        .order('date', { ascending: false });

      if (expenseError) {
        toast({
          title: "Error loading expenses",
          description: expenseError.message,
          variant: "destructive",
        });
      } else {
        setExpenses(expenseData || []);
      }

      // Fetch user settings for budget
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('monthly_budget')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData?.monthly_budget) {
        setMonthlyBudget(Number(settingsData.monthly_budget));
      }

      setLoading(false);
    };

    fetchData();
  }, [user, toast]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = monthlyBudget - totalSpent;
  const spentPercentage = Math.min((totalSpent / monthlyBudget) * 100, 100);

  // Group expenses by category
  const expensesByCategory = CATEGORIES.map(cat => {
    const catExpenses = expenses.filter(e => e.category === cat.name);
    const total = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { ...cat, total, expenses: catExpenses };
  }).filter(cat => cat.total > 0);

  const addExpense = async () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0 || !user) return;

    setSyncing(true);
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding expense",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setExpenses([data, ...expenses]);
      setDescription('');
      setAmount('');
      setShowAddExpense(false);
    }
    setSyncing(false);
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting expense",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const updateBudget = async (newLimit: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        monthly_budget: newLimit,
      });

    if (error) {
      toast({
        title: "Error updating budget",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMonthlyBudget(newLimit);
    }
    setEditingBudget(false);
    setNewBudgetLimit('');
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Expenses
            <Cloud className="w-4 h-4 text-muted-foreground" />
          </CardTitle>
          <Button 
            size="sm" 
            variant={showAddExpense ? "secondary" : "default"}
            onClick={() => setShowAddExpense(!showAddExpense)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Overview */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Budget</p>
              {editingBudget ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={newBudgetLimit}
                    onChange={(e) => setNewBudgetLimit(e.target.value)}
                    className="w-24 h-8"
                    placeholder={monthlyBudget.toString()}
                  />
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (parseFloat(newBudgetLimit) > 0) {
                        updateBudget(parseFloat(newBudgetLimit));
                      } else {
                        setEditingBudget(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <p 
                  className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setEditingBudget(true)}
                >
                  ${monthlyBudget.toFixed(2)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${remaining.toFixed(2)}
              </p>
            </div>
          </div>
          
          <Progress 
            value={spentPercentage} 
            className={`h-2 ${spentPercentage > 90 ? '[&>div]:bg-destructive' : spentPercentage > 70 ? '[&>div]:bg-warning' : ''}`}
          />
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingDown className="w-3 h-3" />
              Spent: ${totalSpent.toFixed(2)}
            </span>
            <span className="text-muted-foreground">
              {spentPercentage.toFixed(0)}% used
            </span>
          </div>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="p-4 bg-muted/20 rounded-lg space-y-3 border border-border/50">
            <Input
              placeholder="What did you spend on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={syncing}
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  step="0.01"
                  min="0"
                  disabled={syncing}
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-md text-sm min-w-[120px]"
                disabled={syncing}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full" onClick={addExpense} disabled={syncing}>
              {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Expense
            </Button>
          </div>
        )}

        {/* Category Breakdown */}
        {expensesByCategory.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">By Category</p>
            {expensesByCategory.map(cat => (
              <div key={cat.name} className="p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium">${cat.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Expenses */}
        {expenses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Recent</p>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {expenses.slice(0, 5).map(expense => {
                const cat = CATEGORIES.find(c => c.name === expense.category);
                return (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-2 bg-muted/20 rounded-lg group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">{cat?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`${cat?.color} text-primary-foreground text-xs`}>
                        ${Number(expense.amount).toFixed(2)}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteExpense(expense.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {expenses.length === 0 && !showAddExpense && (
          <div className="text-center py-6 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No expenses this month</p>
            <p className="text-sm">Click + to add your first expense!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
