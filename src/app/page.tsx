import Link from "next/link";
import { BookOpen, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  { icon: GraduationCap, title: "Students", text: "Courses, assignments, quizzes, and progress in one place." },
  { icon: Users, title: "Parents", text: "Monitor grades, attendance, and upcoming work for linked children." },
  { icon: BookOpen, title: "Teachers", text: "Manage classes, grade submissions, and take attendance." },
  { icon: ShieldCheck, title: "Admins", text: "Oversee users, schools, classes, and platform reports." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f8fafc_45%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">E</span>
          EduBridge Connect
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Online learning platform</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          Simple, inclusive learning for every role in the school community.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Students learn, teachers teach, parents stay informed, and administrators keep the school running — from any device.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Create an account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Use a demo account</Link>
          </Button>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
            <div key={role.title} className="rounded-xl border bg-white p-5 shadow-card">
              <role.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 font-semibold">{role.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{role.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
