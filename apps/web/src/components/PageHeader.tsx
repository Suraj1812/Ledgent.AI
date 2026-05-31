import { Box, Button, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h1">{title}</Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action ? <Box>{action}</Box> : null}
    </Stack>
  );
}

export function ExportActions() {
  return (
    <Stack direction="row" spacing={1}>
      <Button variant="outlined">CSV</Button>
      <Button variant="outlined">Excel</Button>
      <Button variant="contained">PDF</Button>
    </Stack>
  );
}
