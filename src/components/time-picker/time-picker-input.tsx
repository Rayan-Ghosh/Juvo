// src/components/time-picker/time-picker-input.tsx
'use client';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export type TimePeriod = 'AM' | 'PM';

interface TimePickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: 'hours' | 'minutes';
  date?: Date;
  setDate: (date?: Date) => void;
  onLeftFocus?: () => void;
  onRightFocus?: () => void;
}

export function hourToPeriod(hour: number) {
  if (hour === 0) return { hour: 12, period: 'AM' as TimePeriod };
  if (hour < 12) return { hour, period: 'AM' as TimePeriod };
  if (hour === 12) return { hour, period: 'PM' as TimePeriod };
  return { hour: hour - 12, period: 'PM' as TimePeriod };
}

export function periodToHour(hour: number, period: TimePeriod) {
  if (period === 'AM') {
    return hour === 12 ? 0 : hour; // 12 AM is 00 hours
  } else {
    // period === 'PM'
    return hour === 12 ? 12 : hour + 12; // 12 PM is 12 hours
  }
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ className, picker, date, setDate, onLeftFocus, onRightFocus, ...props }, ref) => {
    const [flag, setFlag] = React.useState<boolean>(false);
    const [period, setPeriod] = React.useState<TimePeriod>('PM');

    const calculatedValue = React.useMemo(() => {
      if (!date) return '00';
      if (picker === 'hours') {
        return hourToPeriod(date.getHours()).hour.toString().padStart(2, '0');
      }
      return date.getMinutes().toString().padStart(2, '0');
    }, [date, picker]);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const
       value = e.target.value;
      const newValue = parseInt(value, 10);
      if (isNaN(newValue)) return;

      if (picker === 'hours') {
        if (newValue > 12 || newValue < 1) return;
        const newDate = date ? new Date(date) : new Date();
        newDate.setHours(periodToHour(newValue, period));
        setDate(newDate);
      } else {
        if (newValue > 59 || newValue < 0) return;
        const newDate = date ? new Date(date) : new Date();
        newDate.setMinutes(newValue);
        setDate(newDate);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowRight') onRightFocus?.();
      if (e.key === 'ArrowLeft') onLeftFocus?.();
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        increment();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        decrement();
      }
      props.onKeyDown?.(e);
    };

    const increment = () => {
      const newDate = date ? new Date(date) : new Date();
      if (picker === 'hours') {
        newDate.setHours(newDate.getHours() + 1);
      } else {
        newDate.setMinutes(newDate.getMinutes() + 1);
      }
      setDate(newDate);
    };

    const decrement = () => {
      const newDate = date ? new Date(date) : new Date();
      if (picker === 'hours') {
        newDate.setHours(newDate.getHours() - 1);
      } else {
        newDate.setMinutes(newDate.getMinutes() - 1);
      }
      setDate(newDate);
    };

    React.useEffect(() => {
      if (date) {
        const { period: newPeriod } = hourToPeriod(date.getHours());
        setPeriod(newPeriod);
      }
    }, [date]);

    React.useEffect(() => {
      if (flag) {
        const timer = setTimeout(() => {
          setFlag(false);
        }, 800);
        return () => clearTimeout(timer);
      }
    }, [flag]);

    return (
      <div className={cn('relative flex items-center', picker === 'hours' ? 'justify-end' : '')}>
        <Input
          ref={ref}
          id={picker}
          className={cn(
            'h-12 w-[4.5rem] rounded-lg border-2 border-transparent bg-transparent text-center text-5xl font-bold text-foreground drop-shadow-sm focus:border-2 focus:border-primary focus:bg-background focus:text-primary focus-visible:ring-0',
            flag && 'border-primary bg-primary/10 text-primary',
            className
          )}
          value={calculatedValue}
          onChange={handleValueChange}
          onKeyDown={handleKeyDown}
          maxLength={2}
          {...props}
        />
        <div className="absolute -right-3.5 top-1/2 flex -translate-y-1/2 transform flex-col">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={increment}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={decrement}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

TimePickerInput.displayName = 'TimePickerInput';

export { TimePickerInput };
