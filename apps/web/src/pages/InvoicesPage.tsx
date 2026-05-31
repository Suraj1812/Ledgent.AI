import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
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
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { UploadDropzone } from "../components/UploadDropzone";
import { api } from "../services/api";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function InvoicesPage() {
  const [tab, setTab] = useState("ALL");
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["invoices"], queryFn: api.invoices });

  if (!data) {
    return <LinearProgress />;
  }

  const visible = tab === "ALL" ? data : data.filter((invoice) => invoice.status === tab);
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
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />}>
              Export
            </Button>
            <Button variant="contained" startIcon={<AutoFixHighOutlinedIcon />}>
              Run AI agents
            </Button>
          </Stack>
        }
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={4}>
          <UploadDropzone />
        </Grid>
        <Grid item xs={12} lg={8}>
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
                <TextField size="small" placeholder="Search invoices" sx={{ width: { xs: "100%", lg: 320 } }} />
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
