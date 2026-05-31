import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExportActions, PageHeader } from "../components/PageHeader";
import { api } from "../services/api";

const reportCards = [
  "Spend analysis",
  "Vendor analysis",
  "Approval cycle time",
  "Exception trends",
  "Monthly invoice volume",
  "Outstanding liabilities"
];

export function ReportsPage() {
  const { data } = useQuery({ queryKey: ["reports"], queryFn: api.reports });

  if (!data) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Generate finance exports for spend, vendors, approvals, exceptions, volumes, and liabilities."
        action={<ExportActions />}
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Spend forecast
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.spendTrend}>
                  <defs>
                    <linearGradient id="spend" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2457d6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2457d6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="spend" stroke="#2457d6" fill="url(#spend)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {reportCards.map((report) => (
              <Card key={report}>
                <CardContent>
                  <Typography fontWeight={700}>{report}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    PDF, Excel, and CSV export ready
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
