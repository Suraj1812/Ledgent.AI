import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";
import Grid from "@mui/material/GridLegacy";

export function PageSkeleton() {
  return (
    <Box aria-label="Loading page" aria-busy="true">
      <Skeleton variant="text" width="34%" height={48} />
      <Skeleton variant="text" width="62%" height={28} sx={{ mb: 2.5 }} />
      <Grid container spacing={2.5}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="55%" />
                <Skeleton variant="text" width="42%" height={42} />
                <Skeleton variant="rounded" height={8} sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Skeleton variant="rounded" height={36} />
                <Skeleton variant="rounded" height={52} />
                <Skeleton variant="rounded" height={52} />
                <Skeleton variant="rounded" height={52} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
