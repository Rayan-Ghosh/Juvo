
'use client';

import React from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Phone, Users, MessageSquare, ExternalLink } from 'lucide-react';
import type { Friend } from '@/services/friends';

interface CrisisOptionsProps {
  friends: Friend[];
  onDismiss: () => void;
}

const CrisisOptions = ({ friends, onDismiss }: CrisisOptionsProps) => {
  const handleCallFriend = (friend: Friend) => {
    if (friend.phone) {
      window.location.href = `tel:${friend.phone}`;
    } else {
      // Fallback to email if no phone number is available
      window.location.href = `mailto:${friend.email}`;
    }
  };
  
  const hasFriends = friends && friends.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-2 max-w-md">
       <Button
        variant="destructive"
        className="justify-start bg-red-600 hover:bg-red-700 text-white"
        asChild
      >
        <a href="https://telemanas.mohfw.gov.in/" target="_blank" rel="noopener noreferrer">
          <Phone className="mr-2 h-4 w-4" />
          Call Tele-MANAS (1-800-891-4416)
        </a>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-start" disabled={!hasFriends}>
            <Users className="mr-2 h-4 w-4" />
            Call a Friend
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {hasFriends ? (
            friends.map((friend) => (
              <DropdownMenuItem key={friend.id} onSelect={() => handleCallFriend(friend)}>
                Call {friend.name} {friend.phone ? `(${friend.phone})` : ''}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No friends added</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" className="justify-start" onClick={onDismiss}>
        <MessageSquare className="mr-2 h-4 w-4" />
        Continue Chat
      </Button>
    </div>
  );
};

export default CrisisOptions;
