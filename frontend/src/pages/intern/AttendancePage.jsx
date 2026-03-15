import React from "react";
import AttendancePanel from "../../components/AttendancePanel";
import LeaveRequestsPanel from "../../components/LeaveRequestsPanel";

export default function AttendancePage() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <AttendancePanel variant="intern" title="My Attendance" />
      <LeaveRequestsPanel variant="intern" />
    </div>
  );
}
