

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import { AppShell } from "@/components/app-shell";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useUser, useFirestore } from "@/firebase";
import { getUserProfile, UserProfile, saveUserProfile } from "@/services/profile";
import { saveMoodLog, getWeeklyMood, MoodEntry, getMoodForLast48Hours } from "@/services/mood";
import { getTodaysVitals, Vitals, saveVitals } from "@/services/vitals";
import { isToday, format, differenceInDays } from 'date-fns';
import { Loader2, Users, Shield, CalendarCheck, Activity, BarChart2, UserPlus, Search, MoreHorizontal, FileText, Download, Wallet, Clock, CheckCircle, XCircle, HeartPulse, Droplets, Wind, Watch, Plus, Scale, Bed, Sparkles, CalendarIcon, Play, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from '@/components/ui/skeleton';
import AffirmationGenerator from "@/components/affirmation-generator";
import FoodDiary from "@/components/dashboard/food-diary";
import { AddVitalsDialog } from "@/components/dashboard/add-vitals-dialog";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, CartesianGrid } from 'recharts';
import SleepTracker from "@/components/dashboard/sleep-tracker";
import { MenstrualCycleLog, saveCycleLog } from "@/services/cycle";
import { useToast } from "@/hooks/use-toast";
import { handleCycleInsight, handleSleepStressAnalysis } from "../actions";
import { Alert, AlertDescription } from "@/components/ui/alert";

const moodColors: { [key: number]: string } = { 1: 'hsl(var(--chart-5))', 2: 'hsl(var(--chart-4))', 3: 'hsl(var(--chart-3))', 4: 'hsl(var(--chart-2))', 5: 'hsl(var(--chart-1))', 0: 'hsl(var(--muted))' };

const moodOptions = [
    { level: 5, label: 'Happy' },
    { level: 4, label: 'Good' },
    { level: 3, label: 'Okay' },
    { level: 2, label: 'Stressed' },
    { level: 1, label: 'Anxious' },
];

const WeeklyMoodChart = ({ moodHistory, isLoading }: { moodHistory: MoodEntry[], isLoading: boolean }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Weekly Mood Journey</CardTitle>
                <CardDescription>Visualizing your mood patterns from the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="w-full h-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={moodHistory} 
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                domain={[0, 5]} 
                                tickCount={6} 
                                tickFormatter={(value) => {
                                    if (value === 0) return '';
                                    return moodOptions.find(m => m.level === value)?.label || ''
                                }}
                                tickLine={false} 
                                axisLine={false}
                                width={70}
                            />
                            <RechartsTooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: 'var(--radius)',
                                }}
                                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: '600' }}
                                formatter={(value: number) => {
                                  const moodLabel = moodOptions.find(m => m.level === value)?.label || 'Not Logged';
                                  return [moodLabel, 'Mood'];
                                }}
                                cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                            />
                            <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
                                {moodHistory.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={moodColors[entry.mood] || moodColors[0]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
};


// --- MOCK DATA ---
const studentTrafficData = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  students: Math.floor(Math.random() * (300 - 150 + 1)) + 150,
}));
const counselorsData = [
  { id: 'c1', name: 'Dr. Ananya Sharma', employeeId: 'E4567', status: 'Available', sessions: 25 },
  { id: 'c2', name: 'Dr. Rohan Verma', employeeId: 'E8910', status: 'Busy', sessions: 42 },
  { id: 'c3', name: 'Dr. Priya Singh', employeeId: 'E1112', status: 'Available', sessions: 18 },
];
const studentsData = [
    { id: 's1', name: 'Aarav Gupta', email: 'aarav.g@university.edu', aaparVerified: 'Yes', status: 'Active' },
    { id: 's2', name: 'Saanvi Patel', email: 'saanvi.p@university.edu', aaparVerified: 'Yes', status: 'Blocked' },
    { id: 's3', name: 'Vivaan Reddy', email: 'vivaan.r@university.edu', aaparVerified: 'No', status: 'Active' },
    { id: 's4', name: 'Diya Kumar', email: 'diya.k@university.edu', aaparVerified: 'Yes', status: 'Active' },
];
const expenseData = [
    { counselor: 'Dr. Ananya Sharma', amount: '₹1500' },
    { counselor: 'Dr. Rohan Verma', amount: '₹2000' },
    { counselor: 'Dr. Priya Singh', amount: '₹1800' },
];
const adminStudentsData = [
  { id: "stu1", name: "Isha Sharma", class: "B.Tech CSE", lastSession: "2 days ago", status: "Active" },
  { id: "stu2", name: "Kabir Mehta", class: "B.A. Psychology", lastSession: "Never", status: "Active" },
  { id: "stu3", name: "Alia Khan", class: "B.Com Hons", lastSession: "1 week ago", status: "Needs Check-in" },
];
const adminBookingRequests = [
  { id: "req1", studentName: "Rohan Joshi", requestedTime: "Tomorrow, 3:00 PM" },
  { id: "req2", studentName: "Priya Das", requestedTime: "Sep 28, 11:00 AM" },
];
const adminTodaysSchedule = [
  { id: "ses1", studentName: "Isha Sharma", time: "10:30 AM", status: "Upcoming" },
  { id: "ses2", name: "Arjun Rao", time: "2:00 PM", status: "Upcoming" },
];

