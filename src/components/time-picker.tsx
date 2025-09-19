// src/components/time-picker.tsx
'use client';
import { Clock, CornerUpLeft } from 'lucide-react';
import * as React from 'react';
import { Label } from '@/components/ui/label';
import { TimePeriod, TimePickerInput, periodToHour, hourToPeriod } from './time-picker/time-picker-input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface TimePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  trigger?: React.ReactNode;
}

export function TimePicker({ date, setDate, trigger }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const [period, setPeriod] = React.useState<TimePeriod>('PM');
  
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (date) {
      const { period } = hourToPeriod(date.getHours());
      setPeriod(period);
    }
  }, [date]);

  const handleMinuteChange = (newMinute: number) => {
    const newDate = date ? new Date(date) : new Date();
    newDate.setMinutes(newMinute);
    setDate(newDate);
  }

  const handleHourChange = (newHour: number) => {
    const newDate = date ? new Date(date) : new Date();
    newDate.setHours(periodToHour(newHour, period));
    setDate(newDate);
  }

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    if(date) {
      const newDate = new Date(date);
      const newHour = periodToHour(date.getHours(), newPeriod);
      newDate.setHours(newHour);
      setDate(newDate);
    }
  }


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <Clock className="mr-2 h-4 w-4" />
            {date ? date.toLocaleTimeString() : 'Pick a time'}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="flex items-center gap-1 pb-4">
          <CornerUpLeft className="h-3.5 w-3.5" />
          <p className="text-xs font-semibold">Select Time</p>
        </div>
        <Tabs defaultValue="numbers" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="numbers" className="flex-1">
              Numbers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="numbers">
            <div className="time-picker-input-grid mt-4 grid-cols-2 items-center gap-y-2">
              <TimePickerInput
                picker="hours"
                date={date}
                setDate={setDate}
                ref={hourRef}
                onRightFocus={() => minuteRef.current?.focus()}
              />
              <TimePickerInput
                picker="minutes"
                date={date}
                setDate={setDate}
                ref={minuteRef}
                onLeftFocus={() => hourRef.current?.focus()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
