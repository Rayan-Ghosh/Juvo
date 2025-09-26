
"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, Key, CreditCard, DollarSign, Building, UserSquare, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { getUserProfile, saveUserProfile, type UserProfile } from "@/services/profile";

const mockBookings = [
    { id: 'b1', counselor: 'Dr. Ananya Sharma', studentId: 'S-48291', time: '14:30', status: 'Accepted' },
    { id: 'b2', counselor: 'Dr. Rohan Verma', studentId: 'S-10385', time: '15:00', status: 'Pending' },
    { id: 'b3', counselor: 'Dr. Priya Singh', studentId: 'S-73820', time: '16:00', status: 'Accepted' },
];


const StudentSettings = () => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && firestore) {
        const profile = await getUserProfile(firestore, user.uid);
        if (profile) {
          setProfileData(profile);
        }
      }
    };
    fetchProfile();
  }, [user, firestore]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfileData(prev => ({...prev, [id]: value}));
  }

  const handleSleepScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileData(prev => ({
        ...prev, 
        sleepSchedule: {
            ...prev.sleepSchedule,
            [id]: value
        }
    }));
  }


  const handleGenderChange = (value: string) => {
    setProfileData(prev => ({...prev, gender: value as UserProfile['gender']}));
  }

  const handleSave = async () => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        ...profileData,
        height: Number(profileData.height) || 0,
        weight: Number(profileData.weight) || 0,
      }
      await saveUserProfile(firestore, user.uid, dataToSave);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error("Failed to save settings", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save your settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userInitial = profileData.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'J';

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
            <CardTitle>Profile & Preferences</CardTitle>
            <CardDescription>
                Update your personal info, caretaker details, and app preferences.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div>
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4 mt-2">
                <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Photo</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="e.g., Jane Doe" value={profileData.name || ''} onChange={handleInputChange} />
                </div>
                <div>
                <Label htmlFor="identificationId">Identification ID</Label>
                <Input id="identificationId" placeholder="e.g., Student or Employee ID" value={profileData.identificationId || ''} onChange={handleInputChange} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input id="height" type="number" placeholder="e.g., 175" value={profileData.height || ''} onChange={handleInputChange} />
                </div>
                <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" type="number" placeholder="e.g., 70" value={profileData.weight || ''} onChange={handleInputChange} />
                </div>
            </div>
            
            <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={handleGenderChange} value={profileData.gender}>
                    <SelectTrigger id="gender">
                        <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="hydration">Daily Hydration Goal (glasses)</Label>
                <Input id="hydration" placeholder="e.g., 8" />
            </div>

            <div>
                <Label htmlFor="caretakerEmail">Caretaker Contact (Email)</Label>
                <Input id="caretakerEmail" type="email" placeholder="e.g., caretaker@example.com" value={profileData.caretakerEmail || ''} onChange={handleInputChange} />
            </div>

            <div>
                <Label htmlFor="stressConditionDetails">Stress-Related Medical Conditions</Label>
                <Textarea id="stressConditionDetails" placeholder="e.g., Anxiety, High Blood Pressure" value={profileData.stressConditionDetails || ''} onChange={handleInputChange}/>
            </div>
            
            <div className="border-t pt-6">
                <h3 className="font-semibold">Sleep Schedule</h3>
                <p className="text-sm text-muted-foreground">Edit your typical sleep and wake times to get personalized circadian rhythm insights.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                        <Label htmlFor="weekdayWake">Weekday Wake-up</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="weekdayWake" type="time" className="pl-10" value={profileData.sleepSchedule?.weekdayWake || ''} onChange={handleSleepScheduleChange} />
                        </div>
                        </div>
                        <div>
                        <Label htmlFor="weekdaySleep">Weekday Bedtime</Label>
                            <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="weekdaySleep" type="time" className="pl-10" value={profileData.sleepSchedule?.weekdaySleep || ''} onChange={handleSleepScheduleChange} />
                        </div>
                        </div>
                        <div>
                        <Label htmlFor="weekendWake">Weekend Wake-up</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="weekendWake" type="time" className="pl-10" value={profileData.sleepSchedule?.weekendWake || ''} onChange={handleSleepScheduleChange} />
                        </div>
                        </div>
                        <div>
                        <Label htmlFor="weekendSleep">Weekend Bedtime</Label>
                            <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="weekendSleep" type="time" className="pl-10" value={profileData.sleepSchedule?.weekendSleep || ''} onChange={handleSleepScheduleChange} />
                        </div>
                        </div>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                <Label htmlFor="vacation-mode" className="font-semibold">Vacation Mode</Label>
                <p className="text-sm text-muted-foreground">Pause all wellness check alerts.</p>
                </div>
                <Switch id="vacation-mode" />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                <Label htmlFor="push-notifications" className="font-semibold">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive reminders and alerts.</p>
                </div>
                <Switch id="push-notifications" defaultChecked />
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>

            </CardContent>
        </Card>
    </div>
  );
};


