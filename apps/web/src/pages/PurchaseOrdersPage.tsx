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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";
import { exportCsv } from "../utils/exportCsv";
import { PageSkeleton } from "../components/PageSkeleton";
import { notify } from "../utils/notify";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function PurchaseOrdersPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = useQuery({ queryKey: ["purchase-orders"], queryFn: api.purchaseOrders });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: api.vendors });

  if (!data) {
    return <PageSkeleton />;
  }

  const approvedValue = data
    .filter((po) => po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED")
    .reduce((sum, po) => sum + po.totalAmount, 0);
  const filtered = data.filter((po) =>
    [po.poNumber, po.vendorName, po.department].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <PageHeader
        title="Purchase Orders"
        subtitle="Track commitments, receipts, budget validation, and PO history before invoice matching."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() =>
                exportCsv(
                  `ledgent-purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`,
                  filtered.map((po) => ({
                    poNumber: po.poNumber,
                    vendor: po.vendorName,
                    department: po.department,
                    status: po.status,
                    value: po.totalAmount,
                    receivedPercent: po.receivedPercent
                  }))
                )
              }
            >
              Export
            </Button>
            <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)}>
              New PO
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">Approved commitment</Typography>
              <Typography variant="h1" sx={{ mt: 2 }}>
                {currency.format(approvedValue)}
              </Typography>
              <Typography color="text.secondary">Available for invoice matching</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">Pending approval</Typography>
              <Typography variant="h1" sx={{ mt: 2 }}>
                {data.filter((po) => po.status === "PENDING_APPROVAL").length}
              </Typography>
              <Typography color="text.secondary">POs waiting on budget owners</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">Receipt coverage</Typography>
              <Typography variant="h1" sx={{ mt: 2 }}>
                {data.length ? Math.round(data.reduce((sum, po) => sum + po.receivedPercent, 0) / data.length) : 0}%
              </Typography>
              <Typography color="text.secondary">Average GRN completion</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Typography variant="h3">PO register</Typography>
                <TextField
                  size="small"
                  placeholder="Search POs"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{ width: { xs: "100%", md: 320 } }}
                />
              </Stack>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>PO number</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Received</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((po) => (
                    <TableRow hover key={po.id}>
                      <TableCell>
                        <Typography fontWeight={700}>{po.poNumber}</Typography>
                      </TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>{po.department}</TableCell>
                      <TableCell>
                        <StatusChip value={po.status} />
                      </TableCell>
                      <TableCell align="right">{currency.format(po.totalAmount)}</TableCell>
                      <TableCell align="right">{po.receivedPercent}%</TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color="text.secondary">No purchase orders match the current filters.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <PurchaseOrderDialog open={open} onClose={() => setOpen(false)} vendors={vendors} />
    </Box>
  );
}

type PurchaseOrderDialogProps = {
  open: boolean;
  onClose: () => void;
  vendors: Awaited<ReturnType<typeof api.vendors>>;
};

function PurchaseOrderDialog({ open, onClose, vendors }: PurchaseOrderDialogProps) {
  const queryClient = useQueryClient();
  const createPurchaseOrder = useMutation({
    mutationFn: api.createPurchaseOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      notify("Purchase order created successfully.");
      onClose();
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>New purchase order</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="purchase-order-form"
          spacing={2}
          sx={{ pt: 1 }}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const quantity = Number(form.get("quantity") || 1);
            const unitPrice = Number(form.get("unitPrice") || 0);
            const totalAmount = Number(form.get("totalAmount") || quantity * unitPrice);
            createPurchaseOrder.mutate({
              poNumber: String(form.get("poNumber")),
              vendorId: String(form.get("vendorId")),
              department: String(form.get("department")),
              currency: String(form.get("currency") || "USD"),
              totalAmount,
              approvedAmount: Number(form.get("approvedAmount") || totalAmount),
              status: String(form.get("status") || "DRAFT") as never,
              expectedDeliveryDate: form.get("expectedDeliveryDate")
                ? new Date(String(form.get("expectedDeliveryDate")))
                : undefined,
              lineItems: [
                {
                  description: String(form.get("lineDescription") || "Purchase order line"),
                  quantity,
                  unitPrice,
                  taxRate: Number(form.get("taxRate") || 0),
                  totalAmount
                }
              ]
            });
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField name="vendorId" label="Vendor" select required fullWidth disabled={!vendors.length} defaultValue="">
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField name="poNumber" label="PO number" required fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="department" label="Department" required fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="status" label="Status" select required fullWidth defaultValue="DRAFT">
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PENDING_APPROVAL">Pending approval</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="expectedDeliveryDate" label="Expected delivery" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="currency" label="Currency" required fullWidth defaultValue="USD" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="totalAmount" label="Total" type="number" required fullWidth inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="approvedAmount" label="Approved amount" type="number" fullWidth inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="taxRate" label="Tax rate" type="number" fullWidth defaultValue="0" inputProps={{ min: 0, step: "0.0001" }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField name="lineDescription" label="Line item" required fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="quantity" label="Quantity" type="number" required fullWidth defaultValue="1" inputProps={{ min: 0.0001, step: "0.0001" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="unitPrice" label="Unit price" type="number" required fullWidth inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
          </Grid>
          {createPurchaseOrder.error ? <Typography color="error">{createPurchaseOrder.error.message}</Typography> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="purchase-order-form" variant="contained" disabled={createPurchaseOrder.isPending || !vendors.length}>
          Create PO
        </Button>
      </DialogActions>
    </Dialog>
  );
}
