import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CANDIDATE_ACCESS_TOKEN,
  CANDIDATE_REFRESH_TOKEN,
  candidateClearLocalStorage,
  getItem,
  IS_AUTHENTICATED,
  setItem,
} from "../utils/helper.js";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ri8fitLogo from "../assets/ri8fit-logo.svg";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

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

const candiDateSettings = [{ name: "Logout", path: "/about" }];
const HMsettings = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Logout", path: "/about" },
];

function ResponsiveAppBar(props) {
  const location = useLocation();
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [openMenu, setOpenMenu] = React.useState(null);
  const navigate = useNavigate();
  const isLogin = getItem(IS_AUTHENTICATED);
  const isRegisterPage = location.pathname.includes("for-candidate");
  const settings = isRegisterPage ? candiDateSettings : HMsettings;
  // The old path (formData.candidateCompleateDetails.full_name) is never
  // filled, so the name was always blank — check every place it can be
  const candidateCompleateDetails = useSelector(
    (state) => state?.candidate?.formData?.candidateCompleateDetails,
  );
  const candidateDetails = useSelector(
    (state) => state?.candidate?.formData?.candidateDetails,
  );
  const loginUser = useSelector(
    (state) => state?.candidate?.formData?.loginDetails?.user,
  );
  const candidateName = resolveCandidateName(
    candidateCompleateDetails,
    candidateDetails,
    loginUser,
    safeParse(getItem("candidate_user")),
  );

  // Hide navbar on these specific pages
  if (
    location.pathname === "/" ||
    location.pathname === "/recruit" ||
    location.pathname === "/user-details" ||
    location.pathname === "/for-candidate/candidate-home"
  ) {
    return null;
  }

  // Show avatar menu only on these candidate pages
  const showAvatarMenu = [
    "/for-candidate/profile-register",
    "/for-candidate/profile-details",
    "/for-candidate/profile",
    
  ].includes(location.pathname);
  const isCandidateLogin = location.pathname === "/for-candidate/login";

  const isCandidateSignup = location.pathname === "/for-candidate/signup";
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        width: "100%",
        backgroundColor: "#ffffff",
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        zIndex: 1300,
        height: "60px",
      }}
    >
      <Box
        sx={{ ml: { xs: 2, sm: 10, md: 12 }, mr: { xs: 2, sm: 10, md: 12 } }}
      >
        <Toolbar disableGutters>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* ── Logo (shown on all pages including every /for-candidate/* page) ── */}
            <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/")}>
              <Box
                component="img"
                src={ri8fitLogo}
                alt="Ri8fit Logo"
                sx={{
                  height: { xs: "32px", sm: "36px", md: "40px" },
                  width: "auto",
                  display: "block",
                }}
              />
            </Box>

            {/* ── Mobile hamburger (kept for future use) ── */}
            <Box sx={{ display: { xs: "none", md: "none", sm: "none" } }}>
              <IconButton
                size="large"
                aria-label="open navigation menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon sx={{ color: "#4B5563" }} />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                keepMounted
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                open={Boolean(anchorElNav)}
                onClose={() => setAnchorElNav(null)}
                sx={{ display: { xs: "block", md: "none" } }}
              />
            </Box>
            {/* Login / Signup Navigation */}
            {(isCandidateLogin || isCandidateSignup) && (
              <Box sx={{ ml: "auto", mr: showAvatarMenu ? 3 : 0 }}>
                {isCandidateLogin && (
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#667085",
                    }}
                  >
                    Don't have an account?{" "}
                    <Box
                      component="span"
                      onClick={() => navigate("/for-candidate/signup")}
                      sx={{
                        color: "#2B7B7E",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        "&:hover": {
                          color: "#1F5F61",
                        },
                      }}
                    >
                      Create account
                    </Box>
                  </Typography>
                )}

                {isCandidateSignup && (
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#667085",
                    }}
                  >
                    Already have an account?{" "}
                    <Box
                      component="span"
                      onClick={() => navigate("/for-candidate/login")}
                      sx={{
                        color: "#2B7B7E",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        "&:hover": {
                          color: "#1F5F61",
                        },
                      }}
                    >
                      Log In
                    </Box>
                  </Typography>
                )}
              </Box>
            )}
            {/* ── Avatar / user menu (candidate pages only) ── */}
            {showAvatarMenu && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0, sm: 1 },
                  mr: { xs: 0, lg: 0, xl: 22 },
                }}
              >
                <Typography
                  title={candidateName}
                  sx={{
                    fontFamily: "Poppins",
                    fontWeight: 500,
                    fontSize: { xs: "13px", sm: "16px" },
                    color: "#4B5563",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: { xs: 110, sm: 220 },
                  }}
                >
                  {candidateName}
                </Typography>
                <Tooltip title="Open settings">
                  <IconButton
                    onClick={(event) => setOpenMenu(event.currentTarget)}
                    aria-haspopup="true"
                  >
                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,
                        bgcolor: "#F0FDF4",
                        color: "#2B7B7E",
                        border: "1px solid #D1FAE5",
                        cursor: "pointer",
                        transition: "all .2s ease",
                        "&:hover": {
                          bgcolor: "#E6F7F7",
                          borderColor: "#2B7B7E",
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20c0-3.333 2.667-6 6-6s6 2.667 6 6" />
                      </svg>
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: { xs: "30px", sm: "45px" } }}
                  id="candidate-menu-appbar"
                  anchorEl={openMenu}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  open={Boolean(openMenu)}
                  onClose={() => setOpenMenu(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        width: 240,
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                      },
                    },
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 2,
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "#E8F5E9",
                        color: "#2B7B7E",
                        border: "2px solid #8CE99A",
                        width: 42,
                        height: 42,
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="22"
                        viewBox="0 0 24 24"
                        width="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20c0-3.333 2.667-6 6-6s6 2.667 6 6" />
                      </svg>
                    </Avatar>

                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: "15px",
                        color: "#374151",
                        textTransform: "capitalize",
                        minWidth: 0,
                      }}
                    >
                      {candidateName || "User"}
                    </Typography>
                  </Box>

                  {/* Existing Settings */}
                  {candiDateSettings.map((setting) => (
                    <MenuItem
                      key={setting.name}
                      onClick={() => {
                        setOpenMenu(null);

                        if (setting.name === "Logout") {
                          candidateClearLocalStorage();
                          navigate("/");
                        } else {
                          navigate(setting.path);
                        }
                      }}
                      sx={{
                        py: 1.4,
                        gap: 1.5,
                        "&:hover": {
                          background: "#FEF2F2",
                        },
                      }}
                    >
                      {setting.name === "Logout" && (
                        <PowerSettingsNewIcon
                          sx={{
                            color: "#DC2626",
                            fontSize: 20,
                          }}
                        />
                      )}

                      <Typography
                        sx={{
                          fontWeight: 500,
                          color:
                            setting.name === "Logout" ? "#DC2626" : "#374151",
                        }}
                      >
                        {setting.name}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            )}
          </Box>
        </Toolbar>
        <Outlet/>
      </Box>
    </AppBar>
  );
}

export default ResponsiveAppBar;