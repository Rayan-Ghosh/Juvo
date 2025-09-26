
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitCommunityReply } from '@/app/actions';
import { ModerateCommunityReplyInputSchema } from '@/app/types';

interface ReplyFormProps {
  postId: string;
  userId: string;
}

export function ReplyForm({ postId, userId }: ReplyFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof ModerateCommunityReplyInputSchema>>({
    resolver: zodResolver(ModerateCommunityReplyInputSchema),
    defaultValues: { replyContent: '' },
  });

  const handleFormSubmit = async (values: z.infer<typeof ModerateCommunityReplyInputSchema>) => {
    setIsLoading(true);
    try {
      const result = await submitCommunityReply(values, postId, userId);
      if (result.isApproved) {
        toast({
          title: 'Reply Submitted',
          description: 'Your reply is now live.',
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Reply Rejected',
          description: result.reason || 'Your reply could not be approved at this time.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not submit your reply. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="replyContent"
          render={({ field }) => (
            <FormItem>
              <Textarea
                placeholder="Offer your support or share your thoughts..."
                {...field}
                rows={4}
                className="bg-background"
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Reply
          </Button>
        </div>
      </form>
    </Form>
  );
}
