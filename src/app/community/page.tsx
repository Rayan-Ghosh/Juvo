
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, MessageSquare, PlusCircle } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { type CommunityPost } from '@/services/community';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PostFormDialog } from '@/components/community/post-form-dialog';

export default function CommunityPage() {
  useAuthGuard();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'communityPosts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<CommunityPost>(postsQuery);

  const getInitials = (anonymousId: string) => {
    return anonymousId.replace('anonymous_', '').substring(0, 2).toUpperCase();
  };
  
  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">Community Space</h1>
            <p className="text-muted-foreground">A safe place to share and support each other.</p>
          </div>
          {user && posts && posts.length > 0 && (
            <PostFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} userId={user.uid}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </PostFormDialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle>
                    <Link href={`/community/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">{getInitials(post.authorId)}</AvatarFallback>
                    </Avatar>
                    <span>Posted by {post.authorId}</span>
                    <span>•</span>
                    <span>
                      {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm">{post.content}</p>
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.replyCount || 0} replies</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
            <h3 className="text-xl font-semibold">It's quiet in here...</h3>
            <p className="text-muted-foreground mt-2">Be the first to start a conversation and share your story.</p>
            {user && (
                <PostFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} userId={user.uid}>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Post
                  </Button>
                </PostFormDialog>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
