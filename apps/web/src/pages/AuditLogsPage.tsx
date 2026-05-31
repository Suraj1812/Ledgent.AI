import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { exportCsv } from "../utils/exportCsv";
import { PageSkeleton } from "../components/PageSkeleton";

export function AuditLogsPage() {
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [actor, setActor] = useState("");
  const { data } = useQuery({ queryKey: ["audit-events"], queryFn: api.auditEvents });

  if (!data) {
    return <PageSkeleton />;
  }

  const filtered = data.filter((event) =>
    event.action.toLowerCase().includes(action.toLowerCase()) &&
    event.entityType.toLowerCase().includes(entity.toLowerCase()) &&
    event.actor.toLowerCase().includes(actor.toLowerCase())
  );

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable evidence for login, upload, edit, approval, rejection, posting, and payment activity."
        action={
          <Button
            variant="contained"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() =>
              exportCsv(
                `ledgent-audit-${new Date().toISOString().slice(0, 10)}.csv`,
                filtered.map((event) => ({
                  createdAt: event.createdAt,
                  action: event.action,
                  actor: event.actor,
                  entityType: event.entityType,
                  entityId: event.entityId,
                  detail: event.detail
                }))
              )
            }
          >
            Export audit
          </Button>
        }
      />
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Action" size="small" value={action} onChange={(event) => setAction(event.target.value)} />
            <TextField label="Entity" size="small" value={entity} onChange={(event) => setEntity(event.target.value)} />
            <TextField label="Actor" size="small" value={actor} onChange={(event) => setActor(event.target.value)} />
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Detail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((event) => (
                <TableRow hover key={event.id}>
                  <TableCell>{new Date(event.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>{event.action}</Typography>
                  </TableCell>
                  <TableCell>{event.actor}</TableCell>
                  <TableCell>
                    {event.entityType} {event.entityId}
                  </TableCell>
                  <TableCell>{event.detail}</TableCell>
                </TableRow>
              ))}
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No audit events match the current filters.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
