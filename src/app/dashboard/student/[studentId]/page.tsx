
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Shield, Activity, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';

// Mock data fetching. In a real app, this would fetch from Firestore.
const mockStudents: { [key: string]: any } = {
  stu1: {
    id: 'stu1',
    name: 'Isha Sharma',
    email: 'isha.s@university.edu',
    class: 'B.Tech CSE',
    aaparId: '1234-5678-9012',
    gender: 'Female',
    sessions: 12,
    lastSession: '2 days ago',
    status: 'Active',
    moodHistory: [
      { name: 'Mon', mood: 7 },
      { name: 'Tue', mood: 5 },
      { name: 'Wed', mood: 8 },
      { name: 'Thu', mood: 6 },
      { name: 'Fri', mood: 7 },
      { name: 'Sat', mood: 9 },
      { name: 'Sun', mood: 8 },
    ],
  },
  stu2: {
    id: 'stu2',
    name: 'Kabir Mehta',
    email: 'kabir.m@university.edu',
    class: 'B.A. Psychology',
    aaparId: '2345-6789-0123',
    gender: 'Male',
    sessions: 0,
    lastSession: 'Never',
    status: 'Active',
    moodHistory: [],
  },
  stu3: {
    id: 'stu3',
    name: 'Alia Khan',
    email: 'alia.k@university.edu',
    class: 'B.Com Hons',
    aaparId: '3456-7890-1234',
    gender: 'Female',
    sessions: 5,
    lastSession: '1 week ago',
    status: 'Needs Check-in',
    moodHistory: [
      { name: 'Mon', mood: 4 },
      { name: 'Tue', mood: 6 },
      { name: 'Wed', mood: 5 },
      { name: 'Thu', mood: 3 },
      { name: 'Fri', mood: 4 },
      { name: 'Sat', mood: 5 },
      { name: 'Sun', mood: 6 },
    ],
  },
};

export default function StudentDetailPage() {
  useAuthGuard();
  const params = useParams();
  const studentId = params.studentId as string;
  const student = mockStudents[studentId];

  if (!student) {
    return (
      <AppShell>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Student not found</h2>
          <p className="text-muted-foreground">The student profile could not be located.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Student Profile */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{student.name}</CardTitle>
                <CardDescription>{student.class}</CardDescription>
                <Badge 
                    variant={student.status === 'Active' ? 'secondary' : 'destructive'} 
                    className={student.status === 'Active' ? "bg-green-100 text-green-800 mt-2" : "bg-yellow-100 text-yellow-800 mt-2"}
                >
                  {student.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{student.gender}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>AAPAR ID: {student.aaparId}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Activity and Stats */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Usage Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
                  <p className="text-3xl font-bold">{student.sessions}</p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-lg">
                  <p className="text-lg font-semibold">{student.lastSession}</p>
                  <p className="text-sm text-muted-foreground">Last Session</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Mood History
                </CardTitle>
                <CardDescription>
                  A score from 1 (low) to 10 (high) based on chat interactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {student.moodHistory.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={student.moodHistory}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                        <Tooltip
                            contentStyle={{
                                background: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                            }}
                        />
                        <Bar dataKey="mood" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-10">No mood data available for this student yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
