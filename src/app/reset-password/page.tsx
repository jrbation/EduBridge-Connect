"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function action(formData: FormData) {
    const result = await resetPasswordAction(formData);
    setOk(!result.error);
    setMessage(result.error ?? result.success ?? null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            {message ? <p className={`text-sm ${ok ? "text-emerald-700" : "text-destructive"}`}>{message}</p> : null}
            <Button className="w-full" type="submit">
              Update password
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
