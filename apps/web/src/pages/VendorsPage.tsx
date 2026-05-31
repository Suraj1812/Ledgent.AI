import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { vendorSchema } from "@ledgent/contracts";
import type { z } from "zod";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";
import { exportCsv } from "../utils/exportCsv";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function VendorsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = useQuery({ queryKey: ["vendors"], queryFn: api.vendors });

  if (!data) {
    return <LinearProgress />;
  }

  const filtered = data.filter((vendor) => vendor.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <PageHeader
        title="Vendor Management"
        subtitle="Onboard suppliers, monitor payment terms, maintain tax profiles, and track vendor risk."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() =>
                exportCsv(
                  `ledgent-vendors-${new Date().toISOString().slice(0, 10)}.csv`,
                  filtered.map((vendor) => ({
                    name: vendor.name,
                    riskLevel: vendor.riskLevel,
                    paymentTerms: vendor.paymentTerms,
                    outstandingBalance: vendor.outstandingBalance,
                    exceptionRate: Math.round(vendor.exceptionRate * 100)
                  }))
                )
              }
            >
              Export
            </Button>
            <Button variant="contained" startIcon={<AddBusinessOutlinedIcon />} onClick={() => setOpen(true)}>
              New vendor
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">Onboarding queue</Typography>
              <Typography variant="h1" sx={{ mt: 2 }}>
                {data.filter((vendor) => vendor.lastInvoiceAt === "No invoices").length}
              </Typography>
              <Typography color="text.secondary">Vendors awaiting tax and bank verification</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">High-risk vendors</Typography>
              <Typography variant="h1" sx={{ mt: 2 }}>
                {data.filter((vendor) => vendor.riskLevel === "HIGH").length}
              </Typography>
              <Typography color="text.secondary">Require controller review before payment</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">Outstanding balance</Typography>
              <Typography variant="h1" sx={{ mt: 2 }}>
                {currency.format(data.reduce((sum, vendor) => sum + vendor.outstandingBalance, 0))}
              </Typography>
              <Typography color="text.secondary">Across active supplier accounts</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Typography variant="h3">Supplier directory</Typography>
                <TextField
                  size="small"
                  placeholder="Search vendors"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{ width: { xs: "100%", md: 320 } }}
                />
              </Stack>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Payment terms</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell align="right">Exception rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((vendor) => (
                    <TableRow key={vendor.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{vendor.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last invoice {vendor.lastInvoiceAt}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip value={vendor.riskLevel} />
                      </TableCell>
                      <TableCell>{vendor.paymentTerms}</TableCell>
                      <TableCell align="right">{currency.format(vendor.outstandingBalance)}</TableCell>
                      <TableCell align="right">{Math.round(vendor.exceptionRate * 100)}%</TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary">No vendors match the current filters.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <VendorDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

type VendorFormValues = z.input<typeof vendorSchema>;

function VendorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const createVendor = useMutation({
    mutationFn: api.createVendor,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vendors"] });
      onClose();
    }
  });
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      paymentTerms: "Net 30",
      currency: "USD",
      riskLevel: "LOW"
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New vendor</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="vendor-form"
          spacing={2}
          sx={{ pt: 1 }}
          onSubmit={handleSubmit((values) => createVendor.mutate(values))}
        >
          <TextField label="Vendor name" error={Boolean(errors.name)} helperText={errors.name?.message} {...register("name")} />
          <TextField label="Legal name" {...register("legalName")} />
          <TextField label="Tax ID" {...register("taxId")} />
          <TextField label="Email" error={Boolean(errors.email)} helperText={errors.email?.message} {...register("email")} />
          <TextField label="Payment terms" {...register("paymentTerms")} />
          <TextField label="Currency" {...register("currency")} />
          <TextField label="Risk level" select defaultValue="LOW" {...register("riskLevel")}>
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="BLOCKED">Blocked</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="vendor-form" variant="contained" disabled={createVendor.isPending}>
          Create vendor
        </Button>
      </DialogActions>
    </Dialog>
  );
}
