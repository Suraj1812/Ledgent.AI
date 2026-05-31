import {
  Box,
  Card,
  CardContent,
  LinearProgress,
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
import { ExportActions, PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

export function AuditLogsPage() {
  const { data } = useQuery({ queryKey: ["audit-events"], queryFn: api.auditEvents });

  if (!data) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable evidence for login, upload, edit, approval, rejection, posting, and payment activity."
        action={<ExportActions />}
      />
      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Action" size="small" />
            <TextField label="Entity" size="small" />
            <TextField label="Actor" size="small" />
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
              {data.map((event) => (
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
