import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ForwardToInboxOutlinedIcon from "@mui/icons-material/ForwardToInboxOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ApprovalCenterPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["approvals"], queryFn: api.approvals });
  const decision = useMutation({
    mutationFn: ({ taskId, decision }: { taskId: string; decision: "APPROVE" | "REJECT" | "REQUEST_CHANGES" }) =>
      api.decideApproval(taskId, { decision }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["approvals"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] })
      ]);
    }
  });

  if (!data) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <PageHeader
        title="Approval Center"
        subtitle="Review routed invoices, resolve bottlenecks, delegate work, and preserve approval evidence."
      />

      <Grid container spacing={2.5}>
        {data.map((approval) => (
          <Grid item xs={12} md={6} key={approval.id}>
            <Card>
              <CardContent>
                <Stack spacing={2.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box>
                      <Typography variant="h3">{approval.invoiceNumber}</Typography>
                      <Typography color="text.secondary">{approval.vendorName}</Typography>
                    </Box>
                    <StatusChip value={approval.status} />
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography fontWeight={700}>{currency.format(approval.amount)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Role
                      </Typography>
                      <Typography fontWeight={700}>{approval.approverRole.replaceAll("_", " ")}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Bottleneck
                      </Typography>
                      <Typography fontWeight={700} color={approval.bottleneckHours > 24 ? "error.main" : "warning.main"}>
                        {approval.bottleneckHours} hours
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Due
                      </Typography>
                      <Typography fontWeight={700}>{new Date(approval.dueAt).toLocaleDateString()}</Typography>
                    </Grid>
                  </Grid>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleOutlineIcon />}
                      disabled={decision.isPending}
                      onClick={() => decision.mutate({ taskId: approval.id, decision: "APPROVE" })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CloseOutlinedIcon />}
                      disabled={decision.isPending}
                      onClick={() => decision.mutate({ taskId: approval.id, decision: "REJECT" })}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ForwardToInboxOutlinedIcon />}
                      disabled={decision.isPending}
                      onClick={() => decision.mutate({ taskId: approval.id, decision: "REQUEST_CHANGES" })}
                    >
                      Request changes
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!data.length ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">No approval tasks are assigned to you right now.</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : null}
      </Grid>
    </Box>
  );
}
