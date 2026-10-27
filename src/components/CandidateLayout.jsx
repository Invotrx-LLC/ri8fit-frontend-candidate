import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Tooltip,
  IconButton,
  Avatar,
  Breadcrumbs,
  Menu, MenuItem,
  useMediaQuery,
  Badge,
} from "@mui/material";
import { Outlet, useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import { palette, fonts } from "../theme/candidateTokens";
import logoDark from "../assets/ri8fit-logo.svg";
import {
  candidateClearLocalStorage,
  getItem,
  CANDIDATE_ACCESS_TOKEN,
  ACCESS_TOKEN,
} from "../utils/helper";
import candidateApi from "../services/candidateApi";
import LogoutIcon from "@mui/icons-material/Logout";
import { Assessment, BusinessCenter, PeopleOutlineOutlined, Person, Person2, Person2Outlined } from "@mui/icons-material";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import { useSelector } from "react-redux";

/* ── Candidate display name ───────────────────────────────────────────────
   The name can sit in different places depending on how the user got here
   (login response, register / resume data, old localStorage) — use the
   first one that has a value, and fall back to the email's first part. */
const safeParse = (raw) => {
  try {
    return raw && raw !== "undefined" ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const nameOf = (o) =>
  !o
    ? ""
    : (
        o.full_name ||
        o.name ||
        [o.first_name, o.last_name].filter(Boolean).map((s) => String(s).trim()).join(" ") ||
        o.username ||
        ""
      ).trim();
const resolveCandidateName = (...sources) => {
  for (const s of sources) {
    const n = nameOf(s);
    if (n) return n;
  }
  const email = sources.find((s) => s?.email)?.email;
  return email ? email.split("@")[0] : "";
};


const SIDEBAR_WIDTH_OPEN = 220;
const SIDEBAR_WIDTH_CLOSED = 76;
const TOPBAR_HEIGHT = 64;

const MAIN_ITEMS = [
  { label: "Profile", path: "/for-candidate/profile", icon: <Person />, disabled: false },
  // { label: "Candidates", path: "/acc/candidates", icon: <PeopleAltIcon />, disabled: true },
  { label: "Jobs", path: "/for-candidate/requisitions", icon: <WorkOutlineIcon />, disabled: false },
  { label: "Gap Analysis", path: "/for-candidate/analysis", icon: <AnalyticsOutlinedIcon />, disabled: false },
  { label: "Interviews", path: "/for-candidate/interviews", icon: <AssignmentIndIcon />, disabled: true },
];

const SETTINGS_ITEMS = [
  { label: "Settings", path: "/acc/settings", icon: <SettingsIcon />, disabled: true },
];

// Simple path -> breadcrumb label mapping; extend as more routes are added
const BREADCRUMB_LABELS = {
  "/for-candidate/profile": "Profile",
  "/acc/candidates": "Candidates",
  "/acc/requisitions": "Requisitions",
  "/acc/interviews": "Interviews",
  "/acc/settings": "Settings",
};

function CandidateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme) =>
    theme.breakpoints.down("sm")
  );
  // Sidebar expand/collapse state — driven ONLY by the hamburger icon.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const effectiveSidebarOpen = isMobile ? false : sidebarOpen;

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const [openLogoutMenu, setOpenLogoutMenu] = useState(false);
  const user = safeParse(getItem("candidate_user"));

  // Name for the top-right corner — same API the profile header uses
  // (GET /candidate/profile/specific-details → data.full_name).
  // Fetch once on layout mount to avoid route-switch refetch churn.
  const [profileDetails, setProfileDetails] = useState(null);
  useEffect(() => {
    let active = true;
    const token = getItem(CANDIDATE_ACCESS_TOKEN) || getItem(ACCESS_TOKEN);
    if (!token) return undefined;
    candidateApi
      .get("/candidate/profile/specific-details", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        if (active && data) setProfileDetails(data);
      })
      .catch((err) => console.error("Couldn't load profile name", err));
    return () => {
      active = false;
    };
  }, []);
  const loginUser = useSelector((state) => state?.candidate?.formData?.loginDetails?.user);
  const candidateDetails = useSelector((state) => state?.candidate?.formData?.candidateDetails);
  const displayName =
    resolveCandidateName(profileDetails, candidateDetails, loginUser, user) || "User";
  const displayEmail =
    profileDetails?.email_id || candidateDetails?.email || loginUser?.email || user?.email || "";

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };



  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  // const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED;
  const sidebarWidth = effectiveSidebarOpen
    ? SIDEBAR_WIDTH_OPEN
    : SIDEBAR_WIDTH_CLOSED;
    const navItems = [
  {
    label: "Profile",
    path: "/for-candidate/profile",
    icon: <Person2 />,
  },
  {
    label: "Jobs",
    path: "/for-candidate/requisitions",
    icon: <BusinessCenter />,
  },
  {
    label: "Gap Analysis",
    path: "/for-candidate/analysis",
    icon: <Assessment />,
  },
  {
    label: "Interviews",
    path: "/for-candidate/interviews",
    icon: <Badge />,
  },
];
  const currentItem = navItems.find((item) => {
  if (item.path === "/") return location.pathname === "/";
  
  return (
    location.pathname === item.path ||
    location.pathname.startsWith(`${item.path}/`)
  );
});

