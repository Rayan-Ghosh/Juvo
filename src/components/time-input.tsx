'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { TimePicker } from './time-picker';
import { Button } from './ui/button';

interface TimeInputProps {
  id: string;
  value?: string;
  onChange: (id: string, value: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

const TimeInput = ({ id, value, onChange, icon, className }: TimeInputProps) => {
  const [hour, minute] = value?.split(':') || ['00', '00'];

  const date = new Date();
  date.setHours(parseInt(hour, 10));
  date.setMinutes(parseInt(minute, 10));

  const handleTimeChange = (newDate?: Date) => {
    if (newDate) {
      const newHour = newDate.getHours().toString().padStart(2, '0');
      const newMinute = newDate.getMinutes().toString().padStart(2, '0');
      onChange(id, `${newHour}:${newMinute}`);
    }
  };

  return (
    <TimePicker
      date={date}
      setDate={handleTimeChange}
      trigger={
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex w-full items-center gap-2">
            {icon || <Clock size={16} />}
            <span className="flex-1">{value ? `${hour}:${minute}` : 'Pick a time'}</span>
          </div>
        </Button>
      }
    />
  );
};

export default TimeInput;
