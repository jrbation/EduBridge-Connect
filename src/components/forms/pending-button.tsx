"use client";

import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PendingButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : children}
    </Button>
  );
}

export function toastResult(result: { error?: string; success?: string } | void) {
  if (!result) return;
  if (result.error) toast.error(result.error);
  if (result.success) toast.success(result.success);
}

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: string } | void>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      className={className}
      action={async (formData) => {
        toastResult(await action(formData));
      }}
    >
      {children}
    </form>
  );
}