const currentLabel = currentItem?.label || "Page";

  const renderSectionLabel = (label) =>
    effectiveSidebarOpen && (
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: palette.muted,
          px: 1.5,
          mb: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
    );

  const renderNavItem = (item) => {
    const active = !item.disabled && isActive(item.path);

    const button = (
      <ListItemButton
        key={item.path}
        selected={active}
        disabled={item.disabled}
        component={item.disabled ? "div" : RouterLink}
        to={item.disabled ? undefined : item.path}
        onClick={(event) => {
          if (item.disabled) {
            event.preventDefault();
          }
        }}
        sx={{
          borderRadius: "10px",
          mb: 0.5,
          minHeight: 44,
          textDecoration: "none",

          justifyContent: effectiveSidebarOpen
            ? "flex-start"
            : "center",

          px: effectiveSidebarOpen ? 1.5 : 1,

          color: active ? palette.teal : palette.muted,

          "&.Mui-selected": {
            backgroundColor: palette.tealSoft,
            color: palette.teal,

            "&:hover": {
              backgroundColor: palette.tealSoft,
            },
          },

          "&:hover": {
            backgroundColor: palette.tealSoft,
          },

          "&.Mui-disabled": {
            opacity: 0.45,
            color: palette.muted,
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: effectiveSidebarOpen ? 36 : 0,
            justifyContent: "center",
            color: active ? palette.teal : palette.muted,
          }}
        >
          {item.icon}
        </ListItemIcon>

        {effectiveSidebarOpen && (
          <>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? palette.ink : palette.muted,
              }}
            />

            {active && (
              <ChevronRightIcon
                sx={{
                  fontSize: 18,
                  color: palette.teal,
                }}
              />
            )}
          </>
        )}
      </ListItemButton>
    );

    if (item.disabled) {
      return (
        <Tooltip
          key={item.path}
          title="Coming soon"
          placement="right"
        >
          <span style={{ display: "block" }}>
            {button}
          </span>
        </Tooltip>
      );
    }

    if (!effectiveSidebarOpen) {
      return (
        <Tooltip
          key={item.path}
          title={item.label}
          placement="right"
        >
          <span style={{ display: "block" }}>
            {button}
          </span>
        </Tooltip>
      );
    }

    return button;
  };

  const handleLogout = () => {
    setOpenLogoutMenu(true)
    candidateClearLocalStorage()
    navigate("/for-candidate/login")
  }
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: palette.bg || "#f7f9fa" }}>
      {/* TOP BAR — always full width, never moves, never duplicates */}
      <Box
        sx={{
          height: { xs: 56, sm: TOPBAR_HEIGHT },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1, sm: 2.5 },
          borderBottom: `1px solid ${palette.line}`,
          backgroundColor: palette.paper,
          position: "sticky",
          top: 0,
          zIndex: 1100,
        }}
      >
        {/* Left: hamburger + logo + breadcrumbs */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1.5 },
            minWidth: 0,
          }}
        >
          <IconButton
            onClick={() => {
              if (!isMobile) {
                setSidebarOpen((prev) => !prev);
              }
            }}
            size="small"
            sx={{
              color: palette.teal,
              p: { xs: 0.5, sm: 1 },
              "&:hover": {
                backgroundColor: palette.tealSoft,
              },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          {/* <Typography
            noWrap
            sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 19, color: palette.ink }}
          > */}
          <Box
            component="img"
            src={logoDark}
            alt="Ri8Fit Logo"
            sx={{
              height: { xs: 24, sm: 30 },
              width: "auto",
              maxWidth: { xs: 90, sm: "none" },
              objectFit: "contain",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          />
          {/* </Typography> */}

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              borderColor: palette.line,
              mx: 1,
              display: { xs: "none", sm: "block" },
            }}
          />

          <Breadcrumbs
            separator={
              <ChevronRightIcon
                sx={{
                  fontSize: { xs: 13, sm: 16 },
                  color: palette.muted,
                }}
              />
            }
            sx={{
              minWidth: 0,
              "& .MuiBreadcrumbs-ol": {
                alignItems: "center",
                flexWrap: "nowrap",
              },
            }}
          >
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: "16px",
                backgroundColor: palette.tealSoft,
                color: palette.muted,
                textDecoration: "none",
                fontSize: 13.5,
              }}
            >
              <HomeIcon sx={{ fontSize: 16 }} />
              Home
            </Box>
            {currentLabel && (
              <Typography
                sx={{
                  fontSize: { xs: 12, sm: 13.5 },
                  fontWeight: 700,
                  color: palette.ink,

                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",

                  maxWidth: { xs: 80, sm: "none" },
                }}
              >
                {currentLabel}
              </Typography>
            )}
          </Breadcrumbs>
        </Box>

        {/* Right: user info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ textAlign: "right", minWidth: 0 }}>
            <Typography
              title={displayName}
              sx={{
                fontSize: { xs: 12, sm: 13.5 },
                fontWeight: 700,
                color: palette.ink,
                lineHeight: 1.3,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: { xs: 90, sm: 200 },
              }}
            >
              {displayName}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: palette.tealSoft,
              color: palette.teal,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={handleAvatarClick}
          >
            <Person2 />
          </Avatar>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 180,
                borderRadius: 2,
                boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
              },
            }}
          >
            {/* Who is logged in */}
            <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", gap: 1.25 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: palette.tealSoft, color: palette.teal }}>
                <Person2 fontSize="small" />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{ fontSize: 13.5, fontWeight: 700, color: palette.ink, textTransform: "capitalize" }}
                >
                  {displayName}
                </Typography>
                {displayEmail && (
                  <Typography noWrap sx={{ fontSize: 11.5, color: palette.muted }}>
                    {displayEmail}
                  </Typography>
                )}
              </Box>
            </Box>
            <Divider sx={{ borderColor: palette.line }} />
            <MenuItem
              onClick={() => {
                handleClose();
                handleLogout();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>

        </Box>
      </Box>

      {/* BODY: sidebar + content, top bar is NOT repeated here */}
      <Box sx={{ display: "flex" }}>
        <Box
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${palette.line}`,
            backgroundColor: palette.paper,
            height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
            position: "sticky",
            top: TOPBAR_HEIGHT,
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {/* MAIN section */}
          <Box sx={{ px: effectiveSidebarOpen ? 1.5 : 1, pt: 2.5 }}>
            {renderSectionLabel("Main")}
            <List sx={{ p: 0 }}>{MAIN_ITEMS.map(renderNavItem)}</List>
          </Box>

          <Divider sx={{ borderColor: palette.line, my: 2 }} />

          {/* SETTINGS section */}
          <Box sx={{ px: effectiveSidebarOpen ? 1.5 : 1 }}>
            {renderSectionLabel("Settings")}
            <List sx={{ p: 0 }}>{SETTINGS_ITEMS.map(renderNavItem)}</List>
          </Box>

          {/* Empty spacer at the bottom (no button here) */}
          <Box sx={{ flexGrow: 1 }} />
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            backgroundColor: palette.bg || "#f7f9fa",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default CandidateLayout;