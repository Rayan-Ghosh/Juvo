
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, Bell, LayoutDashboard, MessageSquare, Calendar, Users, HeartHandshake, UserPlus, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { getUserProfile, UserProfile } from "@/services/profile";
import { ThemeToggle } from "./theme-toggle";


const allNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["student", "institution", "college-admin", "general"] },
    { href: "/chat", label: "Chat", icon: MessageSquare, roles: ["student", "general"] },
    { href: "/community", label: "Community", icon: Users, roles: ["student", "institution", "college-admin", "general"] },
    { href: "/counseling", label: "Counseling", icon: HeartHandshake, roles: ["student", "general"] },
    { href: "/calendar", label: "Calendar", icon: Calendar, roles: ["student", "general"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["student", "institution", "college-admin", "general"] },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !user.isAnonymous && firestore) {
        const userProfile = await getUserProfile(firestore, user.uid);
        setProfile(userProfile);
      }
    };
    fetchProfile();
  }, [user, firestore]);

  const isGuest = user?.isAnonymous || false;

  const navLinks = useMemo(() => {
    if (isGuest) {
        return allNavLinks.filter(link => link.href === '/chat');
    }
    if (!profile) return [];
    return allNavLinks.filter(link => link.roles.includes(profile.role));
  }, [profile, isGuest]);


  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push("/sign-in");
  };
  
  const userInitials = isGuest ? 'G' : (profile?.name?.substring(0, 1).toUpperCase() || user?.email?.substring(0, 1).toUpperCase() || 'U');
  
  const isChatPage = pathname === '/chat';

  return (
    <div className={cn("flex min-h-screen flex-col text-foreground", isChatPage ? "bg-background" : "bg-secondary/5")}>
      <header className={cn("sticky top-0 z-40 h-16 flex items-center justify-between px-8 border-b", isChatPage ? "bg-background border-border" : "bg-background/80 backdrop-blur-sm")}>
        <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden md:flex items-center gap-4">
                {navLinks.map(link => (
                    <NavLink key={link.href} href={link.href} isChatPage={isChatPage}>
                        <link.icon className="h-5 w-5" />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className={cn(isChatPage && 'text-foreground hover:bg-accent')}>
              <Bell className="h-5 w-5" />
          </Button>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                  </AvatarFallback>
                  </Avatar>
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {isGuest ? (
                    <>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Guest User</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    Sign up to save your progress
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/sign-up')}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Sign Up</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/sign-in')}>
                            <LogIn className="mr-2 h-4 w-4" />
                            <span>Sign In</span>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{profile?.name || 'User'}</p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                                {user?.email}
                            </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </>
                )}
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className={cn("flex-1", !isChatPage && "p-8")}>{children}</main>
    </div>
  );
}

function NavLink({ href, children, isChatPage }: { href: string; children: React.ReactNode; isChatPage: boolean }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "text-primary bg-accent"
      )}
    >
      {children}
    </Link>
  );
}
