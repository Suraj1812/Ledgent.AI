import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { api } from "../services/api";
import type { Invoice } from "../types/domain";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const colors = ["#2457d6", "#0f8f7f", "#b7791f", "#c2413b"];

export function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  if (!data) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <PageHeader
        title="AP Command Center"
        subtitle="Monitor invoice intake, matching quality, exceptions, approvals, and ERP readiness."
        action={<Button variant="contained">Export dashboard</Button>}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            label="Total invoices"
            value={String(data.kpis.totalInvoices)}
            helper={`${data.kpis.pendingInvoices} waiting for approval`}
            icon={<ReceiptLongOutlinedIcon />}
            progress={76}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            label="Monthly spend"
            value={currency.format(data.kpis.monthlySpend)}
            helper="Forecast is tracking 8% above plan"
            icon={<PaymentsOutlinedIcon />}
            progress={82}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            label="Exception rate"
            value={`${Math.round(data.kpis.exceptionRate * 100)}%`}
            helper="Down 4 points from last month"
            icon={<ErrorOutlineOutlinedIcon />}
            progress={42}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            label="AI confidence"
            value={`${Math.round(data.kpis.aiConfidence * 100)}%`}
            helper={`Median cycle time ${data.kpis.processingTime}`}
            icon={<SpeedOutlinedIcon />}
            progress={94}
          />
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h3">Spend and exception trend</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly invoice volume normalized by exception count
                  </Typography>
                </Box>
                <QueryStatsOutlinedIcon color="primary" />
              </Stack>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.spendTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => (typeof value === "number" ? currency.format(value) : value)} />
                  <Bar dataKey="spend" fill="#2457d6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h3">Vendor exposure</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Open spend by vendor
              </Typography>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={data.vendorSpend} dataKey="value" nameKey="name" innerRadius={60} outerRadius={96}>
                    {data.vendorSpend.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => (typeof value === "number" ? currency.format(value) : value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Exception worklist
              </Typography>
              <Stack spacing={1.5}>
                {data.invoices
                  .filter((invoice: Invoice) => invoice.status === "EXCEPTION" || invoice.exceptionSummary)
                  .map((invoice: Invoice) => (
                    <Stack
                      key={invoice.id}
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "stretch", sm: "center" }}
                      spacing={1.5}
                      sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                    >
                      <Box>
                        <Typography fontWeight={700}>{invoice.invoiceNumber}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {invoice.vendorName} - {invoice.exceptionSummary ?? "Review required"}
                        </Typography>
                      </Box>
                      <StatusChip value={invoice.status} />
                    </Stack>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h3">Approval bottlenecks</Typography>
                <ApprovalOutlinedIcon color="primary" />
              </Stack>
              <List disablePadding>
                {data.approvals.map((approval) => (
                  <ListItem key={approval.id} disableGutters divider>
                    <ListItemText
                      primary={`${approval.invoiceNumber} - ${currency.format(approval.amount)}`}
                      secondary={`${approval.vendorName} waiting on ${approval.approverRole.replaceAll("_", " ")}`}
                    />
                    <Typography fontWeight={700} color={approval.bottleneckHours > 24 ? "error.main" : "warning.main"}>
                      {approval.bottleneckHours}h
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
