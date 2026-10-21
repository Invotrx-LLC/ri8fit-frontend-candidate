import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { googleLogin } from "../../../../actions/login.js";
import { AppContext } from "../../../../AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import qs from "qs";
import { useDispatch } from "react-redux";
import { candidateUpdateFormData } from "../../../../store/slices/candidateSlice";
import {
  CANDIDATE_ACCESS_TOKEN,
  CANDIDATE_REFRESH_TOKEN,
  getItem,
  IS_AUTHENTICATED,
  setItem,
} from "../../../../utils/helper.js";
import { useCandidateLoginMutation } from "../../../../store/api/settings/CandidatePortalApis";
import ForgotPassword from "../Forgotpassword/forgotPassword.jsx";
import employerImage from "../../../../assets/career_login_illustration_v4.svg";

const TOKEN_EXPIRY_KEY = "CANDIDATE_TOKEN_EXPIRY";

const MicrosoftIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
  </svg>
);

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const PersonIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="8" r="4" stroke="#bbb" strokeWidth="1.8" />
    <path
      d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
      stroke="#bbb"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const CandidateLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const { setLoading } = useContext(AppContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [candidateLogin] = useCandidateLoginMutation();

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTogglePassword = () => setShowPassword((p) => !p);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { email: !formData.email, password: !formData.password };
    setErrors(newErrors);
    if (Object.values(newErrors).includes(true)) return;

    setLoading(true);
    try {
      const response = await candidateLogin({
        email: formData.email,
        password: formData.password,
      }).unwrap();
      const data = response;
      console.log("Login response:", data);
      if (data.success && data.data?.access_token) {
        setItem(CANDIDATE_ACCESS_TOKEN, data.data.access_token);
        setItem(CANDIDATE_REFRESH_TOKEN, data.data.refresh_token);
        setItem(TOKEN_EXPIRY_KEY, data.data.expiry_time);
        setItem(IS_AUTHENTICATED, JSON.stringify(true));
        setItem("candidate_user", JSON.stringify(data?.data?.user));
        dispatch(
          candidateUpdateFormData({
            section: "loginDetails",
            updates: {
              accessToken: data.data.access_token,
              refreshToken: data.data.refresh_token,
              expiry: data.data.expiry_time,
              user: data.data.user,
              isNewUser: data.data.is_new_user,
            },
          }),
        );
        toast.success(data?.message);
        navigate(
          data.data.is_new_user
            ? "/for-candidate/profile-register"
            : "/for-candidate/profile",
        );
      } else {
        toast.error(data?.message || "Login failed");
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.error || "Error logging in");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const resp = await googleLogin(setLoading);
    if (resp?.google_oauth_url) window.open(resp.google_oauth_url, "_self");
  };

  useEffect(() => {
    const isAuthenticated =
      getItem(IS_AUTHENTICATED) === "true" && !!getItem(CANDIDATE_ACCESS_TOKEN);

    if (!isAuthenticated) return; // not logged in → stay on login page

    const isNewUser = JSON.parse(getItem("is_new_user") || "false");

    navigate(
      isNewUser ? "/for-candidate/profile-register" : "/for-candidate/profile",
      { replace: true }
    );
  }, []);

  /* ── styles ─────────────────────────────────────────────────────────────── */
  const fieldSx = {
    mb: 1.5,
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      background: "#fff",
      fontSize: "13px",
      height: "44px",
      "& fieldset": { borderColor: "#dde1e7" },
      "&:hover fieldset": { borderColor: "#2B7B7E" },
      "&.Mui-focused fieldset": {
        borderColor: "#2B7B7E",
        borderWidth: "1.5px",
      },
    },
    "& .MuiInputBase-input": { py: "10px", fontSize: "13px" },
    "& .MuiInputBase-input::placeholder": { color: "#bbb", opacity: 1 },
    "& .MuiFormHelperText-root": { mt: 0.3, fontSize: "11px" },
  };

  const socialBtnSx = {
    background: "#fff",
    border: "1px solid #dde1e7",
    color: "#374151",
    textTransform: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    py: 0.9,
    gap: 1,
    boxShadow: "none",
    "&:hover": {
      background: "#f5f7fa",
      borderColor: "#b0b7c3",
      boxShadow: "none",
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        position: "fixed",
        top: "64px" /* match your navbar height */,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {/* ══════════════ LEFT — teal hero ══════════════════════════════════ */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          width: { md: "42%", lg: "42%" },
          flexShrink: 0,
          background: "#2B7B7E",
          position: "relative",
          overflow: "hidden",
          pt: { md: 5, lg: 6 },
          px: { md: 4, lg: 5 },
        }}
      >
        <Typography
          sx={{
            color: "#fff",
            fontSize: { md: "24px", lg: "30px", xl: "34px" },
            fontWeight: 700,
            lineHeight: 1.2,
            mb: 1.5,
            letterSpacing: "-0.3px",
          }}
        >
          Find Your Perfect Career
          <br />
          Match Faster
        </Typography>

        <Typography
          sx={{
            color: "rgba(255,255,255,0.72)",
            fontSize: { md: "12px", lg: "18px" },
            lineHeight: 1.75,
            maxWidth: 340,
          }}
        >
          Discover relevant jobs, track applications, prepare for interviews, and manage offers all from one platform.
        </Typography>

        {/* illustration pinned to bottom */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <img
            src={employerImage}
            alt="Career illustration"
            style={{
              width: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              objectPosition: "bottom center",
              display: "block",
            }}
          />
        </Box>
      </Box>

      {/* ══════════════ RIGHT — login form ════════════════════════════════ */}
      <Box
        sx={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: { xs: "#fff", md: "#f0f2f5" },
          overflowY: "auto",
          overflowX: "hidden",
          px: { xs: 3, sm: 5, md: 4, lg: 5, xl: 6 },
          py: { xs: 4, md: 2 },
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#ccc",
            borderRadius: "4px",
          },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400, my: "auto" }}>
          {forgotPasswordOpen ? (
            <ForgotPassword setForgotPasswordOpen={setForgotPasswordOpen} />
          ) : (
            <>
              {/* heading */}
              <Typography
                sx={{
                  fontSize: { xs: "22px", md: "22px", lg: "24px" },
                  fontWeight: 700,
                  color: "#1F242F",
                  mb: 0.4,
                  lineHeight: 1.2,
                }}
              >
                Login
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#9C9C9C", mb: 2.5 }}>
                Enter credentials to login
              </Typography>

              {/* form */}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  placeholder="Email ID"
                  name="email"
                  size="small"
                  variant="outlined"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  helperText={errors.email ? "Email is required" : ""}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />

                <TextField
                  fullWidth
                  placeholder="Enter Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  size="small"
                  variant="outlined"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  helperText={errors.password ? "Password is required" : ""}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOff
                              sx={{ fontSize: 17, color: "#bbb" }}
                            />
                          ) : (
                            <Visibility sx={{ fontSize: 17, color: "#bbb" }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />

                {/* forgot */}
                <Typography
                  onClick={() => setForgotPasswordOpen(true)}
                  sx={{
                    fontSize: "12px",
                    color: "#2B7B7E",
                    fontWeight: 500,
                    cursor: "pointer",
                    mb: 2,
                    display: "inline-block",
                  }}
                >
                  Forgot Password
                </Typography>

                {/* login btn */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disableElevation
                  sx={{
                    display: "block",
                    background: "#2B7B7E",
                    color: "#fff",
                    fontWeight: 700,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontSize: "15px",
                    py: 1.1,
                    mb: 1.5,
                    letterSpacing: "0.3px",
                    "&:hover": { background: "#235a5c" },
                  }}
                >
                  Log In
                </Button>
              </Box>

              {/* create account */}
              <Typography sx={{ fontSize: "12px", color: "#555", mb: 2 }}>
                Dont have Account ?..{" "}
                <Box
                  component="span"
                  onClick={() => navigate("/for-candidate/signup")}
                  sx={{ color: "#2B7B7E", fontWeight: 700, cursor: "pointer" }}
                >
                  Create Account
                </Box>
              </Typography>

              {/* divider */}
              <Divider
                sx={{ mb: 2, "&::before,&::after": { borderColor: "#dde1e7" } }}
              >
                <Typography sx={{ fontSize: "11px", color: "#aaa", px: 1 }}>
                  or continue with
                </Typography>
              </Divider>

              {/* social buttons */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleLogin}
                  startIcon={<GoogleIcon />}
                  sx={socialBtnSx}
                >
                  Sign in with Google
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MicrosoftIcon />}
                  sx={socialBtnSx}
                >
                  Sign in with Microsoft
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CandidateLogin;