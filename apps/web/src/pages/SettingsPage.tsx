import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: organization } = useQuery({ queryKey: ["organization"], queryFn: api.organization });
  const updateSettings = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
    }
  });

  if (!organization) {
    return <LinearProgress />;
  }

  const settings = organization.settings ?? {};

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage tenant preferences, security posture, matching tolerances, ERP connections, and notification rules."
        action={
          <Button variant="contained" startIcon={<SaveOutlinedIcon />} type="submit" form="settings-form" disabled={updateSettings.isPending}>
            Save settings
          </Button>
        }
      />
      <Grid
        container
        spacing={2.5}
        component="form"
        id="settings-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          updateSettings.mutate({
            matchingTolerancePercent: Number(form.get("matchingTolerancePercent") || 0),
            quantityTolerancePercent: Number(form.get("quantityTolerancePercent") || 0),
            currencyPolicy: String(form.get("currencyPolicy") || "block"),
            duplicateDetectionEnabled: form.get("duplicateDetectionEnabled") === "on",
            requirePoAboveThreshold: form.get("requirePoAboveThreshold") === "on",
            mfaRequiredForFinanceAdmins: form.get("mfaRequiredForFinanceAdmins") === "on",
            notifyApproversBeforeSlaBreach: form.get("notifyApproversBeforeSlaBreach") === "on",
            archiveOriginalDocuments: form.get("archiveOriginalDocuments") === "on",
            sessionTimeoutMinutes: Number(form.get("sessionTimeoutMinutes") || 30),
            defaultErp: String(form.get("defaultErp") || "NETSUITE")
          });
        }}
      >
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h3">Matching policy</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <TextField
                  name="matchingTolerancePercent"
                  label="Amount tolerance %"
                  type="number"
                  defaultValue={settings.matchingTolerancePercent ?? 2}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  name="quantityTolerancePercent"
                  label="Quantity tolerance %"
                  type="number"
                  defaultValue={settings.quantityTolerancePercent ?? 1}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField name="currencyPolicy" label="Currency policy" select defaultValue={settings.currencyPolicy ?? "block"}>
                  <MenuItem value="block">Block mismatches</MenuItem>
                  <MenuItem value="review">Send to review</MenuItem>
                </TextField>
                <FormControlLabel
                  control={<Checkbox name="duplicateDetectionEnabled" defaultChecked={settings.duplicateDetectionEnabled ?? true} />}
                  label="Enable duplicate detection"
                />
                <FormControlLabel
                  control={<Checkbox name="requirePoAboveThreshold" defaultChecked={settings.requirePoAboveThreshold ?? true} />}
                  label="Require PO for payments above threshold"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h3">Security and notifications</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Checkbox name="mfaRequiredForFinanceAdmins" defaultChecked={settings.mfaRequiredForFinanceAdmins ?? true} />}
                  label="Require MFA for finance admins"
                />
                <FormControlLabel
                  control={<Checkbox name="notifyApproversBeforeSlaBreach" defaultChecked={settings.notifyApproversBeforeSlaBreach ?? true} />}
                  label="Notify approvers before SLA breach"
                />
                <FormControlLabel
                  control={<Checkbox name="archiveOriginalDocuments" defaultChecked={settings.archiveOriginalDocuments ?? false} />}
                  label="Archive original documents"
                />
                <TextField
                  name="sessionTimeoutMinutes"
                  label="Session timeout minutes"
                  type="number"
                  defaultValue={settings.sessionTimeoutMinutes ?? 30}
                  inputProps={{ min: 5, step: "1" }}
                />
                <TextField name="defaultErp" label="Default ERP" select defaultValue={settings.defaultErp ?? "NETSUITE"}>
                  <MenuItem value="SAP">SAP</MenuItem>
                  <MenuItem value="NETSUITE">Oracle NetSuite</MenuItem>
                  <MenuItem value="QUICKBOOKS">QuickBooks</MenuItem>
                  <MenuItem value="ZOHO_BOOKS">Zoho Books</MenuItem>
                  <MenuItem value="DYNAMICS">Microsoft Dynamics</MenuItem>
                </TextField>
                {updateSettings.error ? <Typography color="error">{updateSettings.error.message}</Typography> : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
