
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Bot, Brain, HeartHandshake, Menu, Phone, Bed, Droplets, Scaling, GlassWater } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';


const navLinks = [
  { href: '#', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#faq', label: 'FAQ' },
  { href: '#about', label: 'About Us' },
  { href: '#contact', label: 'Contact Us' },
];

export default function LandingPage() {
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 px-4 lg:px-6 h-20 flex items-center bg-background/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center justify-center">
          <Logo />
        </Link>
        <nav className="ml-auto flex gap-2 items-center">
          <div className="hidden md:flex gap-2">
            {navLinks.map(link => (
              <Button key={link.href} variant="ghost" asChild>
                  <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
          <Button size="lg" asChild className="rounded-full font-bold">
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <ThemeToggle />
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden rounded-full">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
               <DropdownMenuItem asChild>
                  <Link href="/sign-in">Sign In</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 text-center isolate">
          {heroImg && (
            <Image
              src={heroImg.imageUrl}
              alt={heroImg.description}
              fill
              className="object-cover -z-10"
              priority
              data-ai-hint={heroImg.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20 -z-10" />
           <div className="container px-4 md:px-6 z-10">
            <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl !leading-tight font-headline float bg-gradient-to-r from-primary to-sky-blue bg-clip-text text-transparent">
                  Your Personal Guide to<br/> Mental Wellness
                </h1>
                <p className="max-w-[700px] text-foreground/80 text-lg md:text-xl mx-auto">
                  Juvo is a safe and supportive space for students to navigate the pressures of academic life. Chat, reflect, and grow with an AI companion that understands.
                </p>
                <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
                  <Button size="lg" asChild className="rounded-full font-bold text-lg px-8 py-6">
                    <Link href="/chat">Start Chatting for Free</Link>
                  </Button>
                </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-4xl md:text-5xl font-headline">
              A Toolkit for Your Mind
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed text-center mx-auto mt-4">
              Juvo offers a suite of features designed to provide support, insight, and relief whenever you need it.
            </p>
            <div className="mx-auto grid max-w-6xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 mt-12">
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-peach/50 text-primary mb-4">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">24/7 AI Companion</h3>
                <p className="text-sm text-muted-foreground">
                  Engage in confidential conversations with an empathetic AI that provides a non-judgmental ear anytime.
                </p>
              </Card>
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-mint/50 text-primary mb-4">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Personalized Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Track your mood and identify patterns over time to gain a deeper understanding of your emotional landscape.
                </p>
              </Card>
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-saffron/20 text-primary mb-4">
                  <HeartHandshake className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Anonymous Community</h3>
                <p className="text-sm text-muted-foreground">
                   Share experiences and find solidarity in a safe, moderated space with peers who understand.
                </p>
              </Card>
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-blue/20 text-primary mb-4">
                  <Phone className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Contact a Counsellor</h3>
                <p className="text-sm text-muted-foreground">
                   Easily connect with professional counsellors for confidential support and guidance.
                </p>
              </Card>
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-peach/50 text-primary mb-4">
                  <Bed className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Sleep Cycle Tracking</h3>
                <p className="text-sm text-muted-foreground">
                   Monitor your sleep patterns to improve rest and understand its impact on your mood.
                </p>
              </Card>
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-mint/50 text-primary mb-4">
                  <Droplets className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Menstrual Cycle Log</h3>
                <p className="text-sm text-muted-foreground">
                   Track your menstrual cycle and understand its connection to your emotional well-being.
                </p>
              </Card>
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-saffron/20 text-primary mb-4">
                  <Scaling className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">BMI & Health Tracking</h3>
                <p className="text-sm text-muted-foreground">
                   Keep track of your Body Mass Index and other health metrics to maintain physical wellness.
                </p>
              </Card>
              <Card className="grid gap-1 text-center p-6 rounded-2xl bg-card shadow-lg border border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-2">
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-blue/20 text-primary mb-4">
                  <GlassWater className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Hydration Reminders</h3>
                <p className="text-sm text-muted-foreground">
                   Set and receive reminders to stay hydrated, a key component of mental clarity.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-sky-blue/10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                Your Path to Peace in 3 Simple Steps
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Getting started with Juvo is easy. Begin your journey to a more balanced mindset today.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-4 text-center p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-10 duration-700">
                 <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-background text-primary text-3xl font-bold shadow-inner">1</div>
                <h3 className="text-xl font-bold">Create Your Account</h3>
                <p className="text-muted-foreground">
                  Sign up in seconds. Your data is private, secure, and always under your control.
                </p>
              </div>
              <div className="grid gap-4 text-center p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 [animation-delay:200ms]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-background text-primary text-3xl font-bold shadow-inner">2</div>
                <h3 className="text-xl font-bold">Start the Conversation</h3>
                <p className="text-muted-foreground">
                  Talk or type to your Juvo companion. Share what's on your mind, big or small.
                </p>
              </div>
              <div className="grid gap-4 text-center p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 [animation-delay:400ms]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-background text-primary text-3xl font-bold shadow-inner">3</div>
                <h3 className="text-xl font-bold">Discover & Grow</h3>
                <p className="text-muted-foreground">
                  Explore personalized insights, coping strategies, and feel a sense of community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">What Our Users Are Saying</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                See how Juvo is making a difference in students' lives.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 lg:grid-cols-3 gap-6 pt-12">
              <Card className="transition-transform duration-300 hover:-translate-y-2 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <CardTitle>Alex S.</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">"Juvo has been a lifesaver during stressful exam periods. It's like having a supportive friend available anytime I need to talk."</p>
                </CardContent>
              </Card>
              <Card className="transition-transform duration-300 hover:-translate-y-2 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <CardTitle>Jordan M.</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">"I was skeptical about an AI therapist, but it's surprisingly insightful. The coping strategies have been genuinely helpful."</p>
                </CardContent>
              </Card>
              <Card className="transition-transform duration-300 hover:-translate-y-2 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <CardTitle>Priya K.</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">"As someone who finds it hard to open up, Juvo offers a private, judgment-free zone. It's helped me understand my anxiety better."</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-t from-background to-sky-blue/10">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-4xl md:text-5xl font-headline">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl mt-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is Juvo a replacement for a human therapist?</AccordionTrigger>
                  <AccordionContent>
                    No, Juvo is designed to be a mental wellbeing companion and is not a substitute for professional medical advice, diagnosis, or treatment. It can be a great first step or a supplemental tool for your mental health journey.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How is my privacy protected?</AccordionTrigger>
                  <AccordionContent>
                    We take your privacy very seriously. All conversations are encrypted and stored securely. We have strict data policies in place to ensure your information remains confidential.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Who can use Juvo?</AccordionTrigger>
                  <AccordionContent>
                    Juvo is designed for students seeking a safe space to manage daily stress and emotional wellbeing. If you are in crisis, please contact a local emergency service immediately.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                  <AccordionTrigger>Is Juvo really free?</AccordionTrigger>
                  <AccordionContent>
                    Yes, the core features of Juvo are completely free to use. Our goal is to make mental wellbeing support accessible to as many students as possible.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Ready to Feel Better?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                Take the first step towards a calmer mind. Juvo is free, confidential, and here for you.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
               <Button size="lg" className="w-full rounded-full font-bold text-lg px-8 py-6" asChild>
                  <Link href="/chat">Get Started for Free</Link>
                </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-gradient-to-t from-peach/20 via-sky-blue/20 to-mint/20 animated-gradient-background">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Juvo. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4 text-muted-foreground">
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
