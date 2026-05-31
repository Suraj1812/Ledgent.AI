import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import ApprovalOutlinedIcon from "@mui/icons-material/ApprovalOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { setCopilotOpen, setSidebarOpen } from "../store/app-slice";
import { api, getCurrentUser } from "../services/api";

const drawerWidth = 272;

const navItems = [
  { label: "Dashboard", path: "/", icon: <DashboardOutlinedIcon /> },
  { label: "Vendors", path: "/vendors", icon: <StorefrontOutlinedIcon /> },
  { label: "Purchase Orders", path: "/purchase-orders", icon: <ReceiptLongOutlinedIcon /> },
  { label: "Invoices", path: "/invoices", icon: <DescriptionOutlinedIcon /> },
  { label: "Approvals", path: "/approvals", icon: <ApprovalOutlinedIcon /> },
  { label: "Workflows", path: "/workflows", icon: <HubOutlinedIcon /> },
  { label: "Audit Logs", path: "/audit-logs", icon: <HistoryOutlinedIcon /> },
  { label: "Reports", path: "/reports", icon: <AssessmentOutlinedIcon /> },
  { label: "Users", path: "/users", icon: <PeopleAltOutlinedIcon /> },
  { label: "Settings", path: "/settings", icon: <SettingsOutlinedIcon /> }
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const sidebarOpen = useSelector((state: RootState) => state.app.sidebarOpen);
  const currentUser = getCurrentUser();
  const initials = `${currentUser?.firstName?.[0] ?? "L"}${currentUser?.lastName?.[0] ?? "A"}`;

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5 }}>
        <Box
          component="img"
          src="/ledgent-icon.svg"
          alt="Ledgent AI"
          sx={{ width: 40, height: 40, borderRadius: 2 }}
        >
        </Box>
        <Box>
          <Typography variant="h3">Ledgent AI</Typography>
          <Typography variant="caption" color="text.secondary">
            Finance operations
          </Typography>
        </Box>
      </Stack>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const selected = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => {
                navigate(item.path);
                dispatch(setSidebarOpen(false));
              }}
              sx={{ borderRadius: 2, mb: 0.5, minHeight: 44 }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 600 }} />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: "secondary.main", color: "primary.main", fontWeight: 800 }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>
              {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Ledgent User"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {currentUser?.role.replaceAll("_", " ") ?? "Finance"}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Drawer
        variant={isDesktop ? "permanent" : "temporary"}
        open={isDesktop || sidebarOpen}
        onClose={() => dispatch(setSidebarOpen(false))}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isDesktop ? drawerWidth : undefined,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider"
          }
        }}
      >
        {drawer}
      </Drawer>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {!isDesktop ? (
              <IconButton onClick={() => dispatch(setSidebarOpen(true))} aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
            ) : null}
            <TextField
              placeholder="Search invoices, vendors, POs"
              size="small"
              sx={{ maxWidth: 420, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Tooltip title="Open Copilot">
              <IconButton color="primary" onClick={() => dispatch(setCopilotOpen(true))} aria-label="Open Copilot">
                <SmartToyOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton aria-label="Notifications">
                <NotificationsOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sign out">
              <IconButton
                aria-label="Sign out"
                onClick={async () => {
                  await api.logout();
                  navigate("/login", { replace: true });
                }}
              >
                <Avatar sx={{ width: 28, height: 28, bgcolor: "secondary.main", color: "primary.main", fontSize: 13 }}>
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
