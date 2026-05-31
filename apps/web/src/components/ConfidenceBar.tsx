import { Box, LinearProgress, Stack, Typography } from "@mui/material";

export function ConfidenceBar({ label, value }: { label: string; value: number }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {Math.round(value * 100)}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value * 100}
        color={value > 0.9 ? "success" : value > 0.75 ? "warning" : "error"}
        sx={{ height: 8, borderRadius: 2 }}
      />
    </Box>
  );
}
