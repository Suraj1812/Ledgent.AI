import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { PageHeader } from "../components/PageHeader";

export function SettingsPage() {
  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage tenant preferences, security posture, matching tolerances, ERP connections, and notification rules."
        action={
          <Button variant="contained" startIcon={<SaveOutlinedIcon />}>
            Save settings
          </Button>
        }
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h3">Matching policy</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <TextField label="Amount tolerance" defaultValue="2%" />
                <TextField label="Quantity tolerance" defaultValue="1%" />
                <TextField label="Currency policy" select defaultValue="block">
                  <MenuItem value="block">Block mismatches</MenuItem>
                  <MenuItem value="review">Send to review</MenuItem>
                </TextField>
                <FormControlLabel control={<Checkbox defaultChecked />} label="Enable duplicate detection" />
                <FormControlLabel control={<Checkbox defaultChecked />} label="Require PO for payments above threshold" />
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
                <FormControlLabel control={<Checkbox defaultChecked />} label="Require MFA for finance admins" />
                <FormControlLabel control={<Checkbox defaultChecked />} label="Notify approvers before SLA breach" />
                <FormControlLabel control={<Checkbox defaultChecked />} label="Archive original documents to S3" />
                <TextField label="Session timeout" defaultValue="30 minutes" />
                <TextField label="Default ERP" select defaultValue="NETSUITE">
                  <MenuItem value="SAP">SAP</MenuItem>
                  <MenuItem value="NETSUITE">Oracle NetSuite</MenuItem>
                  <MenuItem value="QUICKBOOKS">QuickBooks</MenuItem>
                  <MenuItem value="ZOHO_BOOKS">Zoho Books</MenuItem>
                  <MenuItem value="DYNAMICS">Microsoft Dynamics</MenuItem>
                </TextField>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
