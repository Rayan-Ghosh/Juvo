
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitCommunityPost } from '@/app/actions';
import { ModerateCommunityPostInputSchema } from '@/app/types';

interface PostFormDialogProps {
  children: React.ReactNode;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostFormDialog({ children, userId, open, onOpenChange }: PostFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof ModerateCommunityPostInputSchema>>({
    resolver: zodResolver(ModerateCommunityPostInputSchema),
    defaultValues: { title: '', content: '' },
  });

  const handleFormSubmit = async (values: z.infer<typeof ModerateCommunityPostInputSchema>) => {
    setIsLoading(true);
    try {
      const result = await submitCommunityPost(values, userId);
      if (result.isApproved) {
        toast({
          title: 'Post Submitted!',
          description: 'Your post is now live in the community.',
        });
        form.reset();
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Post Rejected',
          description: result.reason || 'Your post could not be approved at this time.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not submit your post. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
          <DialogDescription>
            Share what's on your mind. Your post will be anonymous and reviewed before appearing in the community.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="A clear and concise title for your post" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What would you like to share?</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Share your story, ask a question, or offer support..." {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Post
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
