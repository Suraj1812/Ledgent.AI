import { Box, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  progress?: number;
};

export function MetricCard({ label, value, helper, icon, progress }: MetricCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              bgcolor: "rgba(231, 198, 139, 0.24)",
              borderRadius: 2
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {helper}
        </Typography>
        {progress !== undefined ? (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 2, height: 8, borderRadius: 2, bgcolor: "rgba(231, 198, 139, 0.22)" }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
