import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ConfidenceBar } from "../components/ConfidenceBar";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function InvoiceDetailPage() {
  const { id = "inv-1" } = useParams();
  const { data } = useQuery({ queryKey: ["invoice", id], queryFn: () => api.invoice(id) });

  if (!data) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <PageHeader
        title={data.invoiceNumber}
        subtitle={`${data.vendorName} - due ${data.dueDate}`}
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AutoFixHighOutlinedIcon />}>
              Re-run extraction
            </Button>
            <Button variant="contained" startIcon={<ApprovalOutlinedIcon />}>
              Route approval
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h3">Invoice summary</Typography>
                  <Typography color="text.secondary">Captured document, extracted fields, PO match, and ERP posting state</Typography>
                </Box>
                <StatusChip value={data.status} />
              </Stack>
              {data.exceptionSummary ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {data.exceptionSummary}
                </Alert>
              ) : null}
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Vendor
                  </Typography>
                  <Typography fontWeight={700}>{data.vendorName}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    PO number
                  </Typography>
                  <Typography fontWeight={700}>{data.poNumber ?? "Missing"}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography fontWeight={700}>{currency.format(data.totalAmount)}</Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h3" sx={{ mb: 2 }}>
                Line items
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit</TableCell>
                    <TableCell align="right">Tax</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.lineItems ?? []).map((line) => (
                    <TableRow key={line.description}>
                      <TableCell>{line.description}</TableCell>
                      <TableCell align="right">{line.quantity}</TableCell>
                      <TableCell align="right">{currency.format(line.unitPrice)}</TableCell>
                      <TableCell align="right">{currency.format(line.taxAmount)}</TableCell>
                      <TableCell align="right">{currency.format(line.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  AI extraction
                </Typography>
                <Stack spacing={2}>
                  <ConfidenceBar label="Vendor name" value={0.96} />
                  <ConfidenceBar label="Invoice number" value={0.98} />
                  <ConfidenceBar label="Tax amount" value={0.84} />
                  <ConfidenceBar label="Line item capture" value={data.extractionScore} />
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ mb: 2 }}>
                  Matching results
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SyncAltOutlinedIcon color="primary" />
                      <Typography>2-way amount check</Typography>
                    </Stack>
                    <Typography fontWeight={700}>{Math.round(data.matchScore * 100)}%</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CloudDoneOutlinedIcon color="success" />
                      <Typography>Document archived</Typography>
                    </Stack>
                    <Typography fontWeight={700}>Ready</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  Activity
                </Typography>
                <List disablePadding>
                  {["Uploaded by AP inbox", "OCR extraction completed", "Amount variance detected", "Finance manager assigned"].map(
                    (event) => (
                      <ListItem key={event} disableGutters divider>
                        <ListItemText primary={event} secondary="Today" />
                      </ListItem>
                    )
                  )}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
