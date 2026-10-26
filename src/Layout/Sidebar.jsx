import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Ri8fit_Logo from "../../src/assets/Ri8fit_Logo7.png"
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  useMediaQuery,
  Divider,
  Dialog,
  Radio,
  FormControlLabel,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Chip,
  Tooltip,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  clearLocalStorage,
  EMPLOYEE_NAME,
  getItem,
  USER_DATA,
  USER_ROLE,
} from "../../src/utils/helper";
import AppBreadcrumbs from "../components/Common/AppBreadcrumbs";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BusinessIcon from "@mui/icons-material/Business";
import { AccountTree, Person2 } from "@mui/icons-material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import api from "../api";
import { toast } from "react-toastify";
import { GridCloseIcon } from "@mui/x-data-grid";
import { PowerSettingsNew } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import AutoDeleteRoundedIcon from "@mui/icons-material/AutoDeleteRounded";
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import DescriptionSharpIcon from "@mui/icons-material/DescriptionSharp";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { COLORS } from "../styles/theme";
import { useState } from "react";
import { useCallback } from "react";
import DashboardAiAssistant from "../components/DashboardAiAssistant";
import { useGetJobAnalyticsQuery } from "../store/api/dashboardApi";
import {
  useGetActionRequestsQuery,
  useGetMyActionRequestsQuery,
  useReviewActionRequestMutation,
} from "../store/api/actionRequestApi";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#174FDF",
  primaryMid: "#0571ED",
  dark: "#1F242F",
  activeBg: "#EEF3FF",
  activeText: "#174FDF",
  sectionLabel: "#94A3B8",
  itemText: "#374151",
  border: "#F1F5F9",
  hoverBg: "#F8FAFC",
  white: "#FFFFFF",
};

const drawerWidth = 210;
const drawerClosedWidth = 60;

// ─── Drawer shell ─────────────────────────────────────────────────────────────
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.easeOut,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  width: `${drawerClosedWidth}px`,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.easeInOut,
    duration: 300,
  }),
  overflowX: "hidden",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
  minHeight: "52px !important",
}));

const Drawer = styled("div")(({ theme, open }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  backgroundColor: BRAND.white,
  borderRight: `1px solid ${BRAND.border}`,
  display: "flex",
  flexDirection: "column",
  zIndex: theme.zIndex.drawer,
  boxSizing: "border-box",
  ...(open ? openedMixin(theme) : closedMixin(theme)),
}));

// ─── Menu config (unchanged) ─────────────────────────────────────────────────
const MENU_ITEMS = [
  {
    label: "Dashboard",
    icon: <DashboardIcon sx={{ fontSize: 18 }} />,
    path: "/recruit/dashboard",
    roles: ["SUPER_ADMIN", "HM_USER", "ADMIN"],
  },
  {
    label: "Requisitions",
    icon: <AssignmentIcon sx={{ fontSize: 18 }} />,
    path: "/recruit/requisitions",
    roles: ["SUPER_ADMIN", "HM_USER", "ADMIN"],
  },
  {
    label: "Interviews",
    icon: <WorkHistoryIcon sx={{ fontSize: 18 }} />,
    path: "/recruit/interviews",
    roles: ["SUPER_ADMIN", "HM_USER", "ADMIN", "INTERVIEW_USER"],
  },
  {
    label: "Candidates",
    icon: <PeopleIcon sx={{ fontSize: 18 }} />,
    path: "/recruit/candidates",
    roles: ["SUPER_ADMIN", "HM_USER", "ADMIN", "INTERVIEW_USER"],
  },
  {
    label: "Ask Ri8 AI",
    icon: <AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />,
    path: "/recruit/ai-copilot",
    roles: ["SUPER_ADMIN", "HM_USER", "ADMIN", "INTERVIEW_USER"],
  },
  {
    label: "Settings",
    icon: <SettingsIcon sx={{ fontSize: 18 }} />,
    path: "/recruit/settings",
    roles: ["SUPER_ADMIN", "INTERVIEW_USER", "ADMIN", "HM_USER"],
  },
];

const SETTINGS_CHILDREN = [
  {
    label: "Organization",
    path: "/recruit/settings/organization",
    icon: BusinessIcon,
    roles: ["SUPER_ADMIN", "ADMIN", "HM_USER"],
  },
  {
    label: "My Profile",
    path: "/recruit/settings/profile-details",
    icon: Person2,
    roles: ["SUPER_ADMIN", "ADMIN", "HM_USER", "INTERVIEW_USER"],
  },
  {
    label: "User Management",
    path: "/recruit/settings/user-management",
    icon: ManageAccountsIcon,
    roles: ["SUPER_ADMIN", "ADMIN", "HM_USER"],
  },
  {
    label: "Department",
    path: "/recruit/settings/Department",
    icon: AccountTree,
    roles: ["SUPER_ADMIN", "ADMIN", "HM_USER"],
  },
];

