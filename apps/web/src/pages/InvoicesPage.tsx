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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";
import { exportCsv } from "../utils/exportCsv";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function InvoicesPage() {
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["invoices"], queryFn: api.invoices });
  const { data: vendors = [] } = useQuery({ queryKey: ["vendors"], queryFn: api.vendors });
  const { data: purchaseOrders = [] } = useQuery({ queryKey: ["purchase-orders"], queryFn: api.purchaseOrders });

  if (!data) {
    return <LinearProgress />;
  }

  const visible = (tab === "ALL" ? data : data.filter((invoice) => invoice.status === tab)).filter((invoice) =>
    [invoice.invoiceNumber, invoice.vendorName, invoice.poNumber ?? ""].join(" ").toLowerCase().includes(search.toLowerCase())
  );
  const duplicatesBlocked = data.filter((invoice) => invoice.exceptionSummary?.toLowerCase().includes("duplicate")).length;
  const averageConfidence = data.length
    ? Math.round((data.reduce((sum, invoice) => sum + invoice.extractionScore, 0) / data.length) * 100)
    : 0;

  return (
    <Box>
      <PageHeader
        title="Invoice Processing"
        subtitle="Upload, extract, match, detect exceptions, approve, post, and track payment readiness."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() =>
                exportCsv(
                  `ledgent-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
                  visible.map((invoice) => ({
                    invoiceNumber: invoice.invoiceNumber,
                    vendor: invoice.vendorName,
                    poNumber: invoice.poNumber,
                    status: invoice.status,
                    amount: invoice.totalAmount,
                    dueDate: invoice.dueDate,
                    extractionScore: Math.round(invoice.extractionScore * 100),
                    matchScore: Math.round(invoice.matchScore * 100)
                  }))
                )
              }
            >
              Export
            </Button>
            <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)}>
              New invoice
            </Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h3">Intake health</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {[
                  ["Invoices tracked", String(data.length)],
                  ["Need review", String(data.filter((invoice) => invoice.status === "AP_REVIEW").length)],
                  ["Duplicates blocked", String(duplicatesBlocked)],
                  ["Avg AI confidence", `${averageConfidence}%`]
                ].map(([label, value]) => (
                  <Grid item xs={6} md={3} key={label}>
                    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                      <Typography variant="h2">{value}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" allowScrollButtonsMobile>
                  <Tab label="All" value="ALL" />
                  <Tab label="AP review" value="AP_REVIEW" />
                  <Tab label="Exceptions" value="EXCEPTION" />
                  <Tab label="Pending approval" value="PENDING_APPROVAL" />
                  <Tab label="Posted" value="POSTED" />
                </Tabs>
                <TextField
                  size="small"
                  placeholder="Search invoices"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{ width: { xs: "100%", lg: 320 } }}
                />
              </Stack>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>PO</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">AI confidence</TableCell>
                    <TableCell align="right">Match score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((invoice) => (
                    <TableRow
                      hover
                      key={invoice.id}
                      tabIndex={0}
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          navigate(`/invoices/${invoice.id}`);
                        }
                      }}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Typography fontWeight={700} color="primary">
                          {invoice.invoiceNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due {invoice.dueDate}
                        </Typography>
                      </TableCell>
                      <TableCell>{invoice.vendorName}</TableCell>
                      <TableCell>{invoice.poNumber ?? "Missing"}</TableCell>
                      <TableCell>
                        <StatusChip value={invoice.status} />
                      </TableCell>
                      <TableCell align="right">{currency.format(invoice.totalAmount)}</TableCell>
                      <TableCell align="right">{Math.round(invoice.extractionScore * 100)}%</TableCell>
                      <TableCell align="right">{Math.round(invoice.matchScore * 100)}%</TableCell>
                    </TableRow>
                  ))}
                  {!visible.length ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography color="text.secondary">No invoices match the current filters.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <InvoiceDialog open={open} onClose={() => setOpen(false)} vendors={vendors} purchaseOrders={purchaseOrders} />
    </Box>
  );
}

type InvoiceDialogProps = {
  open: boolean;
  onClose: () => void;
  vendors: Awaited<ReturnType<typeof api.vendors>>;
  purchaseOrders: Awaited<ReturnType<typeof api.purchaseOrders>>;
};

function InvoiceDialog({ open, onClose, vendors, purchaseOrders }: InvoiceDialogProps) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const createInvoice = useMutation({
    mutationFn: api.createInvoice,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>New invoice</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="invoice-form"
          spacing={2}
          sx={{ pt: 1 }}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const quantity = Number(form.get("quantity") || 1);
            const unitPrice = Number(form.get("unitPrice") || 0);
            const lineTaxAmount = Number(form.get("lineTaxAmount") || 0);
            const lineTotalAmount = Number(form.get("lineTotalAmount") || quantity * unitPrice + lineTaxAmount);
            createInvoice.mutate({
              vendorId: String(form.get("vendorId")),
              purchaseOrderId: String(form.get("purchaseOrderId") || "") || undefined,
              invoiceNumber: String(form.get("invoiceNumber")),
              invoiceDate: new Date(String(form.get("invoiceDate"))),
              dueDate: new Date(String(form.get("dueDate"))),
              currency: String(form.get("currency") || "USD"),
              subtotalAmount: Number(form.get("subtotalAmount") || 0),
              taxAmount: Number(form.get("taxAmount") || 0),
              totalAmount: Number(form.get("totalAmount") || 0),
              paymentTerms: String(form.get("paymentTerms") || "Net 30"),
              lineItems: [
                {
                  description: String(form.get("lineDescription") || "Invoice line"),
                  quantity,
                  unitPrice,
                  taxAmount: lineTaxAmount,
                  totalAmount: lineTotalAmount
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
              <TextField name="purchaseOrderId" label="Purchase order" select fullWidth defaultValue="">
                <MenuItem value="">None</MenuItem>
                {purchaseOrders.map((po) => (
                  <MenuItem key={po.id} value={po.id}>
                    {po.poNumber} - {po.vendorName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="invoiceNumber" label="Invoice number" required fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="invoiceDate" label="Invoice date" type="date" required fullWidth defaultValue={today} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="dueDate" label="Due date" type="date" required fullWidth defaultValue={today} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="currency" label="Currency" required fullWidth defaultValue="USD" />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="subtotalAmount" label="Subtotal" type="number" required fullWidth inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="taxAmount" label="Tax" type="number" required fullWidth defaultValue="0" inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="totalAmount" label="Total" type="number" required fullWidth inputProps={{ min: 0.01, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField name="paymentTerms" label="Payment terms" required fullWidth defaultValue="Net 30" />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField name="lineDescription" label="Line item" required fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="quantity" label="Quantity" type="number" required fullWidth defaultValue="1" inputProps={{ min: 0.0001, step: "0.0001" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="unitPrice" label="Unit price" type="number" required fullWidth inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="lineTaxAmount" label="Line tax" type="number" required fullWidth defaultValue="0" inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField name="lineTotalAmount" label="Line total" type="number" required fullWidth inputProps={{ min: 0, step: "0.01" }} />
            </Grid>
          </Grid>
          {createInvoice.error ? <Typography color="error">{createInvoice.error.message}</Typography> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="invoice-form" variant="contained" disabled={createInvoice.isPending || !vendors.length}>
          Create invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
}
