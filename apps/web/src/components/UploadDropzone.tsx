import { Box, Button, Stack, Typography } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";

export function UploadDropzone() {
  return (
    <Box
      sx={{
        border: "1px dashed",
        borderColor: "primary.main",
        bgcolor: "rgba(36, 87, 214, 0.05)",
        borderRadius: 2,
        p: 3,
        minHeight: 180,
        display: "grid",
        placeItems: "center",
        textAlign: "center"
      }}
    >
      <Stack spacing={2} alignItems="center">
        <CloudUploadOutlinedIcon color="primary" sx={{ fontSize: 42 }} />
        <Box>
          <Typography variant="h3">Upload invoices</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            PDF, PNG, JPG, or bundled invoice archives
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" startIcon={<CloudUploadOutlinedIcon />}>
            Select files
          </Button>
          <Button variant="outlined" startIcon={<MailOutlineIcon />}>
            Email inbox
          </Button>
          <Button variant="outlined" startIcon={<FolderZipOutlinedIcon />}>
            Bulk import
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
