'use client';

import { Timestamp } from 'firebase/firestore';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  authorId: string; // This will be an anonymized ID
  createdAt: Timestamp;
  replyCount: number;
}

export interface CommunityReply {
  id: string;
  content: string;
  authorId: string; // Anonymized
  createdAt: Timestamp;
}
