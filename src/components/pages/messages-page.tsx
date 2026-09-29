import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { sendMessageAction } from "@/actions/account";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { formatDate } from "@/lib/utils";

export async function MessagesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name)")
    .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })
    .limit(40);

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .neq("id", profile.id)
    .eq("status", "active")
    .limit(50);

  return (
    <div>
      <PageHeader title="Messages" description="Message teachers and other users you are allowed to see." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {!messages?.length ? (
            <EmptyState title="No messages yet." />
          ) : (
            messages.map((message) => {
              const sender = message.sender as { full_name: string } | null;
              const receiver = message.receiver as { full_name: string } | null;
              return (
                <div key={message.id} className="rounded-xl border bg-card p-4">
                  <p className="text-sm font-medium">
                    {sender?.full_name ?? "Unknown"} → {receiver?.full_name ?? "Unknown"}
                  </p>
                  <p className="mt-1 text-sm">{message.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(message.created_at, true)}</p>
                </div>
              );
            })
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={sendMessageAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="receiverId">Recipient</Label>
                <select id="receiverId" name="receiverId" className="h-10 w-full rounded-md border px-3 text-sm" required>
                  <option value="">Select</option>
                  {(people ?? []).map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.full_name} ({person.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea id="content" name="content" required />
              </div>
              <PendingButton>Send</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
