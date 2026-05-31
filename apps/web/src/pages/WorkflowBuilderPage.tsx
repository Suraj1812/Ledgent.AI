import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { PageSkeleton } from "../components/PageSkeleton";
import { api } from "../services/api";
import { notify } from "../utils/notify";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function WorkflowBuilderPage() {
  const queryClient = useQueryClient();
  const { data: workflows = [], isLoading } = useQuery({ queryKey: ["workflows"], queryFn: api.workflows });
  const createWorkflow = useMutation({
    mutationFn: api.createWorkflow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workflows"] });
      notify("Approval workflow created.");
    }
  });
  const steps = workflows.flatMap((workflow) =>
    workflow.steps.map((step: any) => ({
      id: step.id,
      name: step.name,
      role: step.approverRole.replaceAll("_", " "),
      threshold: currency.format(Number(step.thresholdAmount ?? 0)),
      escalation: `${step.escalationHours}h`
    }))
  );

  if (isLoading) return <PageSkeleton />;

  return (
    <Box>
      <PageHeader
        title="Workflow Builder"
        subtitle="Configure dynamic approval paths with threshold routing, escalations, delegations, and reminders."
        action={
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} type="submit" form="workflow-rule-form" disabled={createWorkflow.isPending}>
            Save workflow
          </Button>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Stack spacing={2}>
            {steps.map((step, index) => (
              <Card key={step.id}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <DragIndicatorOutlinedIcon color="disabled" />
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2,
                        bgcolor: "rgba(15, 143, 127, 0.1)",
                        color: "secondary.main",
                        fontWeight: 800
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h3">{step.name}</Typography>
                      <Typography color="text.secondary">
                        {step.role} - threshold {step.threshold} - escalation {step.escalation}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {!steps.length ? (
              <Card>
                <CardContent>
                  <Typography variant="h3">No workflow steps yet</Typography>
                  <Typography color="text.secondary">Create a workflow rule to start routing invoice approvals.</Typography>
                </CardContent>
              </Card>
            ) : null}
          </Stack>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h3">Rule editor</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack
                component="form"
                id="workflow-rule-form"
                spacing={2.5}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  createWorkflow.mutate({
                    name: String(form.get("name")),
                    department: String(form.get("department") || "") || undefined,
                    vendorRiskLevel: (String(form.get("vendorRiskLevel") || "") || undefined) as never,
                    approverRole: String(form.get("approverRole") || "FINANCE_MANAGER") as never,
                    thresholdAmount: Number(form.get("thresholdAmount") || 0),
                    escalationHours: Number(form.get("escalationHours") || 24)
                  });
                }}
              >
                <TextField name="name" label="Rule name" required defaultValue="Finance approval" />
                <TextField name="department" label="Department" />
                <TextField name="vendorRiskLevel" label="Vendor risk" select defaultValue="">
                  <MenuItem value="">Any risk level</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="BLOCKED">Blocked</MenuItem>
                </TextField>
                <TextField name="approverRole" label="Approver role" select defaultValue="FINANCE_MANAGER">
                  <MenuItem value="FINANCE_MANAGER">Finance Manager</MenuItem>
                  <MenuItem value="CONTROLLER">Controller</MenuItem>
                  <MenuItem value="CFO">CFO</MenuItem>
                </TextField>
                <TextField name="thresholdAmount" label="Threshold amount" type="number" required defaultValue="0" inputProps={{ min: 0, step: "0.01" }} />
                <TextField name="escalationHours" label="Escalation hours" type="number" required defaultValue="24" inputProps={{ min: 1, step: "1" }} />
                {createWorkflow.error ? <Typography color="error">{createWorkflow.error.message}</Typography> : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