const CollegeAdminSettings = ({profile}: {profile: UserProfile}) => {
    const userInitial = profile.name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'A';
    const { toast } = useToast();

    const handleRequestHike = () => {
        toast({
            title: "Request Sent",
            description: "Your request for a rate hike has been submitted to the institution for review.",
        })
    }

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Profile & Professional Details</CardTitle>
                    <CardDescription>Manage your personal and professional information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4 mt-2">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline">Change Photo</Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue={profile.name} />
                        </div>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" defaultValue={profile.email} readOnly disabled />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="employeeId">Employee ID</Label>
                             <div className="relative">
                                <UserSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="employeeId" defaultValue={profile.identificationId} className="pl-10" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="institutionId">Institution ID</Label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="institutionId" defaultValue={profile.institutionId} className="pl-10" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="session-rate">Current Cost Per Session</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input id="session-rate" type="text" value="200" readOnly disabled className="pl-8 font-semibold" />
                            </div>
                            <Button variant="secondary" onClick={handleRequestHike}>
                               <TrendingUp className="mr-2 h-4 w-4"/> Request Rate Hike
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Your session rate is set by the institution. You can request a review based on performance.</p>
                    </div>
                     <div className="border-t pt-6">
                        <Button variant="outline">
                            <Key className="mr-2 h-4 w-4"/> Change Password
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Availability & Notifications</CardTitle>
                    <CardDescription>Set your working hours and how you receive alerts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="border-t pt-6">
                        <h3 className="font-semibold">Set Your Weekly Availability</h3>
                        <p className="text-sm text-muted-foreground">Define your standard hours for counseling sessions.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
                            <div>
                                <Label htmlFor="weekday-start">Weekday Start Time</Label>
                                <Input id="weekday-start" type="time" defaultValue="09:00" />
                            </div>
                            <div>
                                <Label htmlFor="weekday-end">Weekday End Time</Label>
                                <Input id="weekday-end" type="time" defaultValue="17:00" />
                            </div>
                             <div>
                                <Label htmlFor="weekend-start">Weekend Start Time</Label>
                                <Input id="weekend-start" type="time" />
                            </div>
                            <div>
                                <Label htmlFor="weekend-end">Weekend End Time</Label>
                                <Input id="weekend-end" type="time" />
                            </div>
                        </div>
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="booking-notifications" className="font-semibold">New Booking Request Emails</Label>
                            <p className="text-sm text-muted-foreground">Get an email when a student requests a session.</p>
                        </div>
                        <Switch id="booking-notifications" defaultChecked />
                    </div>
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="reminder-notifications" className="font-semibold">Upcoming Session Reminders</Label>
                            <p className="text-sm text-muted-foreground">Receive reminders 15 minutes before a session starts.</p>
                        </div>
                        <Switch id="reminder-notifications" defaultChecked />
                    </div>
                </CardContent>
            </Card>
             <div className="flex justify-end pt-4">
                <Button>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" />
                    Save All Changes
                </Button>
            </div>
        </div>
    );
};

const InstitutionSettings = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>API & Billing</CardTitle>
                        <CardDescription>Manage your API keys, usage, and counselor billing rates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="api-key">Current API Key</Label>
                            <div className="flex items-center gap-2">
                                <Input id="api-key" value="sk-pre_..._e4a7" readOnly />
                                <Button variant="outline">
                                    <Key className="mr-2 h-4 w-4" /> Change Key
                                </Button>
                            </div>
                        </div>
                         <div>
                            <Label htmlFor="counselor-rate">Counselor Cost Per Hour (INR)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="counselor-rate" type="number" placeholder="e.g., 500" className="pl-10" />
                            </div>
                        </div>
                        <div className="border-t pt-6">
                             <h3 className="font-semibold">Recharge API</h3>
                             <p className="text-sm text-muted-foreground">Add more credits to your API balance.</p>
                             <div className="flex items-end gap-4 mt-2">
                                <div className="flex-1">
                                    <Label htmlFor="recharge-amount">Amount (INR)</Label>
                                    <Input id="recharge-amount" type="number" placeholder="Enter amount" />
                                </div>
                                <Button>
                                    <CreditCard className="mr-2 h-4 w-4" /> Proceed to Pay
                                </Button>
                             </div>
                        </div>
                    </CardContent>
                 </Card>
            </div>
             <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Today's Bookings</CardTitle>
                        <CardDescription>Overview of scheduled sessions for today.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Counselor</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div className="font-medium">{booking.counselor}</div>
                                            <div className="text-xs text-muted-foreground">{booking.studentId} at {booking.time}</div>
                                        </TableCell>
                                        <TableCell>
                                             <Badge variant={booking.status === 'Accepted' ? 'secondary' : 'default'} className={booking.status === 'Accepted' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
};


export default function SettingsPage() {
  const isAuthReady = useAuthGuard();
  const { user } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && firestore) {
        setIsLoading(true);
        const userProfile = await getUserProfile(firestore, user.uid);
        if (userProfile) {
          setProfile(userProfile);
        }
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, firestore]);

  if (!isAuthReady || isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const renderSettings = () => {
    switch (profile.role) {
      case 'institution':
        return <InstitutionSettings />;
      case 'college-admin':
        return <CollegeAdminSettings profile={profile} />;
      default:
        return <StudentSettings />;
    }
  };
  
  const getPageTitle = () => {
     switch (profile.role) {
      case 'institution':
        return 'Institute Settings';
      case 'college-admin':
        return 'Counselor Settings';
      default:
        return `Welcome back, ${profile?.name || user?.email}!`;
    }
  }

  return (
    <AppShell>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold font-headline mb-8">
            {getPageTitle()}
        </h1>
        
        {renderSettings()}

      </div>
    </AppShell>
  );
}

    