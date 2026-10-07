"use client";

import { approveParentLinkAction, rejectParentLinkAction } from "@/actions/account";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface PendingParentRequest {
  id: string;
  parent_id: string;
  relationship: string;
  status: string;
  parents: {
    profiles: { full_name: string; email: string } | { full_name: string; email: string }[];
  };
}

interface PendingParentRequestsProps {
  requests: PendingParentRequest[];
}

function RejectDialog({ relationshipId, parentName }: { relationshipId: string; parentName: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Reject</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Parent Connection</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          {parentName} will not be connected to your account.
        </p>
        <ActionForm action={rejectParentLinkAction}>
          <input type="hidden" name="relationshipId" value={relationshipId} />
          <div className="flex justify-end gap-2">
            <DialogTrigger asChild>
              <Button type="button" variant="outline" asChild>
                <button>Cancel</button>
              </Button>
            </DialogTrigger>
            <PendingButton variant="destructive">Reject Request</PendingButton>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function PendingParentRequests({ requests }: PendingParentRequestsProps) {
  if (!requests.length) return null;

  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <h2 className="mb-4 font-semibold">Parent Connection Requests</h2>
      <div className="space-y-3">
        {requests.map((request) => {
          const parentProfile = request.parents?.profiles;
          const parent = Array.isArray(parentProfile) ? parentProfile[0] : parentProfile;
          
          return (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{parent?.full_name}</h3>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Email: {parent?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This parent is requesting access to your learning progress and related information.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ActionForm action={approveParentLinkAction}>
                      <input type="hidden" name="relationshipId" value={request.id} />
                      <PendingButton>Accept</PendingButton>
                    </ActionForm>
                    <RejectDialog 
                      relationshipId={request.id} 
                      parentName={parent?.full_name || "This parent"} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
