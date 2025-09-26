
"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebase } from "@/firebase";
import {
  initiateEmailSignUp,
  initiateEmailSignIn,
  initiateGoogleSignIn,
} from "@/firebase/non-blocking-login";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged, getAdditionalUserInfo, UserCredential } from "firebase/auth";
import { saveUserProfile } from "@/services/profile";

const roles = ["student", "institution", "college-admin", "general"] as const;
type Role = typeof roles[number];

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(roles).default("general"),
  aaparId: z.string().optional(),
  pineCode: z.string().optional(),
  identificationId: z.string().optional(),
  institutionId: z.string().optional(),
});


type AuthFormProps = {
  mode: "signin" | "signup";
};

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.108-11.127-7.481l-6.571,4.819C9.656,39.663,16.318,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.622,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("general");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: 'general',
      aaparId: "",
      pineCode: "",
      identificationId: "",
      institutionId: ""
    },
  });

  const role = useWatch({ control: form.control, name: 'role' });

  const handleAuthSuccess = (isNewUser: boolean, userRole?: Role) => {
    setIsLoading(false);
    // For admins/institutions, always go to the dashboard.
    // For others, go to onboarding only if they are new.
    if (userRole === 'institution' || userRole === 'college-admin') {
      router.push("/dashboard");
    } else if (isNewUser) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard"); // Or '/chat' for existing general/student users
    }
  };

  const handleAuthError = (error: any) => {
    setIsLoading(false);
    toast({
      variant: "destructive",
      title: "Authentication Failed",
      description: error.message || "Please check your credentials and try again.",
    });
  };

  async function onEmailSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
  
    if (!auth || !firestore) {
      handleAuthError(new Error("Firebase is not initialized."));
      return;
    }
  
    if (mode === "signup") {
      try {
        const userCredential = await initiateEmailSignUp(auth, values.email, values.password);
        if (userCredential?.user) {
            const profileData: any = {
                name: values.name,
                email: values.email,
                role: values.role,
            };
            if (values.role === 'student') profileData.aaparId = values.aaparId;
            if (values.role === 'institution') profileData.pineCode = values.pineCode;
            if (values.role === 'college-admin') {
                profileData.identificationId = values.identificationId;
                profileData.institutionId = values.institutionId;
            }
            await saveUserProfile(firestore, userCredential.user.uid, profileData);
            handleAuthSuccess(true, values.role);
        }
      } catch (error: any) {
        handleAuthError(error);
      }
    } else { // Sign-in mode
        try {
            const userCredential: UserCredential | undefined = await initiateEmailSignIn(auth, values.email, values.password);
            if (userCredential) {
              handleAuthSuccess(false);
            }
        } catch (error: any) {
             handleAuthError(error);
        }
    }
  }

  const onGoogleSubmit = async () => {
    setIsLoading(true);
    if (!auth || !firestore) {
        handleAuthError(new Error('Firebase Auth is not initialized.'));
        return;
    }

    try {
        const result = await initiateGoogleSignIn(auth);
        if (result) {
            const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;
            if (isNewUser) {
                 await saveUserProfile(firestore, result.user.uid, {
                    name: result.user.displayName,
                    email: result.user.email,
                    role: 'general',
                });
            }
            handleAuthSuccess(isNewUser, 'general');
        }
    } catch (error: any) {
        handleAuthError(error);
    }
  };
  
  const handleTabChange = (value: string) => {
    const newRole = value as Role;
    setSelectedRole(newRole);
    form.setValue('role', newRole);
  }

  return (
    <div className="space-y-4">
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-6">
        
          {mode === 'signup' && (
            <Tabs value={selectedRole} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="institution">Institution</TabsTrigger>
                <TabsTrigger value="college-admin">Admin</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {mode === 'signup' && (
             <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {mode === 'signup' && role === 'student' && (
            <FormField
              control={form.control}
              name="aaparId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AAPAR ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your AAPAR ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {mode === 'signup' && role === 'institution' && (
            <FormField
              control={form.control}
              name="pineCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PInE Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your institution's PInE Code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {mode === 'signup' && role === 'college-admin' && (
            <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="identificationId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Employee ID</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your Employee ID" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="institutionId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Institution ID</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your Institution's ID" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          )}


          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={onGoogleSubmit} disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
        Google
      </Button>
    </div>
  );
}
