import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function WorkflowBuilderPage() {
  const { data: workflows = [] } = useQuery({ queryKey: ["workflows"], queryFn: api.workflows });
  const steps = workflows.flatMap((workflow) =>
    workflow.steps.map((step: any) => ({
      id: step.id,
      name: step.name,
      role: step.approverRole.replaceAll("_", " "),
      threshold: currency.format(Number(step.thresholdAmount ?? 0)),
      escalation: `${step.escalationHours}h`
    }))
  );

  return (
    <Box>
      <PageHeader
        title="Workflow Builder"
        subtitle="Configure dynamic approval paths with threshold routing, escalations, delegations, and reminders."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AddOutlinedIcon />}>
              Add rule
            </Button>
            <Button variant="contained" startIcon={<SaveOutlinedIcon />}>
              Save workflow
            </Button>
          </Stack>
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
              <Stack spacing={2.5}>
                <TextField label="Rule name" defaultValue="High value invoice approval" />
                <TextField label="Department" select defaultValue="Finance">
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                </TextField>
                <TextField label="Approver role" select defaultValue="CONTROLLER">
                  <MenuItem value="FINANCE_MANAGER">Finance Manager</MenuItem>
                  <MenuItem value="CONTROLLER">Controller</MenuItem>
                  <MenuItem value="CFO">CFO</MenuItem>
                </TextField>
                <Box>
                  <Typography fontWeight={700}>Threshold amount</Typography>
                  <Slider defaultValue={50000} min={0} max={250000} step={5000} valueLabelDisplay="auto" />
                </Box>
                <FormControlLabel control={<Checkbox defaultChecked />} label="Allow delegation" />
                <FormControlLabel control={<Checkbox defaultChecked />} label="Send reminder before escalation" />
                <FormControlLabel control={<Checkbox />} label="Require CFO when vendor risk is high" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
