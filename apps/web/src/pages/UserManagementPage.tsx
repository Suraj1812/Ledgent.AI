import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

export function UserManagementPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: api.users });
  const updateStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.updateUserStatus(id, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Configure role-based access, custom permissions, session status, and MFA enforcement."
        action={
          <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setOpen(true)}>
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
                        <Switch
                          checked={user.isActive}
                          disabled={updateStatus.isPending}
                          onChange={(event) => updateStatus.mutate({ id: user.id, isActive: event.target.checked })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!users.length ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">No users have been created yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">Access summary</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Typography color="text.secondary">Active users</Typography>
                <Typography variant="h1">{users.filter((user) => user.isActive).length}</Typography>
                <Typography color="text.secondary">Finance admins</Typography>
                <Typography variant="h1">{users.filter((user) => user.role === "FINANCE_ADMIN").length}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <InviteUserDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

function InviteUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const createUser = useMutation({
    mutationFn: api.createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite user</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="invite-user-form"
          spacing={2}
          sx={{ pt: 1 }}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            createUser.mutate({
              email: String(form.get("email")),
              firstName: String(form.get("firstName")),
              lastName: String(form.get("lastName")),
              role: String(form.get("role")),
              password: String(form.get("password")),
              permissions: []
            });
          }}
        >
          <TextField name="email" label="Email" type="email" required />
          <TextField name="firstName" label="First name" required />
          <TextField name="lastName" label="Last name" required />
          <TextField name="role" label="Role" select defaultValue="FINANCE_MANAGER">
            <MenuItem value="FINANCE_ADMIN">Finance Admin</MenuItem>
            <MenuItem value="AP_ACCOUNTANT">AP Accountant</MenuItem>
            <MenuItem value="FINANCE_MANAGER">Finance Manager</MenuItem>
            <MenuItem value="CONTROLLER">Controller</MenuItem>
            <MenuItem value="CFO">CFO</MenuItem>
            <MenuItem value="AUDITOR">Auditor</MenuItem>
            <MenuItem value="READ_ONLY">Read Only</MenuItem>
          </TextField>
          <TextField name="password" label="Temporary password" type="password" required inputProps={{ minLength: 12 }} />
          {createUser.error ? <Typography color="error">{createUser.error.message}</Typography> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="invite-user-form" variant="contained" disabled={createUser.isPending}>
          Create user
        </Button>
      </DialogActions>
    </Dialog>
  );
}
