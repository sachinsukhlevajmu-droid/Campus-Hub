import { useState } from 'react';
import { Calculator as CalculatorIcon, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(display);
    } else if (operation) {
      const currentValue = parseFloat(previousValue);
      let result: number;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '×':
          result = currentValue * inputValue;
          break;
        case '÷':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        default:
          result = inputValue;
      }

      const resultString = String(parseFloat(result.toFixed(10)));
      setDisplay(resultString);
      setPreviousValue(resultString);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    const currentValue = parseFloat(previousValue);
    let result: number;

    switch (operation) {
      case '+':
        result = currentValue + inputValue;
        break;
      case '-':
        result = currentValue - inputValue;
        break;
      case '×':
        result = currentValue * inputValue;
        break;
      case '÷':
        result = inputValue !== 0 ? currentValue / inputValue : 0;
        break;
      default:
        result = inputValue;
    }

    setDisplay(String(parseFloat(result.toFixed(10))));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const percentage = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const buttonClass = "h-10 sm:h-12 text-base sm:text-lg font-medium transition-all";
  const numberClass = `${buttonClass} bg-secondary hover:bg-secondary/80`;
  const operatorClass = `${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90`;
  const functionClass = `${buttonClass} bg-muted hover:bg-muted/80`;

  return (
    <Card className="gradient-card border shadow-soft hover-lift">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="font-display flex items-center gap-2 text-sm sm:text-base">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center">
            <CalculatorIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
          </div>
          Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="bg-muted/50 rounded-xl p-3 sm:p-4 text-right">
          {previousValue && operation && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              {previousValue} {operation}
            </p>
          )}
          <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">
            {display}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <Button className={functionClass} onClick={clear}>
            AC
          </Button>
          <Button className={functionClass} onClick={toggleSign}>
            ±
          </Button>
          <Button className={functionClass} onClick={percentage}>
            %
          </Button>
          <Button className={operatorClass} onClick={() => performOperation('÷')}>
            ÷
          </Button>

          <Button className={numberClass} onClick={() => inputDigit('7')}>
            7
          </Button>
          <Button className={numberClass} onClick={() => inputDigit('8')}>
            8
          </Button>
          <Button className={numberClass} onClick={() => inputDigit('9')}>
            9
          </Button>
          <Button className={operatorClass} onClick={() => performOperation('×')}>
            ×
          </Button>

          <Button className={numberClass} onClick={() => inputDigit('4')}>
            4
          </Button>
          <Button className={numberClass} onClick={() => inputDigit('5')}>
            5
          </Button>
          <Button className={numberClass} onClick={() => inputDigit('6')}>
            6
          </Button>
          <Button className={operatorClass} onClick={() => performOperation('-')}>
            −
          </Button>

          <Button className={numberClass} onClick={() => inputDigit('1')}>
            1
          </Button>
          <Button className={numberClass} onClick={() => inputDigit('2')}>
            2
          </Button>
          <Button className={numberClass} onClick={() => inputDigit('3')}>
            3
          </Button>
          <Button className={operatorClass} onClick={() => performOperation('+')}>
            +
          </Button>

          <Button className={`${numberClass} col-span-2`} onClick={() => inputDigit('0')}>
            0
          </Button>
          <Button className={numberClass} onClick={inputDecimal}>
            .
          </Button>
          <Button className={operatorClass} onClick={calculate}>
            =
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
