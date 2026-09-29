"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function action(formData: FormData) {
    const result = await forgotPasswordAction(formData);
    setOk(!result.error);
    setMessage(result.error ?? result.success ?? null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {message ? <p className={`text-sm ${ok ? "text-emerald-700" : "text-destructive"}`}>{message}</p> : null}
            <Button className="w-full" type="submit">
              Send reset link
            </Button>
          </form>
          <Link className="mt-4 inline-block text-sm text-primary hover:underline" href="/login">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