// ─── Shared nav item style helpers ───────────────────────────────────────────
const navItemSx = (isActive, isOpen) => ({
  borderRadius: "10px",
  mx: 0.5,
  mb: 0.25,
  px: isOpen ? 1.5 : 1,
  py: 0.75,
  justifyContent: isOpen ? "flex-start" : "center",
  minHeight: 38,
  color: isActive ? BRAND.activeText : BRAND.itemText,
  backgroundColor: isActive ? BRAND.activeBg : "transparent",
  "&:hover": {
    backgroundColor: isActive ? BRAND.activeBg : BRAND.hoverBg,
  },
  "& .MuiListItemIcon-root": {
    color: isActive ? BRAND.activeText : "#64748B",
  },
});

const childNavItemSx = (isActive) => ({
  borderRadius: "10px",
  pl: 5,
  py: 0.5,
  mx: 0.5,
  mb: 0.25,
  color: isActive ? BRAND.activeText : BRAND.itemText,
  backgroundColor: isActive ? BRAND.activeBg : "transparent",
  "&:hover": { backgroundColor: isActive ? BRAND.activeBg : BRAND.hoverBg },
  "& .MuiListItemIcon-root": {
    color: isActive ? BRAND.activeText : "#64748B",
  },
});

// ─── Action-request job details — shown inside the notification bell's
// request cards. `job_details` only comes back while the job still exists
// (null once a delete request has been approved/the job is gone). ───────────
const ActionRequestJobDetails = ({ jobDetails }) => {
  if (!jobDetails) return null;
  return (
    <Box sx={{ mt: 0.6, px: 1, py: 0.75, borderRadius: "6px", bgcolor: "#F8FAFC", border: "1px solid #EEF2F7" }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1F242F" }}>
        {jobDetails.job_title || "Untitled job"}
      </Typography>
      <Typography sx={{ fontSize: 10.5, color: "#64748B", mt: 0.2, textTransform: "capitalize" }}>
        {[jobDetails.function, jobDetails.sub_function].filter(Boolean).join(" · ")}
      </Typography>
      {jobDetails.no_of_positions != null && (
        <Typography sx={{ fontSize: 10.5, color: "#64748B" }}>
          Positions: {jobDetails.no_of_positions}
        </Typography>
      )}
    </Box>
  );
};

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ label }) => (
  <Typography
    sx={{
      fontSize: 11,
      fontWeight: 600,
      color: BRAND.sectionLabel,
      px: 1.5,
      pt: 1.5,
      pb: 0.5,
      textTransform: "uppercase",
      letterSpacing: "0.06em",

    }}
  >
    {label}
  </Typography>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function Sidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = React.useState(!isMobile);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState(null);

  const parsedUser = localStorage.getItem(USER_DATA)
    ? JSON.parse(localStorage.getItem(USER_DATA))
    : null;
  const role = getItem(USER_ROLE);
  const currentRole = (
    getItem(USER_ROLE) || parsedUser?.user_role || parsedUser?.userRole || ""
  ).toUpperCase().trim();
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isHmUser = currentRole === "HM_USER";
  const canSeeActionRequests = isSuperAdmin || isHmUser;
  // Different endpoints per role: super admin reviews everyone's requests
  // (/action-requests), an HM user only sees their own (/action-requests/
  // my-requests). Both default to "all" so pending/approved/rejected can be
  // filtered client-side from one response instead of one request per status.
  const { data: allOrgActionRequests = [] } = useGetActionRequestsQuery("all", {
    skip: !isSuperAdmin,
    pollingInterval: isSuperAdmin ? 60000 : 0,
  });
  const { data: myActionRequests = [] } = useGetMyActionRequestsQuery("all", {
    skip: !isHmUser,
    pollingInterval: isHmUser ? 60000 : 0,
  });
  const allActionRequests = isSuperAdmin ? allOrgActionRequests : myActionRequests;
  const pendingActionRequests = React.useMemo(
    () => allActionRequests.filter((r) => r.status === "pending"),
    [allActionRequests]
  );
  const approvedActionRequests = React.useMemo(
    () => allActionRequests.filter((r) => r.status === "approved"),
    [allActionRequests]
  );
  const [reviewActionRequest, { isLoading: isReviewingRequest }] = useReviewActionRequestMutation();
  const formattedRole = role?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const userName = parsedUser?.full_name || parsedUser?.first_name || getItem(EMPLOYEE_NAME) || "USER";

  const [settingsOpen, setSettingsOpen] = React.useState(location.pathname.startsWith("/recruit/settings"));
  const [createJobDialogOpen, setCreateJobDialogOpen] = React.useState(false);
  const [startupMode, setStartupMode] = React.useState("new");
  const [templates, setTemplates] = React.useState([]);
  const [chosenTemplate, setChosenTemplate] = React.useState(null);
  const [aiAssistantOpen, setAiAssistantOpen] = React.useState(false);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const PRIMARY = COLORS.royalBlue;
  const [errors,setErrors] = useState({})
  const { data: aiAnalyticsResponse } = useGetJobAnalyticsQuery({
    groupBy: "month",
    periodCount: 6,
    status: "all",
    scope: "user",
    countsType: "cumulative",
  });
   const clearError = useCallback((key) => {
      setErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, []);




  React.useEffect(() => {
    if (location.pathname === "/recruit/dashboard") {
      navigate("/recruit/dashboard/organization", { replace: true });
    }
    
  }, []);


  const fetchTemplates = async () => {
    try {
      const res = await api.get("/job-templates");
      if (res.data?.success) setTemplates(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const deleteTemplate = async (templateId) => {
    try {
      const res = await api.delete(`/job-templates/${templateId}`);
      if (res.data?.success) {
        setTemplates((prev) => prev.filter((tpl) => tpl.template_id !== templateId));
        toast.success(res?.data?.message || "Template deleted successfully");
        if (chosenTemplate?.template_id === templateId) setChosenTemplate(null);
      }
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const handleMenuNavigate = (path) => {
    if (path && !path.startsWith("/recruit/settings")) setSettingsOpen(false);
    if (path) navigate(path);
  };
  const handleFileChange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const valid = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (valid.includes(f.type)) { setFile(f); setFileError(""); clearError("instructions"); }
    else { setFileError("Please upload a valid file (PDF, TXT, DOC, DOCX, XLSX)."); setFile(null); }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/recruit/login");
  };

  const handleApproveActionRequest = async (requestId) => {
    try {
      const response = await reviewActionRequest({
        requestId,
        action: "approve",
        review_notes: `Approved by ${userName}`,
      }).unwrap();
      toast.success(response?.message || "Request approved successfully.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to approve request.");
    }
  };

  const handleRejectActionRequest = async (requestId) => {
    try {
      const response = await reviewActionRequest({
        requestId,
        action: "reject",
        review_notes: `Rejected by ${userName}`,
      }).unwrap();
      toast.success(response?.message || "Request rejected successfully.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reject request.");
    }
  };

  const handleLogoClick = () => {
    if (["INTERVIEW_USER"].includes(currentRole)) navigate("/recruit/interviews");
    else navigate("/recruit/dashboard");
  };

  React.useEffect(() => {
    if (isMobile) { setOpen(false); return; }
    const closePaths = [
      "/recruit/requisitions/Job-details",
      "/recruit/requisitions/pipeline",
      "/recruit/create-job/job-requirements",
      "/recruit/settings/basicdetails",
      "/recruit/settings/billingdetails",
      "/recruit/dashboard/organization",
      "/recruit/dashboard"

    ];
    setOpen(!closePaths.some((r) => location.pathname.startsWith(r)));
  }, [location.pathname, isMobile]);

  const isOnCreateJob = location.pathname.startsWith("/recruit/create-job/job-requirements");

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", fontFamily: "'Nunito Sans', sans-serif" }}>

      {/* ═══════════════════════════ APP BAR ═══════════════════════════════════ */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: BRAND.white,
          color: BRAND.dark,
          borderBottom: `1px solid ${BRAND.border}`,
          zIndex: theme.zIndex.drawer + 1,
          height: 52,
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            justifyContent: "space-between",
            minHeight: "52px !important",
            height: 52,
            px: { xs: 1.5, sm: 2 },
          }}
        >
          {/* LEFT: toggle + logo + breadcrumbs */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexGrow: 1,
            }}
          >
            {/* Menu Toggle */}
            <IconButton
              onClick={() => setOpen((prev) => !prev)}
              sx={{
                width: 34,
                height: 34,
                border: `1px solid ${BRAND.border}`,
                borderRadius: "10px",
                color: BRAND.primary,
                backgroundColor: BRAND.white,
                "&:hover": {
                  backgroundColor: BRAND.activeBg,
                },
              }}
            >
              {open ? (
                <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 20 }} />
              ) : (
                <MenuIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>

            {/* Logo */}
            <img
              src={Ri8fit_Logo}
              alt="Ri8fit"
              style={{
                width: 138,
                height: 35,
                objectFit: "contain",
                display: "block",
                cursor: "pointer",
              }}
              onClick={handleLogoClick}
            />

            {/* Breadcrumbs */}
            <Box
              sx={{
                ml: 2,
                flexGrow: 1,
                maxWidth: {
                  xs: 200,
                  sm: 400,
                  md: 600,
                },
              }}
            >
              <AppBreadcrumbs />
            </Box>
          </Box>

          {/* RIGHT: search + notif + avatar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Search pill */}
            {/* <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                backgroundColor: "#F8FAFC",
                border: `1px solid ${BRAND.border}`,
                px: 1.5,
                py: 0.4,
                borderRadius: "10px",
                width: 240,
                gap: 1,
              }}
            >
              <SearchIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
              <InputBase
                placeholder="Search"
                sx={{
                  flex: 1,
                  fontSize: 13,
                  
                  "& input": { padding: "2px 0" },
                }}
              />
              <Box
                sx={{
                  backgroundColor: "#E2E8F0",
                  borderRadius: "6px",
                  px: 0.75,
                  py: 0.25,
                }}
              >
                <Typography sx={{ fontSize: 11, color: "#64748B",  lineHeight: 1.6 }}>
                  ⌘K
                </Typography>
              </Box>
            </Box> */}

            {canSeeActionRequests && (
              <>
                <Tooltip title={isSuperAdmin ? "Pending action requests" : "Your requests"} arrow>
                  <IconButton
                    aria-label={isSuperAdmin ? "Pending action requests" : "Your requests"}
                    onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
                    sx={{ color: BRAND.itemText }}
                  >
                    <Badge badgeContent={pendingActionRequests.length} color="error">
                      <NotificationsNoneOutlinedIcon sx={{ fontSize: 21 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={notificationAnchorEl}
                  open={Boolean(notificationAnchorEl)}
                  onClose={() => setNotificationAnchorEl(null)}
                  PaperProps={{
                    sx: { mt: 1, width: 360, maxWidth: "calc(100vw - 24px)", borderRadius: "12px" },
                  }}
                >
                  {isSuperAdmin ? (
                    <>
                      <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${BRAND.border}` }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Pending action requests</Typography>
                      </Box>
                      {pendingActionRequests.length === 0 ? (
                        <MenuItem disabled sx={{ fontSize: 13 }}>No pending requests</MenuItem>
                      ) : (
                        pendingActionRequests.map((request) => (
                          <Box key={request.request_id} sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${BRAND.border}` }}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                              {request.action_type === "delete_job" ? "Delete job request" : request.action_type}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                              Requested by {request.requester_name || "a user"}
                            </Typography>
                            <ActionRequestJobDetails jobDetails={request.job_details} />
                            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                disabled={isReviewingRequest}
                                onClick={() => handleApproveActionRequest(request.request_id)}
                                sx={{ textTransform: "none", fontSize: 12, borderRadius: "7px" }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                disabled={isReviewingRequest}
                                onClick={() => handleRejectActionRequest(request.request_id)}
                                sx={{ textTransform: "none", fontSize: 12, borderRadius: "7px" }}
                              >
                                Reject
                              </Button>
                            </Box>
                          </Box>
                        ))
                      )}
                      <Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${BRAND.border}`, bgcolor: "#F8FAFC" }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Approved requests</Typography>
                      </Box>
                      {approvedActionRequests.length === 0 ? (
                        <MenuItem disabled sx={{ fontSize: 13 }}>No approved requests</MenuItem>
                      ) : (
                        approvedActionRequests.map((request) => (
                          <Box key={request.request_id} sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${BRAND.border}` }}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                              {request.action_type === "delete_job" ? "Job deletion approved" : request.action_type}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#64748B", mt: 0.25 }}>
                              Requested by {request.requester_name || "a user"}
                            </Typography>
                            <ActionRequestJobDetails jobDetails={request.job_details} />
                            {request.reviewed_at && (
                              <Typography sx={{ fontSize: 11, color: "#94A3B8", mt: 0.35 }}>
                                Reviewed {new Date(request.reviewed_at).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        ))
                      )}
                    </>
                  ) : (
                    <>
                      {/* HM user — read-only: the status of requests they submitted,
                          no approve/reject controls since they can't act on their own. */}
                      <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${BRAND.border}` }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Your requests</Typography>
                      </Box>
                      {allActionRequests.length === 0 ? (
                        <MenuItem disabled sx={{ fontSize: 13 }}>No requests yet</MenuItem>
                      ) : (
                        allActionRequests.map((request) => {
                          const statusStyle =
                            request.status === "approved"
                              ? { bg: "#DCFCE7", color: "#15803D" }
                              : request.status === "rejected"
                                ? { bg: "#FEE2E2", color: "#DC2626" }
                                : { bg: "#FFF3E0", color: "#F59E0B" };
                          return (
                            <Box key={request.request_id} sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${BRAND.border}` }}>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                                {request.action_type === "delete_job" ? "Delete job request" : request.action_type}
                              </Typography>
                              {request.job_details ? (
                                <ActionRequestJobDetails jobDetails={request.job_details} />
                              ) : (
                                <Typography sx={{ fontSize: 12, color: "#94A3B8", mt: 0.25, fontStyle: "italic" }}>
                                  Job details no longer available
                                </Typography>
                              )}
                              <Box
                                sx={{
                                  display: "inline-flex", alignItems: "center", mt: 0.75,
                                  px: 1, py: 0.2, borderRadius: "6px",
                                  bgcolor: statusStyle.bg, color: statusStyle.color,
                                }}
                              >
                                <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
                                  {request.status}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })
                      )}
                    </>
                  )}
                </Menu>
              </>
            )}

            {/* User name + avatar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ textAlign: "right", minWidth: 0 }}>
                <Typography
                  title={userName}
                  sx={{
                    fontSize: { xs: 12, sm: 13 },
                    fontWeight: 600,
                    fontFamily: "'Nunito Sans', sans-serif",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: { xs: 90, sm: 200 },
                  }}
                >
                  {userName}
                </Typography>
                {formattedRole && (
                  <Typography sx={{ fontSize: 11, color: "#94A3B8", lineHeight: 1, display: { xs: "none", sm: "block" } }}>
                    {formattedRole}
                  </Typography>
                )}
              </Box>
              <Avatar
                sx={{
                  bgcolor: "#EEF3FF",
                  color: BRAND.primary,
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  fontSize: 13,
                  fontWeight: 700,
                }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                {userName.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
          </Box>

          {/* User dropdown menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: "12px",
                mt: 1,
                minWidth: 180,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                border: `1px solid ${BRAND.border}`,
              },
            }}
          >
            {/* Who is logged in */}
            <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.25 }}>
              <Avatar sx={{ bgcolor: "#EEF3FF", color: BRAND.primary, width: 32, height: 32, fontSize: 13, fontWeight: 700 }}>
                {userName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 700, color: BRAND.dark, textTransform: "capitalize" }}>
                  {userName}
                </Typography>
                {formattedRole && (
                  <Typography noWrap sx={{ fontSize: 11.5, color: "#94A3B8" }}>
                    {formattedRole}
                  </Typography>
                )}
              </Box>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => { navigate("/recruit/settings/profile-details"); setAnchorEl(null); }}
              sx={{ fontSize: 13, gap: 1, borderRadius: "8px", mx: 0.5, my: 0.25 }}
            >
              <PersonIcon sx={{ fontSize: 16 }} /> My Profile
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={handleLogout}
              sx={{
                fontSize: 13,
                gap: 1,
                color: "#EF4444",
                borderRadius: "8px",
                mx: 0.5,
                my: 0.25,
                "&:hover": { backgroundColor: "#FEF2F2" },
              }}
            >
              <PowerSettingsNew sx={{ fontSize: 16 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ═══════════════════════════ CREATE JOB DIALOG ════════════════════════ */}
      <Dialog
        open={createJobDialogOpen}
        onClose={() => setCreateJobDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            background: BRAND.white,
            boxShadow: "0 10px 35px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3, py: 2,
            borderBottom: `1px solid ${BRAND.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#0f172a", fontFamily: "'Nunito Sans', sans-serif" }}>
              Create Job
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.3, fontFamily: "'Nunito Sans', sans-serif" }}>
              Create new or use existing template
            </Typography>
          </Box>
          <IconButton
            onClick={() => setCreateJobDialogOpen(false)}
            size="small"
            sx={{ bgcolor: "#f8fafc", border: `1px solid ${BRAND.border}` }}
          >
            <GridCloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            {/* New Job card */}
            {[
              { mode: "new", title: "Create New", desc: "Start from scratch with a fresh form." },
              { mode: "copy", title: "Use Template", desc: "Reuse previously created job templates." },
            ].map(({ mode, title, desc }) => (
              <Box
                key={mode}
                onClick={() => setStartupMode(mode)}
                sx={{
                  flex: 1, p: 2, borderRadius: "16px", cursor: "pointer", transition: "0.25s",
                  border: startupMode === mode ? `1.5px solid ${BRAND.primary}` : `1px solid ${BRAND.border}`,
                  bgcolor: startupMode === mode ? "#EEF3FF" : BRAND.white,
                  "&:hover": { borderColor: BRAND.primary },
                }}
              >
                <Radio
                  checked={startupMode === mode}
                  onChange={() => setStartupMode(mode)}
                  size="small"
                  sx={{ p: 0, mb: 1.5, color: BRAND.primary, "&.Mui-checked": { color: BRAND.primary } }}
                />
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", fontFamily: "'Nunito Sans', sans-serif" }}>
                  {title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.5, lineHeight: 1.5, fontFamily: "'Nunito Sans', sans-serif" }}>
                  {desc}
                </Typography>
              </Box>
            ))}
          </Box>

          {startupMode === "copy" && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1, color: "#475569", fontFamily: "'Nunito Sans', sans-serif" }}>
                Select Template
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={chosenTemplate?.template_id || ""}
                  displayEmpty
                  onChange={(e) => {
                    const tpl = templates.find((t) => t.template_id === e.target.value);
                    setChosenTemplate(tpl);
                  }}
                  IconComponent={KeyboardArrowDownRoundedIcon}
                  sx={{
                    borderRadius: "14px",
                    bgcolor: "#f8fafc",
                    minHeight: 54,
                    "& .MuiOutlinedInput-notchedOutline": { border: `1px solid #dbe4ee` },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: BRAND.primary },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND.primary, borderWidth: "1.5px" },
                    "& .MuiSelect-select": { display: "flex", alignItems: "center", py: 1.5 },
                  }}
                  renderValue={(selected) => {
                    if (!selected) return (
                      <Typography sx={{ fontSize: 14, color: "#94a3b8", fontFamily: "'Nunito Sans', sans-serif" }}>
                        Choose a template
                      </Typography>
                    );
                    const sel = templates.find((t) => t.template_id === selected);
                    return (
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0f172a", fontFamily: "'Nunito Sans', sans-serif" }}>
                          {sel?.template_name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: "#64748b", fontFamily: "'Nunito Sans', sans-serif" }}>
                          {sel?.job_details?.function}
                        </Typography>
                      </Box>
                    );
                  }}
                >
                  {templates.map((tpl) => (
                    <MenuItem
                      key={tpl.template_id}
                      value={tpl.template_id}
                      sx={{ py: 1.5, borderRadius: "10px", mx: 1, my: 0.5 }}
                    >
                      <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "'Nunito Sans', sans-serif" }}>
                            {tpl.template_name}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", fontFamily: "'Nunito Sans', sans-serif" }}>
                            {tpl.job_details.function} • {tpl.job_details.job_type}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.template_id); }}>
                          <AutoDeleteRoundedIcon
                            sx={{ fontSize: 20, color: "#94a3b8", transition: "0.25s", "&:hover": { color: "#ef4444", transform: "scale(1.12)" } }}
                          />
                        </IconButton>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {startupMode === "copy" && chosenTemplate && (
            <Box sx={{ mt: 2.5, p: 2, borderRadius: "14px", bgcolor: "#f8fbfc", border: `1px solid ${BRAND.border}` }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", fontFamily: "'Nunito Sans', sans-serif" }}>
                    {chosenTemplate.template_name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.3, fontFamily: "'Nunito Sans', sans-serif" }}>
                    {chosenTemplate.job_details.sub_function} • {chosenTemplate.job_details.function}
                  </Typography>
                </Box>
                <Chip
                  label={formatDate(chosenTemplate.created_at)}
                  size="small"
                  sx={{ bgcolor: "#dcfce7", color: "#15803d", fontSize: 11, height: 24 }}
                />
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip size="small" label={`${chosenTemplate.job_details.min_years}-${chosenTemplate.job_details.max_years} yrs`} />
                <Chip size="small" label={chosenTemplate.job_details.job_type} />
                <Chip size="small" label={chosenTemplate.job_details.country} />
              </Box>
            </Box>
          )}
          {/* <Box sx={{ border: file ? `1.5px solid ${PRIMARY}` : "1.5px dashed #CBD5E1", borderRadius: "12px", p: 3, textAlign: "center", bgcolor: file ? "#F0F4FF" : "#F8FAFC", transition: "all 0.2s", "&:hover": { borderColor: PRIMARY, bgcolor: "#EEF2FF" } }}>
          {!file ? (
            <Button variant="text" component="label" sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%", textTransform: "none", color: "#6B7280", "&:hover": { bgcolor: "transparent", color: PRIMARY } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "12px", bgcolor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                <CloudUploadIcon sx={{ fontSize: 26, color: PRIMARY }} />
              </Box>
              <Typography variant="body2" fontWeight={600} color="#111827">Upload Job Description</Typography>
              <Typography variant="caption" color="#9CA3AF">PDF, DOC, DOCX, TXT, XLSX — max 10MB</Typography>
              <input type="file" hidden onChange={(e) => { handleFileChange(e); setIsDirty(false); }} accept=".pdf,.txt,.doc,.docx,.xlsx" />
            </Button>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DescriptionSharpIcon sx={{ fontSize: 20, color: PRIMARY }} />
              </Box>
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="body2" fontWeight={600} color="#111827" noWrap sx={{ maxWidth: 220 }}>{file.name}</Typography>
                <Typography variant="caption" color="#9CA3AF">{(file.size / 1024).toFixed(1)} KB</Typography>
              </Box>
              <IconButton size="small" onClick={() => setFile(null)} sx={{ ml: 1, color: "#EF4444", bgcolor: "#FEF2F2", "&:hover": { bgcolor: "#FEE2E2" } }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          )}
          {fileError && <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>{fileError}</Typography>}
        </Box> */}
        </DialogContent>
        

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${BRAND.border}` }}>
          <Button
            onClick={() => setCreateJobDialogOpen(false)}
            sx={{ textTransform: "none", color: "#64748b", fontWeight: 500, fontFamily: "'Nunito Sans', sans-serif" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={startupMode === "copy" && !chosenTemplate}
            onClick={() => {
              setCreateJobDialogOpen(false);
              navigate("/recruit/create-job/job-requirements", {
                state: startupMode === "copy" ? { template: chosenTemplate } : { fresh: true },
              });
            }}
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              px: 3, py: 1,
              fontWeight: 600,

              bgcolor: BRAND.primary,
              "&:hover": { bgcolor: BRAND.primaryMid },
              boxShadow: "none",
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════ DRAWER ════════════════════════════════════ */}
      <Drawer open={open}>
        {/* ── Top: logo row ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "space-between" : "center",
            px: open ? 2 : 1,
            height: 52,
            flexShrink: 0,
            borderBottom: `1px solid ${BRAND.border}`,
          }}
        >
          {open && (
            <img
              src={Ri8fit_Logo}
              alt="Ri8fit"
              style={{
                width: 140,
                height: 48,
                objectFit: "contain",
                display: "block",
                cursor: "pointer",
              }}
              onClick={handleLogoClick}
            />
          )}
          <IconButton
            onClick={() => setOpen(!open)}
            size="small"
            sx={{
              width: 28,
              height: 28,
              backgroundColor: BRAND.primary,
              color: BRAND.white,
              borderRadius: "8px",
              "&:hover": { backgroundColor: BRAND.primaryMid },
            }}
          >
            {open
              ? <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 16 }} />
              : <KeyboardDoubleArrowRightIcon sx={{ fontSize: 16 }} />
            }
          </IconButton>
        </Box>

        {/* ── Scrollable menu ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            px: 0.5,
            pt: 0.5,
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
          }}
        >

          {/* ── MAIN section ── */}
          {open && <SectionLabel label="Main" />}

          <List disablePadding>
            {/* Dashboard item (with children) */}
            {["SUPER_ADMIN", "HM_USER", "ADMIN"].includes(currentRole) && (
              <>
                <ListItem disablePadding>
                  <Tooltip title={!open ? "Dashboard" : ""} placement="right" arrow>
                    <ListItemButton
                      className="org-overview"
                      selected={location.pathname.startsWith("/recruit/dashboard")}
                      onClick={() => navigate("/recruit/dashboard")}
                      sx={navItemSx(location.pathname.startsWith("/recruit/dashboard"), open)}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : "auto", justifyContent: "center" }}>
                        <DashboardIcon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary="Dashboard"
                          primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500, fontFamily: "'Nunito Sans', sans-serif" }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </>
            )}

            {/* Create Job highlighted item */}
            {/* {["SUPER_ADMIN", "HM_USER", "ADMIN"].includes(currentRole) && open && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => { setCreateJobDialogOpen(true); fetchTemplates(); }}
                  sx={{
                    borderRadius: "10px",
                    mx: 0.5,
                    mb: 0.25,
                    px: 1.5,
                    py: 0.75,
                    minHeight: 38,
                    backgroundColor: BRAND.activeBg,
                    color: BRAND.primary,
                    "&:hover": { backgroundColor: "#DCE8FF" },
                    "& .MuiListItemIcon-root": { color: BRAND.primary },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: 1.5, justifyContent: "center" }}>
                    <AddCircleIcon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Create Jo"
                    primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600, fontFamily: "'Nunito Sans', sans-serif" }}
                  />
                  <ExpandMoreIcon sx={{ fontSize: 18, color: BRAND.primary, ml: "auto" }} />
                </ListItemButton>
              </ListItem>
            )} */}
          </List>

          {/* ── DASHBOARD section ── */}
          {/* {open && <SectionLabel label="Dashboard" />} */}
          <Divider sx={{ my: 1, display: open ? "block" : "none" }} />
          <List disablePadding>
            {MENU_ITEMS.filter((item) =>
              item.roles.includes(currentRole) &&
              !["Dashboard", "Settings"].includes(item.label)
            ).map((item) => (
              <ListItem key={item.label} disablePadding>
                <Tooltip title={!open ? item.label : ""} placement="right" arrow>
                  <ListItemButton
                    disabled={item.disabled}
                    selected={!item.disabled && location.pathname.startsWith(item.path || "")}
                    onClick={() => {
                      if (item.disabled) return;
                      if (item.label === "Ask Ri8 AI") { setAiAssistantOpen(true); return; }
                      handleMenuNavigate(item.path);
                    }}
                    sx={navItemSx(
                      !item.disabled && location.pathname.startsWith(item.path || ""),
                      open
                    )}
                  >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : "auto", justifyContent: "center" }}>
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500, fontFamily: "'Nunito Sans', sans-serif" }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1, display: open ? "block" : "none" }} />

          {/* ── SETTINGS section ── */}
          {open && <SectionLabel label="Settings" />}

          <List disablePadding>
            {MENU_ITEMS.filter((item) =>
              item.label === "Settings" && item.roles.includes(currentRole)
            ).map((item) => (
              <React.Fragment key={item.label}>
                <ListItem disablePadding>
                  <Tooltip title={!open ? "Settings" : ""} placement="right" arrow>
                    <ListItemButton
                      className="settings-menu"
                      onClick={() => {
                        if (!open) { setOpen(true); setSettingsOpen(true); navigate("/recruit/settings/profile-details"); return; }
                        setSettingsOpen(!settingsOpen);
                      }}
                      selected={location.pathname.startsWith("/recruit/settings")}
                      sx={navItemSx(location.pathname.startsWith("/recruit/settings"), open)}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : "auto", justifyContent: "center" }}>
                        <SettingsIcon sx={{ fontSize: 18 }} />
                      </ListItemIcon>
                      {open && (
                        <>
                          <ListItemText
                            primary="Settings"
                            primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500, fontFamily: "'Nunito Sans', sans-serif" }}
                          />
                          {settingsOpen
                            ? <ExpandMoreIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
                            : <ChevronRightIcon sx={{ fontSize: 16, color: "#94A3B8" }} />
                          }
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>

                {/* Settings children */}
                {settingsOpen && open &&
                  SETTINGS_CHILDREN.filter((c) => c.roles.includes(currentRole)).map((child) => (
                    <ListItem key={child.label} disablePadding>
                      <ListItemButton
                        onClick={() => navigate(child.path)}
                        selected={location.pathname === child.path}
                        sx={childNavItemSx(location.pathname === child.path)}
                      >
                        <ListItemIcon sx={{ minWidth: 0, mr: 1.5 }}>
                          <child.icon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{ fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }}
                        />
                        <ChevronRightIcon sx={{ fontSize: 14, color: "#94A3B8", ml: "auto" }} />
                      </ListItemButton>
                    </ListItem>
                  ))
                }
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* ── Bottom: logout + Create Job CTA ── */}
        <Box sx={{ borderTop: `1px solid ${BRAND.border}`, pt: 1, pb: 1.5, px: 0.5 }}>
          {/* Logout */}
          {/* <Tooltip title={!open ? "Logout" : ""} placement="right" arrow>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: "10px",
                px: open ? 1.5 : 1,
                py: 0.75,
                mb: 1,
                justifyContent: open ? "flex-start" : "center",
                color: "#EF4444",
                "&:hover": { backgroundColor: "#FEF2F2" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : "auto", color: "#EF4444" }}>
                <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500, fontFamily: "'Nunito Sans', sans-serif" }}
                />
              )}
            </ListItemButton>
          </Tooltip> */}

          {/* Create Job CTA button */}
          {open && ["SUPER_ADMIN", "HM_USER", "ADMIN"].includes(currentRole) && (
            <Button
              fullWidth
              variant="contained"
              disabled={isOnCreateJob}
              startIcon={<AddCircleIcon sx={{ fontSize: 16 }} />}
              onClick={() => { setCreateJobDialogOpen(true); fetchTemplates(); }}
              sx={{
                backgroundColor: isOnCreateJob ? "#E2E8F0" : BRAND.primary,
                color: isOnCreateJob ? "#94A3B8" : BRAND.white,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13.5,
                py: 1,
                boxShadow: "none",
                "&:hover": { backgroundColor: isOnCreateJob ? "#E2E8F0" : BRAND.primaryMid, boxShadow: "none" },
              }}
            >
              Create Job
            </Button>
          )}

          {/* Collapsed: icon-only CTA */}
          {!open && ["SUPER_ADMIN", "HM_USER", "ADMIN"].includes(currentRole) && (
            <Tooltip title="Create Job" placement="right" arrow>
              <ListItemButton
                onClick={() => { setCreateJobDialogOpen(true); fetchTemplates(); }}
                sx={{
                  borderRadius: "10px",
                  justifyContent: "center",
                  color: BRAND.primary,
                  "&:hover": { backgroundColor: BRAND.activeBg },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: BRAND.primary }}>
                  <AddCircleIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          )}
        </Box>
      </Drawer>

      {/* ═══════════════════════════ MAIN CONTENT ══════════════════════════════ */}
      <DashboardAiAssistant
        summary={aiAnalyticsResponse?.data || {}}
        navigate={navigate}
        userName={userName}
        forceOpen={aiAssistantOpen}
        contextPath={location.pathname}
        onClose={() => setAiAssistantOpen(false)}
        onViewStage={(stage) => navigate("/recruit/dashboard", { state: { copilotStage: stage } })}
      />
      <Box
        component="main"
        sx={{
          ml: open ? `${drawerWidth}px` : `${drawerClosedWidth}px`,
          mt: "52px",
          width: "100%",
          height: "calc(100vh - 52px)",
          p: "8px 8px 0px 8px",
          overflowY: "scroll",
          overflowX: "hidden",
          transition: "margin-left 0.3s ease",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
          scrollbarWidth: "thin",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}