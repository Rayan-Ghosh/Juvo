'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { type CommunityPost, type CommunityReply } from '@/services/community';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ReplyForm } from '@/components/community/reply-form';

export default function PostDetailPage() {
  useAuthGuard();
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const postId = params.postId as string;

  const postRef = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return doc(firestore, 'communityPosts', postId);
  }, [firestore, postId]);

  const repliesQuery = useMemoFirebase(() => {
    if (!firestore || !postId) return null;
    return query(collection(firestore, 'communityPosts', postId, 'replies'), orderBy('createdAt', 'asc'));
  }, [firestore, postId]);

  const { data: post, isLoading: isPostLoading } = useDoc<CommunityPost>(postRef);
  const { data: replies, isLoading: areRepliesLoading } = useCollection<CommunityReply>(repliesQuery);

  const getInitials = (anonymousId: string) => {
    return anonymousId.replace('anonymous_', '').substring(0, 2).toUpperCase();
  };

  if (isPostLoading || areRepliesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Post not found</h2>
          <p className="text-muted-foreground">This post may have been deleted or the link is incorrect.</p>
          <Button asChild className="mt-4">
            <Link href="/community">Back to Community</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl py-8">
        <Link href="/community" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{post.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{getInitials(post.authorId)}</AvatarFallback>
              </Avatar>
              <span>Posted by {post.authorId}</span>
              <span>•</span>
              <span>
                {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{post.content}</p>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Replies ({replies?.length ?? 0})</h3>
          <div className="space-y-4">
            {replies && replies.length > 0 ? (
              replies.map((reply) => (
                <Card key={reply.id} className="bg-secondary">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(reply.authorId)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{reply.authorId}</span>
                          <span>•</span>
                          <span>
                            {reply.createdAt
                              ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true })
                              : 'Just now'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{reply.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Be the first one to offer support.
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
            {user && <ReplyForm postId={postId} userId={user.uid} />}
        </div>
      </div>
    </AppShell>
  );
}
