"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Please wait..." : label}
    </Button>
  );
}

const demos = [
  ["Student", "student@edubridge.test"],
  ["Parent", "parent@edubridge.test"],
  ["Teacher", "teacher@edubridge.test"],
  ["Admin", "admin@edubridge.test"],
];

function LoginForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(() => {
    const error = searchParams.get("error");
    if (error === "inactive") return "This account is inactive. Contact an administrator.";
    if (error === "config") return "Supabase environment variables are missing. Copy .env.example to .env.local.";
    return null;
  });

  async function action(formData: FormData) {
    const result = await loginAction(formData);
    if (result?.error) setMessage(result.error);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to EduBridge Connect</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
          <SubmitButton label="Log in" />
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link className="text-primary hover:underline" href="/forgot-password">
            Forgot password
          </Link>
          <Link className="text-primary hover:underline" href="/signup">
            Create account
          </Link>
        </div>
        <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo accounts</p>
          <p className="mt-1">Password for all seeded users: EduBridge123!</p>
          <ul className="mt-2 space-y-1">
            {demos.map(([role, email]) => (
              <li key={email}>
                {role}: {email}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f8fafc_50%)] px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign in...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
