
'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { handleGenerateAffirmation } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const AffirmationGenerator = () => {
  const [mood, setMood] = useState('');
  const [needs, setNeeds] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!mood || !needs) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter your current mood and needs.',
      });
      return;
    }

    setIsLoading(true);
    setAffirmation('');

    try {
      const result = await handleGenerateAffirmation({ mood, needs });
      setAffirmation(result.affirmation);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not generate affirmation. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
          <Label htmlFor="mood">What's your mood?</Label>
          <Input
            id="mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="e.g., Anxious, tired"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="needs">What do you need right now?</Label>
          <Input
            id="needs"
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
            placeholder="e.g., Confidence, peace"
          />
        </div>
      <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Generate Affirmation
      </Button>
      {affirmation && (
        <Card className="bg-primary/10 border-primary/20 mt-4">
            <CardContent className="p-4">
                <p className="text-center font-medium text-foreground">
                    "{affirmation}"
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AffirmationGenerator;
