

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addFriend, getFriends, removeFriend, Friend } from '@/services/friends';
import { Trash2, Plus, Loader2, Edit, Bed, Sunrise } from 'lucide-react';
import { getProfile, saveProfile, UserProfile } from '@/services/profile';
import { useAuth } from '@/context/auth-context';
import { uploadProfilePicture } from '@/services/storage';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import TimeInput from '../time-input';


const SettingsView = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  
  // State for Profile
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // State for image upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified loading state
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      const [userProfile, friendsList] = await Promise.all([
        getProfile(),
        getFriends(),
      ]);
      if (userProfile) setProfile(userProfile);
      setFriends(friendsList);
    } catch (error) {
      toast({ title: "Error", description: "Could not load settings data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfile(prev => ({...prev, [id]: value }));
  }

  const handleSleepScheduleChange = (id: string, value: string) => {
    setProfile(prev => ({
        ...prev,
        sleepSchedule: {
            ...prev.sleepSchedule,
            [id]: value
        }
    }));
  };

  const handleSwitchChange = (checked: boolean, id: string) => {
    setProfile(prev => ({ ...prev, [id]: checked }));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await saveProfile(profile);
      toast({
          title: "Settings Saved",
          description: "Your information has been updated.",
      });
      await fetchData(); // Refetch data to update the UI
    } catch(error) {
       toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  }

  const handleAddFriend = async () => {
    if (!newFriendName || !newFriendEmail) {
        toast({ title: "Missing Information", description: "Please enter a name and email for your friend.", variant: "destructive" });
        return;
    }
    setIsAddingFriend(true);
    try {
        await addFriend(newFriendName, newFriendEmail, newFriendPhone);
        setNewFriendName('');
        setNewFriendEmail('');
        setNewFriendPhone('');
        const friendsList = await getFriends();
        setFriends(friendsList);
        toast({ title: "Friend Added", description: `${newFriendName} has been added to your contacts.` });
    } catch (error) {
        toast({ title: "Error", description: "Could not add friend. Please try again.", variant: "destructive" });
    } finally {
        setIsAddingFriend(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const originalFriends = friends;
    setFriends(friends.filter(f => f.id !== friendId));
    try {
      await removeFriend(friendId);
      toast({ title: "Friend Removed", description: "The friend has been removed from your contacts." });
    } catch (error) {
      setFriends(originalFriends);
      toast({ title: "Error", description: "Could not remove friend. Please try again.", variant: "destructive" });
    }
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      await uploadProfilePicture(user.uid, file);
      toast({
        title: 'Profile Picture Updated',
        description: 'Your new photo has been saved.',
      });
      await fetchData();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Could not upload your profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 p-6">
      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Profile & Preferences</CardTitle>
                <CardDescription>Update your personal info, caretaker details, and app preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveChanges} className="space-y-6">
                  <div className="space-y-4">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-4">
                       <Avatar className="h-16 w-16">
                        <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                       <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                         {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                        Change Photo
                      </Button>
                    </div>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input id="height" type="number" placeholder="e.g., 175" value={profile.height || ''} onChange={handleProfileChange} disabled={isLoading}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input id="weight" type="number" placeholder="e.g., 70" value={profile.weight || ''} onChange={handleProfileChange} disabled={isLoading}/>
                    </div>
                  </div>
                  <div className="space-y-2">
                        <Label htmlFor="hydrationGoal">Daily Hydration Goal (glasses)</Label>
                        <Input id="hydrationGoal" type="number" placeholder="e.g., 8" value={profile.hydrationGoal || ''} onChange={handleProfileChange} disabled={isLoading}/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="caretakerName">Caretaker Name</Label>
                      <Input id="caretakerName" placeholder="e.g., Dr. Smith" value={profile.caretakerName || ''} onChange={handleProfileChange} disabled={isLoading}/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="caretakerEmail">Caretaker Contact (Email)</Label>
                      <Input id="caretakerEmail" type="email" placeholder="e.g., caretaker@example.com" value={profile.caretakerEmail || ''} onChange={handleProfileChange} disabled={isLoading}/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="medicalConditions">Stress-Related Medical Conditions</Label>
                      <Textarea id="medicalConditions" placeholder="e.g., Anxiety, High Blood Pressure" value={profile.medicalConditions || ''} onChange={handleProfileChange} disabled={isLoading}/>
                  </div>

                    <div className="space-y-4 pt-4 border-t">
                        <Label className="font-semibold text-base">Sleep Schedule</Label>
                        <p className="text-sm text-muted-foreground -mt-2">Set your typical sleep and wake times to get personalized circadian rhythm insights.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div className='space-y-2'>
                                <Label htmlFor="weekdayWake">Weekday Wake-up</Label>
                                <TimeInput id="weekdayWake" value={profile.sleepSchedule?.weekdayWake} onChange={handleSleepScheduleChange} icon={<Sunrise className="text-yellow-500" />}/>
                            </div>
                             <div className='space-y-2'>
                                <Label htmlFor="weekdaySleep">Weekday Bedtime</Label>
                                <TimeInput id="weekdaySleep" value={profile.sleepSchedule?.weekdaySleep} onChange={handleSleepScheduleChange} icon={<Bed className="text-purple-500" />}/>
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor="weekendWake">Weekend Wake-up</Label>
                                <TimeInput id="weekendWake" value={profile.sleepSchedule?.weekendWake} onChange={handleSleepScheduleChange} icon={<Sunrise className="text-yellow-500" />}/>
                            </div>
                             <div className='space-y-2'>
                                <Label htmlFor="weekendSleep">Weekend Bedtime</Label>
                                <TimeInput id="weekendSleep" value={profile.sleepSchedule?.weekendSleep} onChange={handleSleepScheduleChange} icon={<Bed className="text-purple-500" />}/>
                            </div>
                        </div>
                    </div>
                  
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="vacationMode" className="font-semibold">Vacation Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Pause all wellness check alerts.
                            </p>
                        </div>
                        <Switch id="vacationMode" checked={profile.vacationMode || false} onCheckedChange={(checked) => handleSwitchChange(checked, 'vacationMode')} disabled={isLoading} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="push-notifications" className="font-semibold">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive reminders and alerts.
                            </p>
                        </div>
                        <Switch id="push-notifications" defaultChecked disabled />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSavingProfile || isLoading}>
                    {(isSavingProfile) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
              </form>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
          <CardDescription>Manage your support network. Add friends to connect with when you need support.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Friend's Name" value={newFriendName} onChange={(e) => setNewFriendName(e.target.value)} disabled={isAddingFriend}/>
                <Input placeholder="Friend's Email" type="email" value={newFriendEmail} onChange={(e) => setNewFriendEmail(e.target.value)} disabled={isAddingFriend}/>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Phone Number (Optional)" type="tel" value={newFriendPhone} onChange={(e) => setNewFriendPhone(e.target.value)} disabled={isAddingFriend} className="flex-grow"/>
                <Button onClick={handleAddFriend} disabled={isAddingFriend || !newFriendName || !newFriendEmail} size="icon" className="shrink-0">
                  {isAddingFriend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus />}
                </Button>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border p-2 min-h-[100px]">
              {isLoading ? (
                 <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 </div>
              ) : friends.length > 0 ? (
                friends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                      {friend.phone && <p className="text-sm text-muted-foreground">{friend.phone}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFriend(friend.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground text-center">No friends added yet. Add one above.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsView;
