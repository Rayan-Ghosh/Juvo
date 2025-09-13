'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';

const BreathingExercise = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [text, setText] = useState('Start');
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAnimating) {
      // Initial state
      setText('Breathe In...');
      setAnimationClass('expand');

      // Sequence
      interval = setInterval(() => {
        setText((prevText) => {
          if (prevText === 'Breathe In...') {
            setAnimationClass('shrink');
            return 'Breathe Out...';
          } else {
            setAnimationClass('expand');
            return 'Breathe In...';
          }
        });
      }, 4000); // Duration of one cycle (expand/shrink)
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      // Reset to initial state when stopping
      setText('Start');
      setAnimationClass('');
    };
  }, [isAnimating]);

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      <div className="relative flex h-48 w-48 items-center justify-center">
        <div
          className={cn(
            'absolute h-full w-full rounded-full bg-primary/20',
            isAnimating ? animationClass : 'scale-50'
          )}
          style={{ transition: 'transform 4s ease-in-out' }}
        />
        <div className="z-10 text-center">
          <p className="text-lg font-semibold text-foreground">
            {isAnimating ? text : 'Ready?'}
          </p>
        </div>
      </div>
      <Button onClick={toggleAnimation} variant="outline" className="w-32">
        {isAnimating ? (
            <>
                <Pause className="mr-2 h-4 w-4" /> Pause
            </>
        ) : (
            <>
                <Play className="mr-2 h-4 w-4" /> Start
            </>
        )}
      </Button>
    </div>
  );
};

export default BreathingExercise;
