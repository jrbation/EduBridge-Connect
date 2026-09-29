import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecord } from "@/lib/data/records";
import { submitAssignmentAction } from "@/actions/academic";
import { PageHeader } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea, Input } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { formatDate } from "@/lib/utils";

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  const supabase = await createClient();
  const { data: assignment } = await supabase.from("assignments").select("*, classes(name)").eq("id", id).maybeSingle();
  if (!assignment) notFound();
  const { data: submission } = student
    ? await supabase.from("assignment_submissions").select("*").eq("assignment_id", id).eq("student_id", student.id).maybeSingle()
    : { data: null };
  const { data: grade } = student
    ? await supabase.from("grades").select("*").eq("assignment_id", id).eq("student_id", student.id).maybeSingle()
    : { data: null };
  const cls = assignment.classes as { name: string } | null;

  return (
    <div>
      <PageHeader title={assignment.title} description={`${cls?.name ?? "Class"} · ${assignment.points} points · due ${formatDate(assignment.due_date, true)}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <p className="whitespace-pre-wrap text-sm">{assignment.description}</p>
          {submission ? (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                Status: <Badge>{submission.status}</Badge>
              </p>
              {submission.submission_text ? <p>Your response: {submission.submission_text}</p> : null}
            </div>
          ) : null}
          {grade ? (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm">
              <p className="font-medium">
                Grade: {grade.score} / {assignment.points}
              </p>
              {grade.feedback ? <p className="mt-1">{grade.feedback}</p> : null}
            </div>
          ) : null}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Submit work</h2>
          <ActionForm action={submitAssignmentAction} className="space-y-4">
            <input type="hidden" name="assignmentId" value={id} />
            <div className="space-y-2">
              <Label htmlFor="submissionText">Written response</Label>
              <Textarea id="submissionText" name="submissionText" defaultValue={submission?.submission_text ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File upload (PDF or document, max 10MB)</Label>
              <Input id="file" name="file" type="file" />
            </div>
            <PendingButton>Submit assignment</PendingButton>
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