const moods = [
    { name: "Happy", emoji: "😊", score: 5 },
    { name: "Good", emoji: "🙂", score: 4 },
    { name: "Okay", emoji: "😐", score: 3 },
    { name: "Stressed", emoji: "😟", score: 2 },
    { name: "Anxious", emoji: "😰", score: 1 },
];



const StudentDashboard = ({ profile, userId }: { profile: UserProfile, userId: string }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [height, setHeight] = useState(profile.height || 170);
  const [weight, setWeight] = useState(profile.weight || 65);
  
  // Cycle State
  const [lastPeriodDate, setLastPeriodDate] = useState<Date | undefined>(profile.lastPeriodStartDate ? new Date(profile.lastPeriodStartDate) : undefined);
  const [cycleLength, setCycleLength] = useState(profile.cycleLength || 28);
  const [bleedingPhaseLength, setBleedingPhaseLength] = useState(profile.bleedingPhaseLength || 5);
  const [isSavingCycle, setIsSavingCycle] = useState(false);
  const [cycleInsight, setCycleInsight] = useState('');


  const [breathingState, setBreathingState] = useState('ready'); // ready, breathing, finished
  const [breathingStep, setBreathingStep] = useState('Ready?');
  const [countdown, setCountdown] = useState(0);
  
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isMoodHistoryLoading, setIsMoodHistoryLoading] = useState(true);
  const [todaysMood, setTodaysMood] = useState<{ mood: string; score: number } | null>(null);
  const [todaysMoodLogged, setTodaysMoodLogged] = useState(false);

  const [vitals, setVitals] = useState<Vitals | null>(null);
  const [isVitalsLoading, setIsVitalsLoading] = useState(true);

  
  const fetchDashboardData = useCallback(async () => {
    if (!userId || !firestore) return;

    setIsMoodHistoryLoading(true);
    setIsVitalsLoading(true);

    // Fetch mood data
    const weeklyData = await getWeeklyMood(firestore, userId);
    setMoodHistory(weeklyData);
    const todayLog = weeklyData.find(d => isToday(d.date));
    if (todayLog && todayLog.mood > 0) {
      const loggedMood = moods.find(m => m.score === todayLog.mood);
      if (loggedMood) {
          setTodaysMoodLogged(true);
          setSelectedMood(loggedMood.name);
          setTodaysMood({ mood: loggedMood.name, score: loggedMood.score });
      }
    }
    setIsMoodHistoryLoading(false);

    // Fetch vitals data
    const todaysVitals = await getTodaysVitals(firestore, userId);
    setVitals(todaysVitals);
    setIsVitalsLoading(false);

  }, [userId, firestore]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  useEffect(() => {
    const handler = setTimeout(() => {
        if (firestore && userId && (profile.height !== height || profile.weight !== weight)) {
            saveUserProfile(firestore, userId, { height, weight });
        }
    }, 500); // Debounce time in ms

    return () => {
        clearTimeout(handler);
    };
  }, [height, weight, firestore, userId, profile.height, profile.weight]);


  const handleMoodSelect = async (mood: { name: string; score: number }) => {
    if (!firestore || !userId || todaysMoodLogged) return;

    // Optimistic UI update
    setTodaysMoodLogged(true);
    setSelectedMood(mood.name);
    setTodaysMood({ mood: mood.name, score: mood.score });
    
    setMoodHistory(currentHistory => {
        return currentHistory.map(entry => {
            if (isToday(entry.date)) {
                return { ...entry, mood: mood.score };
            }
            return entry;
        });
    });

    try {
        await saveMoodLog(firestore, userId, { mood: mood.name, score: mood.score });
    } catch (error) {
        console.error("Failed to save mood log:", error);
        // Revert optimistic update on error
        fetchDashboardData(); 
    }
  };

  const handleSaveCycleData = async () => {
    if (!firestore || !userId) return;
    if (!lastPeriodDate) {
        toast({ title: "Missing Date", description: "Please select your last period start date.", variant: "destructive"});
        return;
    }
    if (!todaysMood) {
        toast({ title: "Missing Mood", description: "Please log your mood today to get an insight.", variant: "destructive"});
        return;
    }

    setIsSavingCycle(true);
    setCycleInsight('');

    const cycleData: Partial<MenstrualCycleLog> = {
      lastPeriodStartDate: lastPeriodDate.toISOString().split('T')[0],
      cycleLength,
      bleedingPhaseLength
    };

    try {
        await saveCycleLog(firestore, userId, cycleData);
        
        const dayOfCycle = differenceInDays(new Date(), lastPeriodDate) + 1;
        const result = await handleCycleInsight({ dayOfCycle, mood: todaysMood.mood });
        setCycleInsight(result.insight);

        toast({
            title: "Cycle Data Saved!",
            description: "Your menstrual cycle insight has been generated.",
        });
    } catch (error) {
        console.error("Error saving cycle data:", error);
        toast({ title: "Error", description: "Could not save cycle data or generate insight.", variant: "destructive"});
    } finally {
        setIsSavingCycle(false);
    }
  };

  const bmi = (weight > 0 && height > 0) ? (weight / ((height / 100) ** 2)).toFixed(1) : "0.0";
  const bmiValue = parseFloat(bmi);
  let bmiCategory = "Normal";
  let bmiColor = "bg-green-500";
  if (bmiValue < 18.5) {
    bmiCategory = "Underweight";
    bmiColor = "bg-blue-400";
  } else if (bmiValue >= 25 && bmiValue < 30) {
    bmiCategory = "Overweight";
    bmiColor = "bg-yellow-400";
  } else if (bmiValue >= 30) {
    bmiCategory = "Obese";
    bmiColor = "bg-red-500";
  }
  
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (breathingState === 'breathing') {
      const sequence = [
        { step: 'Breathe In...', duration: 4 },
        { step: 'Hold...', duration: 7 },
        { step: 'Breathe Out...', duration: 8 },
      ];

      let currentStepIndex = 0;
      
      const nextStep = () => {
        // Stop if state changed while timer was running
        if (document.querySelector('[data-breathing-state="ready"]')) return;

        const current = sequence[currentStepIndex];
        setBreathingStep(current.step);
        setCountdown(current.duration);

        let counter = current.duration;
        timer = setInterval(() => {
          counter--;
          setCountdown(counter);
          if (counter <= 0) {
            clearInterval(timer);
            currentStepIndex = (currentStepIndex + 1) % sequence.length;
            nextStep();
          }
        }, 1000);
      };

      nextStep();
    } else {
      setBreathingStep('Ready?');
      setCountdown(0);
    }
    
    return () => clearInterval(timer);
  }, [breathingState]);


  const handleBreathingClick = () => {
    if (breathingState === 'ready' || breathingState === 'finished') {
      setBreathingState('breathing');
    } else {
      setBreathingState('ready');
    }
  }

  const getAnimationClass = () => {
    switch(breathingStep) {
        case 'Breathe In...': return 'animate-inhale';
        case 'Hold...': return 'animate-hold';
        case 'Breathe Out...': return 'animate-exhale';
        default: return '';
    }
  }

  const handleVitalsSaved = (newVitals: Vitals) => {
    setVitals(newVitals);
  }

  return (
    <>
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>How are you feeling today?</CardTitle>
                    {todaysMoodLogged ? (
                       <CardDescription>You logged your mood as "{selectedMood}" today. See you tomorrow!</CardDescription>
                    ) : (
                       <CardDescription>Your daily check-in helps us understand your well-being.</CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {isMoodHistoryLoading ? <Skeleton className="h-24" /> : (
                        <div className="flex justify-around items-center">
                        {moods.map(mood => (
                            <button 
                            key={mood.name} 
                            onClick={() => handleMoodSelect(mood)} 
                            disabled={todaysMoodLogged}
                            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
                            >
                            <span className={cn("text-4xl p-3 rounded-full transition-all", 
                                selectedMood === mood.name ? "bg-primary/10 ring-2 ring-primary" : "grayscale",
                                todaysMoodLogged && selectedMood !== mood.name && "opacity-30"
                            )}>{mood.emoji}</span>
                            <span className={cn("text-sm", selectedMood === mood.name && "text-primary font-semibold")}>{mood.name}</span>
                            </button>
                        ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <WeeklyMoodChart moodHistory={moodHistory} isLoading={isMoodHistoryLoading} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                    Daily Vitals
                    <Watch className="text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>Keep track of your key health metrics.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isVitalsLoading ? <Skeleton className="h-24" /> : (
                        <>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HeartPulse className="text-red-500" />
                                <span className="font-medium">Blood Pressure</span>
                            </div>
                            <span className="font-mono">{vitals?.bp || '--/--'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Droplets className="text-blue-500" />
                                <span className="font-medium">SpO2</span>
                            </div>
                            <span className="font-mono">{vitals?.spo2 ? `${vitals.spo2}%` : '--%'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wind className="text-yellow-500" />
                                <span className="font-medium">Stress Level</span>
                            </div>
                            <span className="font-mono">{vitals?.stress ? `${vitals.stress}/100` : '--/100'}</span>
                            </div>
                        </>
                    )}
                    <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="w-full" onClick={fetchDashboardData}>
                        <Watch className="mr-2 h-4 w-4" /> Sync
                    </Button>
                    <AddVitalsDialog userId={userId} onVitalsSaved={handleVitalsSaved}>
                        <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Add</Button>
                    </AddVitalsDialog>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                    BMI Calculator
                    <Scale className="text-muted-foreground" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground">Your BMI is</p>
                        <p className="text-4xl font-bold">{bmi}</p>
                        <Badge className={cn("mt-2 text-white", bmiColor)}>{bmiCategory}</Badge>
                    </div>
                    <div>
                    <div className="flex justify-between text-sm">
                        <Label htmlFor="height">Height (cm)</Label>
                        <span>{height} cm</span>
                    </div>
                    <Slider id="height" value={[height]} onValueChange={(v) => setHeight(v[0])} max={220} min={120} step={1} />
                    </div>
                    <div>
                    <div className="flex justify-between text-sm">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <span>{weight} kg</span>
                    </div>
                    <Slider id="weight" value={[weight]} onValueChange={(v) => setWeight(v[0])} max={150} min={30} step={1} />
                    </div>
                </CardContent>
            </Card>
        </div>
     </div>

     {/* New Sections Below */}
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Food & Mood Diary */}
          <FoodDiary todaysMood={todaysMood} profile={profile} />
          
          {/* Circadian Health */}
          <SleepTracker />
        </div>

        <div className="lg:col-span-1 space-y-6">
          {profile.gender === 'female' && (
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="text-primary"/>
                    Menstrual Cycle Tracker
                </CardTitle>
                <CardDescription>Log your cycle for personalized insights.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="period-date">Last Period Start Date</Label>
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !lastPeriodDate && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {lastPeriodDate ? lastPeriodDate.toLocaleDateString() : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={lastPeriodDate}
                        onSelect={setLastPeriodDate}
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="cycle-length">Average Cycle Length (days)</Label>
                    <Input id="cycle-length" type="number" value={cycleLength} onChange={(e) => setCycleLength(Number(e.target.value))} />
                </div>
                <div>
                    <Label htmlFor="bleeding-length">Average Bleeding Length (days)</Label>
                    <Input id="bleeding-length" type="number" value={bleedingPhaseLength} onChange={(e) => setBleedingPhaseLength(Number(e.target.value))} />
                </div>
                <Button className="w-full bg-mint text-black hover:bg-mint/80" onClick={handleSaveCycleData} disabled={isSavingCycle}>
                    {isSavingCycle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Save & Get Insight
                </Button>
                {cycleInsight && (
                    <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertDescription className="ml-7">{cycleInsight}</AlertDescription>
                    </Alert>
                )}
                </CardContent>
            </Card>
          )}

          {/* Guided Breathing */}
          <Card className="flex flex-col items-center justify-center text-center p-6">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary"/>
                Guided Breathing
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6">
                 <div data-breathing-state={breathingState} className={cn("relative h-32 w-32 rounded-full bg-mint/20 flex items-center justify-center text-primary font-semibold text-lg", getAnimationClass())}>
                    <div className="flex flex-col items-center justify-center">
                        <span>{breathingStep}</span>
                        {breathingState === 'breathing' && <span className="text-2xl font-bold">{countdown}</span>}
                    </div>
                </div>
                <Button onClick={handleBreathingClick} className="bg-mint text-black hover:bg-mint/90">
                    {breathingState === 'breathing' ? 'Stop' : <><Play className="mr-2 h-4 w-4" /> Start</>}
                </Button>
            </CardContent>
          </Card>
        </div>
     </div>
     <Card className="mt-6">
        <Accordion type="single" collapsible>
            <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="p-6">
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    Affirmation Generator
                </CardTitle>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
                <AffirmationGenerator />
            </AccordionContent>
            </AccordionItem>
        </Accordion>
     </Card>
    </>
  );
};


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && firestore) {
        const userProfile = await getUserProfile(firestore, user.uid);
        setProfile(userProfile);
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, firestore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!profile || !user) {
     return (
      <AppShell>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Could not load profile.</h1>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </AppShell>
    );
  }
  
  // Render based on role
  switch(profile.role) {
    case 'institution':
      return (
        <AppShell>
            <div className="flex flex-col gap-8">
              <div>
                  <h1 className="text-3xl font-bold font-headline">Institute Dashboard</h1>
                  <p className="text-muted-foreground">Welcome back, {profile?.name || 'Institute Admin'}.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">1,254</div>
                          <p className="text-xs text-muted-foreground">+5% from last month</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Active Counselors</CardTitle>
                          <Shield className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">5</div>
                          <p className="text-xs text-muted-foreground">2 currently available</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Sessions this Month</CardTitle>
                          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">183</div>
                          <p className="text-xs text-muted-foreground">+22% from last month</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">API Status</CardTitle>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold text-green-600">Healthy</div>
                          <p className="text-xs text-muted-foreground">2.5M calls remaining</p>
                      </CardContent>
                  </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                      <Card className="h-[400px]">
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                  <BarChart2 className="h-5 w-5" />
                                  Student Traffic Overview (Last 30 Days)
                              </CardTitle>
                          </CardHeader>
                          <CardContent>
                              <div className="h-[300px]">
                                <div className="h-full w-full text-muted-foreground flex items-center justify-center">Chart placeholder</div>
                              </div>
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <div className="flex justify-between items-center">
                                  <div>
                                      <CardTitle>Counselor Management</CardTitle>
                                      <CardDescription>Modify, block, or delete counselor accounts.</CardDescription>
                                  </div>
                                  <Button asChild>
                                      <Link href="/add-counselor">
                                          <UserPlus className="mr-2 h-4 w-4" /> Add New Counselor
                                      </Link>
                                  </Button>
                              </div>
                          </CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Counselor Name</TableHead>
                                          <TableHead>Employee ID</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead className="text-right">Total Sessions</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {counselorsData.map((counselor) => (
                                          <TableRow key={counselor.id}>
                                              <TableCell className="font-medium">{counselor.name}</TableCell>
                                              <TableCell>{counselor.employeeId}</TableCell>
                                              <TableCell>
                                                  <Badge variant={counselor.status === 'Available' ? 'secondary' : 'default'} className={counselor.status === 'Available' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                      {counselor.status}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">{counselor.sessions}</TableCell>
                                              <TableCell className="text-right">
                                                  <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                                              <span className="sr-only">Open menu</span>
                                                              <MoreHorizontal className="h-4 w-4" />
                                                          </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                          <DropdownMenuItem>Edit</DropdownMenuItem>
                                                          <DropdownMenuItem className="text-red-600">Block</DropdownMenuItem>
                                                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                  </DropdownMenu>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <CardTitle>Student Management</CardTitle>
                              <CardDescription>Manage student accounts and view their status.</CardDescription>
                              <div className="relative pt-2">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="Search students by name or email..." className="pl-10" />
                              </div>
                          </CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Student Name</TableHead>
                                          <TableHead>Email</TableHead>
                                          <TableHead>AAPAAR Verified</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {studentsData.map((student) => (
                                          <TableRow key={student.id}>
                                              <TableCell className="font-medium">{student.name}</TableCell>
                                              <TableCell>{student.email}</TableCell>
                                              <TableCell>
                                                  <Badge variant={student.aaparVerified === 'Yes' ? 'secondary' : 'destructive'} className={student.aaparVerified === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                                                      {student.aaparVerified}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell>
                                                  <Badge variant={student.status === 'Active' ? 'secondary' : 'destructive'} className={student.status === 'Active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                                      {student.status}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                  <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                                              <span className="sr-only">Open menu</span>
                                                              <MoreHorizontal className="h-4 w-4" />
                                                          </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                          <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                                          <DropdownMenuItem className="text-red-600">
                                                              {student.status === 'Active' ? 'Block' : 'Unblock'}
                                                          </DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                  </DropdownMenu>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                  </div>
                  
                  <div className="lg:col-span-2 space-y-8">
                      <Card>
                          <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Monthly Counselor Expense Report
                              </CardTitle>
                              <CardDescription>Current billing cycle overview.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Counselor</TableHead>
                                          <TableHead className="text-right">Amount</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {expenseData.map((item, index) => (
                                          <TableRow key={index}>
                                              <TableCell className="font-medium">{item.counselor}</TableCell>
                                              <TableCell className="text-right">{item.amount}</TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                              <Button variant="outline" className="w-full mt-4">
                                  <Download className="mr-2 h-4 w-4" /> Download Full Report
                              </Button>
                          </CardContent>
                      </Card>

                      <Card>
                          <CardHeader>
                              <CardTitle>API Usage</CardTitle>
                              <CardDescription>Your current usage against your monthly limit.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <div>
                                  <div className="flex justify-between mb-1">
                                      <span className="text-sm font-medium text-muted-foreground">Monthly Usage</span>
                                      <span className="text-sm font-medium">72%</span>
                                  </div>
                                  <Progress value={72} />
                              </div>
                              <p className="text-sm text-muted-foreground">You have used 3.6M of your 5M API calls limit.</p>
                              <Button className="w-full" disabled={72 < 80}>
                                  Recharge API
                              </Button>
                          </CardContent>
                      </Card>
                  </div>
              </div>
            </div>
        </AppShell>
      );
    case 'college-admin':
      return (
        <AppShell>
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Counselor Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {profile?.name || 'Counselor'}.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sessions this Month</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">42</div>
                            <p className="text-xs text-muted-foreground">+15 from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Counseling Earnings</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹8,400</div>
                            <p className="text-xs text-muted-foreground">Based on 42 sessions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2</div>
                            <p className="text-xs text-muted-foreground">Action required</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Today's Scheduled Sessions</CardTitle>
                                <CardDescription>Your upcoming appointments for the day.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adminTodaysSchedule.map((session) => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium">{session.studentName}</TableCell>
                                                <TableCell>{session.time}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm">Start Session</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Counseling Session Requests</CardTitle>
                                <CardDescription>New booking requests from students.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Requested Time</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adminBookingRequests.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-medium">{req.studentName}</TableCell>
                                                <TableCell>{req.requestedTime}</TableCell>
                                                <TableCell className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600"><CheckCircle className="h-5 w-5" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><XCircle className="h-5 w-5" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Students</CardTitle>
                                <CardDescription>Manage students assigned to you.</CardDescription>
                                <div className="relative pt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search students..." className="pl-10" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adminStudentsData.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell>
                                                    <div className="font-medium">{student.name}</div>
                                                    <div className="text-xs text-muted-foreground">{student.class}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={student.status === 'Active' ? 'secondary' : 'destructive'} className={student.status === 'Active' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                        {student.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/dashboard/student/${student.id}`}>View Profile</Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppShell>
      );
    case 'student':
    case 'general':
    default:
        return (
            <AppShell>
                <StudentDashboard profile={profile} userId={user.uid} />
            </AppShell>
        );
  }
}
