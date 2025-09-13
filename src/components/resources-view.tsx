'use client';

import React from 'react';
import AffirmationGenerator from './affirmation-generator';
import BreathingExercise from './breathing-exercise';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Sparkles, Wind } from 'lucide-react';

const ResourcesView = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Wellness Toolkit</CardTitle>
                <CardDescription>Interactive tools to help you find balance.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible defaultValue="breathing">
                    <AccordionItem value="breathing">
                        <AccordionTrigger>
                            <div className="flex items-center gap-3">
                                <Wind className="h-5 w-5 text-primary" />
                                <span className="font-semibold">Guided Breathing</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <BreathingExercise />
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="affirmation">
                         <AccordionTrigger>
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <span className="font-semibold">Affirmation Generator</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <AffirmationGenerator />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    )
}

export default ResourcesView;
