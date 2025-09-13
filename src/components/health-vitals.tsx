'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addVitalLog, getTodaysVitals } from '@/services/vitals';
import { useAuth } from '@/context/auth-context';
import { Activity, Droplets, Wind, Plus, Watch, Loader2 } from 'lucide-react';
import type { VitalLog } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { DialogTrigger } from '@radix-ui/react-dialog';

const HealthVitals = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [todaysVitals, setTodaysVitals] = useState<VitalLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [bp, setBp] = useState('');
    const [stress, setStress] = useState('');
    const [spo2, setSpo2] = useState('');

    const fetchVitals = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const vitals = await getTodaysVitals();
        setTodaysVitals(vitals);
        if(vitals) {
            setBp(vitals.bp || '');
            setStress(vitals.stress?.toString() || '');
            setSpo2(vitals.spo2?.toString() || '');
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchVitals();
    }, [fetchVitals]);

    const handleSaveVitals = async () => {
        if (!bp && !stress && !spo2) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter at least one vital sign.' });
            return;
        }
        setIsSaving(true);
        try {
            await addVitalLog({ 
                bp, 
                stress: stress ? parseInt(stress, 10) : undefined,
                spo2: spo2 ? parseInt(spo2, 10) : undefined,
            });
            toast({ title: 'Vitals Logged', description: 'Your health data has been updated.' });
            await fetchVitals();
            setIsDialogOpen(false); // Close dialog on success
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your vitals. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSmartwatchSync = () => {
        toast({ title: 'Coming Soon!', description: 'Smartwatch integration is not yet available.' });
    }

    const VitalDisplay = ({ icon, label, value, unit, isLoading }: { icon: React.ReactNode, label: string, value: string, unit: string, isLoading: boolean }) => (
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2.5 rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                {isLoading ? (
                    <Skeleton className="h-5 w-16 mt-1" />
                ) : (
                    <p className="text-lg font-bold">
                        {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
                    </p>
                )}
            </div>
        </div>
    );
    

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Daily Vitals</CardTitle>
                <CardDescription>Keep track of your key health metrics.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
                <div className="space-y-4 flex-grow">
                    <VitalDisplay icon={<Activity size={18} />} label="Blood Pressure" value={todaysVitals?.bp || '--'} unit="mmHg" isLoading={isLoading} />
                    <VitalDisplay icon={<Droplets size={18} />} label="SpO2" value={todaysVitals?.spo2?.toString() || '--'} unit="%" isLoading={isLoading} />
                    <VitalDisplay icon={<Wind size={18} />} label="Stress Level" value={todaysVitals?.stress?.toString() || '--'} unit="/ 100" isLoading={isLoading} />
                </div>
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1" onClick={handleSmartwatchSync}>
                        <Watch className="mr-2 h-4 w-4" /> Sync
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1">
                                <Plus className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Log Your Vitals Manually</DialogTitle>
                                <DialogDescription>Enter your latest health metrics. You only need to fill out the ones you want to log.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bp">Blood Pressure (e.g., 120/80)</Label>
                                    <Input id="bp" value={bp} onChange={(e) => setBp(e.target.value)} placeholder="--/--" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="spo2">SpO2 (%)</Label>
                                    <Input id="spo2" type="number" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="e.g., 98" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stress">Stress Level (0-100)</Label>
                                    <Input id="stress" type="number" value={stress} onChange={(e) => setStress(e.target.value)} placeholder="e.g., 35" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveVitals} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Vitals
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
};

export default HealthVitals;
