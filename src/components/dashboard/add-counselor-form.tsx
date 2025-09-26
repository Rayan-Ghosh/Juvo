
'use client';

import { useRef, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCounselorAccount } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Invite Counselor
    </Button>
  );
}

interface AddCounselorFormProps {
  institutionId: string;
}

export function AddCounselorForm({ institutionId }: AddCounselorFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleAction = async (formData: FormData) => {
    const result = await createCounselorAccount(formData, institutionId);

    if (result.success) {
      toast({
        title: 'Invitation Sent!',
        description: result.message,
      });
      formRef.current?.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: result.message,
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Invite New Counselor</CardTitle>
        <CardDescription>
          Enter the details for the new counselor. They will be invited to create an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="e.g., Dr. Jane Smith" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="e.g., jane.smith@university.edu" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input id="employeeId" name="employeeId" placeholder="e.g., E12345" required />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
