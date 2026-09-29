import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecord } from "@/lib/data/records";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export default async function StudentWorkPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { tab } = (await searchParams) ?? {};
  const activeTab = tab === "quizzes" ? "quizzes" : "assignments";
  const profile = await requireRole("student");
  const student = await getStudentRecord(profile.id);
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, due_date, points, classes(name)")
    .order("due_date");
  const { data: quizzes } = await supabase.from("quizzes").select("id, title, description, time_limit_minutes").order("created_at", { ascending: false });
  const { data: submissions } = student
    ? await supabase.from("assignment_submissions").select("assignment_id, status").eq("student_id", student.id)
    : { data: [] };
  const statusByAssignment = new Map((submissions ?? []).map((row) => [row.assignment_id, row.status]));

  return (
    <div>
      <PageHeader title="Assignments & Quizzes" description="Submit work and take quizzes." />
      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments">
          {!assignments?.length ? (
            <EmptyState title="No assignments yet" />
          ) : (
            <div className="space-y-3">
              {assignments.map((item) => {
                const cls = item.classes as { name: string } | null;
                const status = statusByAssignment.get(item.id) ?? "not submitted";
                return (
                  <Link
                    key={item.id}
                    href={`/student/assignments/${item.id}`}
                    className="flex flex-col gap-1 rounded-xl border bg-card p-4 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {cls?.name} · due {formatDate(item.due_date)}
                      </p>
                    </div>
                    <Badge variant={status === "graded" ? "success" : "secondary"}>{status}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="quizzes">
          {!quizzes?.length ? (
            <EmptyState title="No quizzes yet" />
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <Link key={quiz.id} href={`/student/quizzes/${quiz.id}`} className="block rounded-xl border bg-card p-4 hover:bg-muted/40">
                  <p className="font-medium">{quiz.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {quiz.description} {quiz.time_limit_minutes ? `· ${quiz.time_limit_minutes} min` : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
