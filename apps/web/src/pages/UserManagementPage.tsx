import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

export function UserManagementPage() {
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: api.users });

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Configure role-based access, custom permissions, session status, and MFA enforcement."
        action={
          <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />}>
            Invite user
          </Button>
        }
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>MFA</TableCell>
                    <TableCell align="right">Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow hover key={user.email}>
                      <TableCell>
                        <Typography fontWeight={700}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.role.replaceAll("_", " ")}</TableCell>
                      <TableCell>{user.mfaEnabled ? "Enabled" : "Required"}</TableCell>
                      <TableCell align="right">
                        <Switch checked={user.isActive} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">Permission template</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField label="Role" select defaultValue="FINANCE_MANAGER">
                  <MenuItem value="FINANCE_ADMIN">Finance Admin</MenuItem>
                  <MenuItem value="AP_ACCOUNTANT">AP Accountant</MenuItem>
                  <MenuItem value="FINANCE_MANAGER">Finance Manager</MenuItem>
                  <MenuItem value="AUDITOR">Auditor</MenuItem>
                </TextField>
                <TextField label="Permissions" multiline minRows={7} defaultValue={"dashboard:read\ninvoices:approve\nreports:read\naudit:read"} />
                <Button variant="outlined">Update template</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
