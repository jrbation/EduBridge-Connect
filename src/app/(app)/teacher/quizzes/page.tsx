import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { createQuizAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";

export default async function TeacherQuizzesPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, description, time_limit_minutes, created_at")
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Quizzes" description="Create a quiz with one starter multiple-choice question." />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-3">
          {!quizzes?.length ? (
            <EmptyState title="No quizzes yet" />
          ) : (
            quizzes.map((quiz) => (
              <article key={quiz.id} className="rounded-xl border bg-card p-5">
                <h2 className="font-semibold">{quiz.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {quiz.description} {quiz.time_limit_minutes ? `· ${quiz.time_limit_minutes} min` : ""}
                </p>
              </article>
            ))
          )}
        </div>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <ActionForm action={createQuizAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <select id="classId" name="classId" className="h-10 w-full rounded-md border px-3 text-sm" required>
                  <option value="">Select</option>
                  {(classes ?? []).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimitMinutes">Time limit (minutes)</Label>
                <Input id="timeLimitMinutes" name="timeLimitMinutes" type="number" min={1} defaultValue={15} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input id="question" name="question" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input name="answer1" placeholder="Answer 1" />
                <Input name="answer2" placeholder="Answer 2" />
                <Input name="answer3" placeholder="Answer 3" />
                <Input name="answer4" placeholder="Answer 4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correct">Correct answer</Label>
                <select id="correct" name="correct" className="h-10 w-full rounded-md border px-3 text-sm" defaultValue="1">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <PendingButton>Create quiz</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
