'use client';

import { useState } from 'react';
import { format } from 'date-fns';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mail, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RequestSessionDialogProps {
  counselorEmail: string;
  userName: string;
}

export function RequestSessionDialog({ counselorEmail, userName }: RequestSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preferredTime, setPreferredTime] = useState('');
  const [alternateTime, setAlternateTime] = useState('');
  const { toast } = useToast();

  const handleSendRequest = () => {
    if (!preferredTime) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a preferred time for the session.',
      });
      return;
    }

    const formatDateTime = (dateTimeString: string) => {
      if (!dateTimeString) return 'Not specified';
      return format(new Date(dateTimeString), "eeee, MMMM d, yyyy 'at' h:mm a");
    };

    const subject = `Counseling Session Request from ${userName}`;
    const body = `
Hi,

I would like to request a counseling session.

Preferred Time: ${formatDateTime(preferredTime)}
Alternate Time: ${formatDateTime(alternateTime)}

Please let me know what time works for you.

Thank you,
${userName}
    `.trim();

    window.location.href = `mailto:${counselorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setIsOpen(false);
    setPreferredTime('');
    setAlternateTime('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Mail className="mr-2 h-4 w-4" />
          Request a Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request a Counseling Session</DialogTitle>
          <DialogDescription>
            Select your preferred and alternate times for the session. This will open your email client to send the request.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preferred-time" className="text-right">
              Preferred
            </Label>
            <Input
              id="preferred-time"
              type="datetime-local"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="alternate-time" className="text-right">
              Alternate
            </Label>
            <Input
              id="alternate-time"
              type="datetime-local"
              value={alternateTime}
              onChange={(e) => setAlternateTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendRequest}>Send Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
