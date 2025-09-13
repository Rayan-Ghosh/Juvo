
"use client";

import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MessageSquare, Settings, Calendar, LogOut, Bell, LayoutGrid } from 'lucide-react';
import Logo from './logo';
import Overview from './views/overview';
import ChatView from './views/chat';
import SettingsView from './views/settings';
import CalendarView from './views/calendar';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { logOut } from '@/services/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export type View = 'dashboard' | 'chat' | 'calendar' | 'settings';

export default function Dashboard() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatView />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <SettingsView />;
      case 'dashboard':
      default:
        return <Overview setActiveView={setActiveView} />;
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
  ] as const;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-4">
            <Logo />
            <h1 className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">Juvo</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id} className="px-2">
                <SidebarMenuButton
                  onClick={() => setActiveView(item.id)}
                  isActive={activeView === item.id}
                  tooltip={{children: item.label, side: 'right', align: 'center'}}
                  className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-bold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  {item.icon}
                  <span className='group-data-[collapsible=icon]:hidden'>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur px-4 lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                <h2 className="text-xl font-bold tracking-tight">Welcome back, {user?.displayName || 'there'}!</h2>
            </div>
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5"/>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                                <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                            </p>
                        </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <main className="flex-1 bg-muted/30">{renderView()}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
