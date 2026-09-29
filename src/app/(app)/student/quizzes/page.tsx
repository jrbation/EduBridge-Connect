import { redirect } from "next/navigation";

export default function StudentQuizzesPage() {
  redirect("/student/assignments?tab=quizzes");
}
