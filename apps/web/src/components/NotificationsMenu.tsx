import { Badge, Box, IconButton, List, ListItemButton, ListItemText, Menu, Tooltip, Typography } from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../services/api";

export function NotificationsMenu() {
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: api.notifications });
  const markRead = useMutation({
    mutationFn: api.markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<any[]>(["notifications"]);
      queryClient.setQueryData<any[]>(["notifications"], (current = []) =>
        current.map((notification) => (notification.id === id ? { ...notification, readAt: new Date().toISOString() } : notification))
      );
      return { previous };
    },
    onError: (_error, _id, context) => queryClient.setQueryData(["notifications"], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton aria-label={`${unreadCount} unread notifications`} onClick={(event) => setAnchorEl(event.currentTarget)}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { width: 360, maxWidth: "calc(100vw - 24px)", maxHeight: 420 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="h3">Notifications</Typography>
        </Box>
        <List disablePadding>
          {notifications.length ? (
            notifications.map((notification) => (
              <ListItemButton
                key={notification.id}
                selected={!notification.readAt}
                onClick={() => {
                  if (!notification.readAt) markRead.mutate(notification.id);
                }}
              >
                <ListItemText
                  primary={notification.title}
                  secondary={`${notification.body} ${new Date(notification.createdAt).toLocaleString()}`}
                />
              </ListItemButton>
            ))
          ) : (
            <ListItemText sx={{ px: 2, py: 1 }} primary="No notifications yet." />
          )}
        </List>
      </Menu>
    </>
  );
}
