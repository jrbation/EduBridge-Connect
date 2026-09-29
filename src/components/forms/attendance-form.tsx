"use client";

import { useMemo, useState } from "react";
import { saveAttendanceAction } from "@/actions/academic";
import { PendingButton, ActionForm } from "@/components/forms/pending-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AttendanceStatus } from "@/types/database";

const STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];

export function AttendanceForm({
  classId,
  students,
  defaultDate,
}: {
  classId: string;
  students: { id: string; name: string }[];
  defaultDate: string;
}) {
  const [date, setDate] = useState(defaultDate);
  const [rows, setRows] = useState(
    students.map((student) => ({ studentId: student.id, status: "present" as AttendanceStatus, remarks: "" })),
  );

  const payload = useMemo(() => JSON.stringify(rows), [rows]);

  return (
    <ActionForm action={saveAttendanceAction} className="space-y-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="payload" value={payload} />
      <div className="max-w-xs space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </div>
      <div className="space-y-3">
        {students.map((student, index) => (
          <div key={student.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_10rem_1fr] sm:items-center">
            <p className="font-medium">{student.name}</p>
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={rows[index]?.status}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...next[index], status: event.target.value as AttendanceStatus };
                setRows(next);
              }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Input
              placeholder="Remarks"
              value={rows[index]?.remarks}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...next[index], remarks: event.target.value };
                setRows(next);
              }}
            />
          </div>
        ))}
      </div>
      <PendingButton>Save attendance</PendingButton>
    </ActionForm>
  );
}
