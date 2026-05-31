import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { PageHeader } from "../components/PageHeader";
import { api } from "../services/api";
import { exportCsv } from "../utils/exportCsv";
import { PageSkeleton } from "../components/PageSkeleton";

export function ReportsPage() {
  const { data } = useQuery({ queryKey: ["reports"], queryFn: api.reports });

  if (!data) {
    return <PageSkeleton />;
  }

  const totalSpend = data.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const exceptions = data.invoices.filter((invoice) => invoice.status === "EXCEPTION").length;
  const outstanding = data.vendors.reduce((sum, vendor) => sum + vendor.outstandingBalance, 0);
  const reportCards = [
    ["Invoices", data.invoices.length],
    ["Vendors", data.vendors.length],
    ["Exceptions", exceptions],
    ["Outstanding", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(outstanding)],
    ["Total spend", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalSpend)]
  ];

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Generate finance exports for spend, vendors, approvals, exceptions, volumes, and liabilities."
        action={
          <Button
            variant="contained"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() =>
              exportCsv(
                `ledgent-report-${new Date().toISOString().slice(0, 10)}.csv`,
                data.invoices.map((invoice) => ({
                  invoiceNumber: invoice.invoiceNumber,
                  vendor: invoice.vendorName,
                  status: invoice.status,
                  amount: invoice.totalAmount,
                  dueDate: invoice.dueDate
                }))
              )
            }
          >
            Export report
          </Button>
        }
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Spend analysis
              </Typography>
              {data.spendTrend.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={data.spendTrend}>
                    <defs>
                      <linearGradient id="spend" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#d5a858" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#d5a858" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="spend" stroke="#3b342b" fill="url(#spend)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Stack sx={{ height: 280 }} alignItems="center" justifyContent="center">
                  <Typography color="text.secondary">No reportable invoice spend has been recorded yet.</Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {reportCards.map(([label, value]) => (
              <Card key={label}>
                <CardContent>
                  <Typography color="text.secondary">{label}</Typography>
                  <Typography variant="h2">{value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
