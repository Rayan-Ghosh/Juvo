
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveVitals, Vitals } from '@/services/vitals';
import { useFirestore } from '@/firebase';

interface AddVitalsDialogProps {
  children: React.ReactNode;
  userId: string;
  onVitalsSaved: (vitals: Vitals) => void;
}

const vitalsSchema = z.object({
  bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/, { message: "Must be in format like '120/80'" }),
  spo2: z.coerce.number().min(80, "Value must be above 80").max(100, "Value must be 100 or less"),
  stress: z.coerce.number().min(0, "Value must be 0 or more").max(100, "Value must be 100 or less"),
});

export function AddVitalsDialog({ children, userId, onVitalsSaved }: AddVitalsDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof vitalsSchema>>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: { bp: '', spo2: 98, stress: 50 },
  });

  const handleFormSubmit = async (values: z.infer<typeof vitalsSchema>) => {
    setIsLoading(true);
    try {
        if (!firestore) throw new Error("Firestore not available");
        
        await saveVitals(firestore, userId, values);
        
        toast({
            title: 'Vitals Saved!',
            description: 'Your daily health vitals have been recorded.',
        });

        onVitalsSaved(values);
        setIsOpen(false);
        form.reset();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not save your vitals. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Today's Vitals</DialogTitle>
          <DialogDescription>
            Enter your health metrics for today. This information helps provide better insights.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="bp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Pressure (Systolic/Diastolic)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 120/80" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spo2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Oxygen (SpO2 %)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 98" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stress Level (0-100)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Vitals
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
