import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
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
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function PurchaseOrdersPage() {
  const { data } = useQuery({ queryKey: ["purchase-orders"], queryFn: api.purchaseOrders });

  if (!data) {
    return <LinearProgress />;
  }

  const approvedValue = data
    .filter((po) => po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED")
    .reduce((sum, po) => sum + po.totalAmount, 0);

  return (
    <Box>
      <PageHeader
        title="Purchase Orders"
        subtitle="Track commitments, receipts, budget validation, and PO history before invoice matching."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<UploadFileOutlinedIcon />}>
              Import
            </Button>
            <Button variant="contained" startIcon={<AddOutlinedIcon />}>
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
                <TextField size="small" placeholder="Search POs" sx={{ width: { xs: "100%", md: 320 } }} />
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
                  {data.map((po) => (
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
