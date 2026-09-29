import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherRecord } from "@/lib/data/records";
import { createScheduleAction } from "@/actions/academic";
import { PageHeader, EmptyState } from "@/components/shared/states";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Badge } from "@/components/ui/badge";
import { formatDate, one } from "@/lib/utils";

export default async function TeacherCalendarPage() {
  const profile = await requireRole("teacher");
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();
  const { data: classes } = teacher
    ? await supabase.from("classes").select("id, name").eq("teacher_id", teacher.id)
    : { data: [] };
  const classIds = (classes ?? []).map((item) => item.id);
  const { data: events } = classIds.length
    ? await supabase.from("schedules").select("*, classes(name)").in("class_id", classIds).order("start_time")
    : { data: [] };

  return (
    <div>
      <PageHeader title="Calendar" description="Schedule classes, live sessions, and exams." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {!events?.length ? (
            <EmptyState title="No scheduled sessions." />
          ) : (
            events.map((event) => {
              const cls = one(event.classes as { name: string } | { name: string }[] | null);
              return (
                <div key={event.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {cls?.name} · {formatDate(event.start_time, true)}
                    </p>
                  </div>
                  <Badge>{event.type}</Badge>
                </div>
              );
            })
          )}
        </div>
        <Card>
          <CardContent className="pt-6">
            <ActionForm action={createScheduleAction} className="space-y-3">
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
                <Label htmlFor="type">Type</Label>
                <select id="type" name="type" className="h-10 w-full rounded-md border px-3 text-sm" defaultValue="class">
                  <option value="class">Class</option>
                  <option value="live">Live</option>
                  <option value="exam">Exam</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Starts</Label>
                <Input id="startTime" name="startTime" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Ends</Label>
                <Input id="endTime" name="endTime" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Meeting URL</Label>
                <Input id="meetingUrl" name="meetingUrl" />
              </div>
              <PendingButton>Add to calendar</PendingButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
