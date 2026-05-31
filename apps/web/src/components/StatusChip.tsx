import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";

const statusColor: Record<string, ChipProps["color"]> = {
  APPROVED: "success",
  POSTED: "success",
  PAID: "success",
  PENDING_APPROVAL: "warning",
  AP_REVIEW: "info",
  EXTRACTING: "info",
  MATCHING: "info",
  EXCEPTION: "error",
  REJECTED: "error",
  HIGH: "error",
  BLOCKED: "error",
  MEDIUM: "warning",
  LOW: "success",
  DRAFT: "default",
  CANCELLED: "default",
  CLOSED: "default",
  RECEIVED: "success",
  PARTIALLY_RECEIVED: "warning"
};

export function StatusChip({ value }: { value: string }) {
  return <Chip size="small" color={statusColor[value] ?? "default"} label={value.replaceAll("_", " ")} />;
}
