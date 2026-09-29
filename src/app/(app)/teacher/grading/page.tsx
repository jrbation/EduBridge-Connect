import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { gradeSubmissionAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Badge } from "@/components/ui/badge";
import { formatDate, one } from "@/lib/utils";

export default async function TeacherGradingPage() {
  await requireRole("teacher");
  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("id, submitted_at, status, submission_text, assignments(title, points), students(profiles(full_name))")
    .in("status", ["submitted", "graded"])
    .order("submitted_at", { ascending: false })
    .limit(40);

  return (
    <div>
      <PageHeader title="Grading" description="Review submissions and release scores with feedback." />
      {!submissions?.length ? (
        <EmptyState title="No submissions to grade" />
      ) : (
        <div className="space-y-4">
          {submissions.map((row) => {
            const assignment = one(row.assignments as { title: string; points: number } | { title: string; points: number }[] | null);
            const student = one(row.students as { profiles: { full_name: string } | { full_name: string }[] } | null);
            const name = one(student?.profiles)?.full_name ?? "Student";
            return (
              <article key={row.id} className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{assignment?.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {name} · {formatDate(row.submitted_at, true)}
                    </p>
                  </div>
                  <Badge variant={row.status === "graded" ? "success" : "warning"}>{row.status}</Badge>
                </div>
                <p className="mb-4 whitespace-pre-wrap text-sm">{row.submission_text || "File or empty written response."}</p>
                <ActionForm action={gradeSubmissionAction} className="grid gap-3 md:grid-cols-[8rem_1fr_auto] md:items-end">
                  <input type="hidden" name="submissionId" value={row.id} />
                  <div className="space-y-2">
                    <Label htmlFor={`score-${row.id}`}>Score / {assignment?.points ?? 100}</Label>
                    <Input id={`score-${row.id}`} name="score" type="number" min={0} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`feedback-${row.id}`}>Feedback</Label>
                    <Textarea id={`feedback-${row.id}`} name="feedback" className="min-h-[44px]" />
                  </div>
                  <PendingButton>Save grade</PendingButton>
                </ActionForm>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
