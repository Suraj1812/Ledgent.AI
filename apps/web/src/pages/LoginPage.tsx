import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Alert from "@mui/material/Alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@ledgent/contracts";
import { useState } from "react";
import { api } from "../services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2
      }}
    >
      <Paper sx={{ width: "100%", maxWidth: 420, p: 4, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Box component="img" src="/ledgent-icon.svg" alt="Ledgent AI" sx={{ width: 64, height: 64 }} />
            <Typography variant="h1">Ledgent AI</Typography>
            <Typography color="text.secondary">Secure finance operations sign in</Typography>
          </Stack>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack
            component="form"
            spacing={2}
            onSubmit={handleSubmit(async (values) => {
              setError(null);
              try {
                await api.login(values);
                navigate("/");
              } catch (loginError) {
                setError(loginError instanceof Error ? loginError.message : "Sign in failed");
              }
            })}
          >
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register("email")}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register("password")}
            />
            <TextField label="MFA code" autoComplete="one-time-code" {...register("mfaCode")} />
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              Sign in
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
