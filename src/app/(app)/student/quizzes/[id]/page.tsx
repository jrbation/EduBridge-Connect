import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecord } from "@/lib/data/records";
import { submitQuizAction } from "@/actions/academic";
import { PageHeader } from "@/components/shared/states";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";

export default async function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  const supabase = await createClient();
  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", id).maybeSingle();
  if (!quiz) notFound();
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, question, points, quiz_answers(id, answer, sort_order)")
    .eq("quiz_id", id)
    .order("sort_order");
  const { data: attempt } = student
    ? await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", id)
        .eq("student_id", student.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div>
      <div className="mb-4">
        <Link href="/student/assignments?tab=quizzes" className="inline-flex items-center text-sm text-primary hover:underline">
          ← Back to Quizzes
        </Link>
      </div>
      <PageHeader title={quiz.title} description={quiz.description ?? "Answer each question and submit once."} />
      {attempt ? (
        <div className="mb-4 rounded-xl border bg-emerald-50 p-4">
          Last score: <strong>{attempt.score}%</strong>
        </div>
      ) : null}
      <ActionForm action={submitQuizAction} className="space-y-6">
        <input type="hidden" name="quizId" value={id} />
        {(questions ?? []).map((question, index) => {
          const answers = (question.quiz_answers as { id: string; answer: string }[] | null) ?? [];
          return (
            <fieldset key={question.id} className="rounded-xl border bg-card p-5">
              <legend className="font-medium">
                {index + 1}. {question.question} ({question.points} pt)
              </legend>
              <div className="mt-3 space-y-2">
                {answers.map((answer) => (
                  <Label key={answer.id} className="flex items-center gap-2 font-normal">
                    <input type="radio" name={`q_${question.id}`} value={answer.id} required />
                    {answer.answer}
                  </Label>
                ))}
              </div>
            </fieldset>
          );
        })}
        <PendingButton>Submit quiz</PendingButton>
      </ActionForm>
    </div>
  );
}
