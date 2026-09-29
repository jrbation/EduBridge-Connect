"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signupAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Creating account..." : "Sign up"}
    </Button>
  );
}

export default function SignupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function action(formData: FormData) {
    const result = await signupAction(formData);
    if (result?.error) {
      setOk(false);
      setMessage(result.error);
    } else if (result?.success) {
      setOk(true);
      setMessage(result.success);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f8fafc_50%)] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Students, parents, and teachers can join directly. Admins are provisioned separately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am a</Label>
              <select
                id="role"
                name="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="student"
              >
                <option value="student">Student</option>
                <option value="parent">Parent / Guardian</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            {message ? <p className={`text-sm ${ok ? "text-emerald-700" : "text-destructive"}`}>{message}</p> : null}
            <SubmitButton />
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="text-primary hover:underline" href="/login">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
