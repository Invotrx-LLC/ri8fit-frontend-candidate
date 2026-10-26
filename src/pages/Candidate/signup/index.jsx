import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Select,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { googleLogin } from "../../../actions/login";
import { AppContext } from "../../../AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useCandidateSignupMutation,
  useVerifyCandidateOtpMutation,
  useResendCandidateOtpMutation,
} from "../../../store/api/settings/CandidatePortalApis";
import {
  CANDIDATE_ACCESS_TOKEN,
  CANDIDATE_REFRESH_TOKEN,
  IS_AUTHENTICATED,
  setItem,
} from "../../../utils/helper";
import employerImage from "../../../assets/career_login_illustration_v4.svg";

/* ── icons ───────────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
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

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
  </svg>
);

/* ── country options ─────────────────────────────────────────────────────── */
const countryOptions = [
  {
    code: "IN",
    label: "India",
    phone: "91",
    flag: (
      <svg width="22" height="15" viewBox="0 0 24 16">
        <rect x="0" y="0" width="24" height="5.33" fill="#FF9933" />
        <rect x="0" y="5.33" width="24" height="5.33" fill="#FFFFFF" />
        <rect x="0" y="10.66" width="24" height="5.33" fill="#138808" />
        <circle cx="12" cy="8" r="2" fill="#000080" />
      </svg>
    ),
  },
  {
    code: "US",
    label: "United States",
    phone: "1",
    flag: (
      <svg width="22" height="15" viewBox="0 0 24 16">
        <rect x="0" y="0" width="24" height="16" fill="#B22234" />
        {[0, 2.46, 4.92, 7.38, 9.84, 12.3].map((y, i) => (
          <rect key={i} x="0" y={y} width="24" height="1.23" fill="#FFFFFF" />
        ))}
        <rect x="0" y="0" width="9.6" height="8.62" fill="#3C3B6E" />
      </svg>
    ),
  },
];

/* ── shared compact field style ─────────────────────────────────────────── */
const fs = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    background: "#fff",
    height: "40px",
    fontSize: "13px",
    "& fieldset": { borderColor: "#dde1e7" },
    "&:hover fieldset": { borderColor: "#2B7B7E" },
    "&.Mui-focused fieldset": { borderColor: "#2B7B7E", borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": { py: "8px", fontSize: "13px" },
  "& .MuiInputBase-input::placeholder": { color: "#bbb", opacity: 1 },
  "& .MuiFormHelperText-root": { mt: "2px", fontSize: "10px", lineHeight: 1.2 },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const CandidateSignup = () => {
  const navigate = useNavigate();
  const { setLoading } = useContext(AppContext);
  const [candidateSignup] = useCandidateSignupMutation();
  const [verifyCandidateOtp] = useVerifyCandidateOtpMutation();
  const [resendCandidateOtp] = useResendCandidateOtpMutation();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone_no: "",
  });
  const [errors, setErrors] = useState({
    first_name: false,
    last_name: false,
    email: false,
    emailMessage: "",
    password: false,
    passwordMessage: "",
    confirm_password: false,
    confirmMessage: "",
    phone_no: false,
  });
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [openOtp, setOpenOtp] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const [signupLoading, setSignupLoading] = useState(false);

  /* OTP countdown */
  useEffect(() => {
    let iv;
    if (openOtp && !canResend) {
      iv = setInterval(() => {
        setTimer((p) => {
          if (p <= 1) {
            clearInterval(iv);
            setCanResend(true);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(iv);
  }, [openOtp, canResend]);
/* handle Google OAuth redirect back into this page */
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const is_new_user = params.get("is_new_user");

  if (access_token) {
    setItem(CANDIDATE_ACCESS_TOKEN, access_token);
    setItem(CANDIDATE_REFRESH_TOKEN, refresh_token);
    setItem(IS_AUTHENTICATED, JSON.stringify(true));

    // strip the tokens out of the visible URL
    window.history.replaceState({}, document.title, window.location.pathname);

    navigate(
      is_new_user === "true"
        ? "/for-candidate/profile-register"
        : "/for-candidate/profile"
    );
  }
}, []);
  /* helpers */
  const formatPhone = (v, code) => {
    const c = v.replace(/[^0-9]/g, "");
    if (code === "+91") return c.slice(0, 10);
    if (code === "+1") {
      const d = c.slice(0, 10);
      const m = d.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (!m) return d;
      return [m[1], m[2] && `-${m[2]}`, m[3] && `-${m[3]}`]
        .filter(Boolean)
        .join("");
    }
    return v;
  };
  const getFlagIcon = (code) =>
    countryOptions.find((o) => `+${o.phone}` === code)?.flag ?? null;

  /* password strength */
  const pw = formData.password;
  const pwChecks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const pwValid = Object.values(pwChecks).every(Boolean);

  /* change */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone_no") {
      setFormData((p) => ({ ...p, phone_no: formatPhone(value, countryCode) }));
      setErrors((p) => ({ ...p, phone_no: false }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
      setErrors((p) => ({
        ...p,
        [name]: false,
        emailMessage: "",
        passwordMessage: "",
        confirmMessage: "",
      }));
    }
  };

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex =
      countryCode === "+91" ? /^\d{10}$/ : /^\d{3}-\d{3}-\d{4}$/;
    const ne = {
      first_name: !formData.first_name.trim(),
      last_name: !formData.last_name.trim(),
      email:
        !formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      emailMessage: !formData.email
        ? "Email is required"
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
          ? "Enter a valid email"
          : "",
      password: !pwValid,
      passwordMessage: !pw
        ? "Password is required"
        : !pwValid
          ? "Password doesn't meet requirements"
          : "",
      confirm_password:
        !formData.confirm_password || pw !== formData.confirm_password,
      confirmMessage: !formData.confirm_password
        ? "Confirm your password"
        : pw !== formData.confirm_password
          ? "Passwords do not match"
          : "",
      phone_no: !formData.phone_no || !phoneRegex.test(formData.phone_no),
    };
    setErrors(ne);
    if (
      ne.first_name ||
      ne.last_name ||
      ne.email ||
      ne.password ||
      ne.confirm_password ||
      ne.phone_no
    ) {
      toast.error("Please fill all fields correctly");
      return;
    }
    setLoading(true);
    setSignupLoading(true);
    try {
      const fullPhone = countryCode + formData.phone_no.replace(/-/g, "");
      const params = new URLSearchParams({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        phone_no: fullPhone,
      }).toString();
      const res = await candidateSignup({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        phone_no: fullPhone,
      }).unwrap();
      if (res.success && res.data?.access_token) {
        setAccessToken(res.data.access_token);
        setItem(CANDIDATE_ACCESS_TOKEN, res.data.access_token);
        setItem(CANDIDATE_REFRESH_TOKEN, res.data.refresh_token);
        setItem(IS_AUTHENTICATED, JSON.stringify(true));
        setOpenOtp(true);
        setCanResend(false);
        setTimer(60);
        toast.success("Signup successful! Please verify OTP.");
      } else {
        const msg = res?.message || "Signup failed";
        setErrors((p) => ({
          ...p,
          email: true,
          emailMessage: msg.includes("email already exists")
            ? "Email already registered"
            : msg,
        }));
        toast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message?.includes("email already exists")
        ? "Email already registered"
        : err.response?.data?.message || "Error during signup";
      setErrors((p) => ({ ...p, email: true, emailMessage: msg }));
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim()) {
      setOtpError("Please enter OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyCandidateOtp({ otp }).unwrap();
      if (res.success) {
        setOpenOtp(false);
        toast.success(res?.message || "OTP verified!");
        setItem("is_new_user", JSON.stringify(res?.data?.is_new_user));
        navigate(
          res?.data?.is_new_user
            ? "/for-candidate/profile-register"
            : "/for-candidate/profile",
        );
      } else {
        setOtpError("Invalid OTP");
        toast.error("Invalid OTP");
      }
    } catch {
      setOtpError("Error verifying OTP");
      toast.error("Error verifying OTP");
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        phone_no: countryCode + formData.phone_no.replace(/-/g, ""),
      }).toString();
      const res = await resendCandidateOtp(params).unwrap();
      if (res.success) {
        setOtpError("");
        setAccessToken(res.access_token);
        toast.success("OTP resent!");
        setTimer(60);
        setCanResend(false);
      } else toast.error(res.data?.message || "Failed to resend OTP");
    } catch {
      toast.error("Error resending OTP");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const resp = await googleLogin(setLoading);
    if (resp?.google_oauth_url) window.open(resp.google_oauth_url, "_self");
  };

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "calc(100vh - 64px)" /* subtract navbar height */,
        overflow: "hidden" /* LOCK — outer page never scrolls */,
        position: "fixed" /* fix to viewport so navbar can't push it */,
        top: "64px" /* match navbar height */,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* ══════════ LEFT — teal panel, fully locked ══════════════════════ */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          width: { md: "42%", lg: "42%" },
          flexShrink: 0,
          background: "#2B7B7E",
          position: "relative",
          overflow: "hidden" /* image never causes left to scroll */,
          pt: { md: 4, lg: 5 },
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
            fontStyle: "normal",
          }}
        >
          Start Your Career Journey
          <br />
          With Ri8Fit
        </Typography>
        <Typography
          sx={{
            color: "rgba(255,255,255,0.72)",
            fontSize: { md: "12px", lg: "18px" },
            lineHeight: 1.75,
            maxWidth: 340,
          }}
        >
          Create your profile - discover relevant jobs, track applications, prepare for interviews, and manage offers all from one platform.
          opportunities.
        </Typography>
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
            alt="illustration"
            style={{
              width: "100%",
              maxHeight: "72vh",
              objectFit: "contain",
              objectPosition: "bottom center",
              display: "block",
            }}
          />
        </Box>
      </Box>

      {/* ══════════ RIGHT — only this panel scrolls ══════════════════════ */}
      <Box
        sx={{
          flex: 1,
          height: "100%" /* fill parent exactly */,
          overflowY: "auto" /* scroll ONLY here */,
          overflowX: "hidden",
          background: { xs: "#fff", md: "#f0f2f5" },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 3, sm: 5, md: 4, lg: 5, xl: 6 },
          py: { xs: 3, md: 2 },
          /* slim scrollbar */
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#ccc",
            borderRadius: "4px",
          },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          {/* ── OTP screen ─────────────────────────────────────────────── */}
          {openOtp ? (
            <Box
              sx={{
                mt: 6,
                bgcolor: "#fff",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                p: 4,
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "20px", mb: 0.5,color:"#1F242F" }}>
                Enter OTP
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#9C9C9C", mb: 2.5 }}>
                We sent a code to <strong>{formData.email}</strong>
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setOtpError("");
                }}
                error={!!otpError}
                helperText={otpError}
                inputProps={{
                  maxLength: 6,
                  style: {
                    textAlign: "center",
                    fontSize: "20px",
                    letterSpacing: "6px",
                  },
                }}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    height: "52px",
                  },
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleOtpSubmit}
                sx={{
                  background: "#2B7B7E",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: "15px",
                  py: 1.1,
                  mb: 2,
                  "&:hover": { background: "#235a5c" },
                }}
              >
                Verify OTP
              </Button>
              {canResend ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResendOtp}
                  sx={{
                    borderColor: "#2B7B7E",
                    color: "#2B7B7E",
                    fontWeight: 600,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontSize: "13px",
                  }}
                >
                  Resend OTP
                </Button>
              ) : (
                <Typography sx={{ fontSize: "13px", color: "#777" }}>
                  Resend OTP in{" "}
                  <strong style={{ color: "#2B7B7E" }}>
                    {String(Math.floor(timer / 60)).padStart(2, "0")}:
                    {String(timer % 60).padStart(2, "0")}
                  </strong>
                </Typography>
              )}
            </Box>
          ) : (
            /* ── Signup form ─────────────────────────────────────────────── */
            <>
              {/* <Typography
                sx={{
                  fontSize: { xs: "22px", md: "22px", lg: "24px" },
                  fontWeight: 700,
                  color: "#1F242F",
                  mb: 0.3,
                  lineHeight: 1.2,
                }}
              >
                Register
              </Typography> */}
              {/* <Typography sx={{ fontSize: "12px", color: "#9C9C9C", mb: 1.5 }}>
                Enter details to create your account
              </Typography> */}

              {/* First + Last */}
              <Box sx={{ display: "flex", gap: 1.2, mb: 1.2 }}>
                <TextField
                  fullWidth
                  placeholder="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={errors.first_name}
                  helperText={errors.first_name ? "Required" : ""}
                  sx={fs}
                />
                <TextField
                  fullWidth
                  placeholder="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={errors.last_name}
                  helperText={errors.last_name ? "Required" : ""}
                  sx={fs}
                />
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                {/* Email */}
                <TextField
                  fullWidth
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  helperText={errors.email ? errors.emailMessage : ""}
                  sx={{ ...fs, mb: 1.2 }}
                />

                {/* Password */}
                <TextField
                  fullWidth
                  placeholder="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  helperText={errors.password ? errors.passwordMessage : ""}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((p) => !p)}
                          size="small"
                          edge="end"
                        >
                          {showPassword ? (
                            <VisibilityOff
                              sx={{ fontSize: 16, color: "#bbb" }}
                            />
                          ) : (
                            <Visibility sx={{ fontSize: 16, color: "#bbb" }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ ...fs, mb: pw ? 0.6 : 1.2 }}
                />

                {/* Password strength dots */}
                {pw && (
                  <Box
                    sx={{ mb: 1.2, display: "flex", flexWrap: "wrap", gap: 1 }}
                  >
                    {[
                      ["length", "8+ chars"],
                      ["uppercase", "Uppercase"],
                      ["number", "Number"],
                      ["special", "Special char"],
                    ].map(([k, label]) => (
                      <Box
                        key={k}
                        sx={{ display: "flex", alignItems: "center", gap: 0.4 }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: pwChecks[k] ? "#2B7B7E" : "#ddd",
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "10px",
                            color: pwChecks[k] ? "#2B7B7E" : "#aaa",
                          }}
                        >
                          {label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Confirm Password */}
                <TextField
                  fullWidth
                  placeholder="Confirm Password"
                  name="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={handleChange}
                  error={errors.confirm_password}
                  helperText={
                    errors.confirm_password ? errors.confirmMessage : ""
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirm((p) => !p)}
                          size="small"
                          edge="end"
                        >
                          {showConfirm ? (
                            <VisibilityOff
                              sx={{ fontSize: 16, color: "#bbb" }}
                            />
                          ) : (
                            <Visibility sx={{ fontSize: 16, color: "#bbb" }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ ...fs, mb: 1.2 }}
                />

                {/* Phone */}
                <TextField
                  fullWidth
                  placeholder={
                    countryCode === "+91" ? "10-digit number" : "555-555-1234"
                  }
                  name="phone_no"
                  value={formData.phone_no}
                  onChange={handleChange}
                  error={errors.phone_no}
                  helperText={
                    errors.phone_no
                      ? countryCode === "+91"
                        ? "Enter valid 10-digit number"
                        : "Enter valid US number"
                      : ""
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0 }}>
                        <Select
                          value={countryCode}
                          onChange={(e) => {
                            setCountryCode(e.target.value);
                            setFormData((p) => ({ ...p, phone_no: "" }));
                          }}
                          size="small"
                          sx={{
                            minWidth: 82,
                            "& .MuiSelect-select": {
                              display: "flex",
                              alignItems: "center",
                              py: 0.5,
                              pr: "26px !important",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              border: "none",
                            },
                          }}
                          renderValue={(v) => (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              {getFlagIcon(v)}
                              <Typography sx={{ fontSize: "12px" }}>
                                {v}
                              </Typography>
                            </Box>
                          )}
                        >
                          {countryOptions.map((o) => (
                            <MenuItem key={o.code} value={`+${o.phone}`}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {o.flag} {o.label} (+{o.phone})
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <Box
                          sx={{ 
                            width: "1px",
                            height: "20px",
                            background: "#dde1e7",
                            mr: 1,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ ...fs, mb: 1.5 }}
                />

                {/* Sign Up */}
                <Button
  fullWidth
  type="submit"
  variant="contained"
  disableElevation
  disabled={signupLoading}
  sx={{
    background: "#2B7B7E",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "8px",
    textTransform: "none",
    fontSize: "15px",
    py: 1,
    mb: 1.2,

    "&:hover": {
      background: "#235a5c",
    },

    "&.Mui-disabled": {
      background: "#2B7B7E",
      color: "#fff",
      opacity: 0.8,
    },
  }}
>
  {signupLoading ? (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <CircularProgress
        size={18}
        thickness={5}
        sx={{ color: "#fff" }}
      />
      Creating account...
    </Box>
  ) : (
    "Sign Up"
  )}
</Button>
              </Box>

              {/* Login link */}
              <Typography sx={{ fontSize: "12px", color: "#555", mb: 1.5 }}>
                Already have an account?{" "}
                <Box
                  component="span"
                  onClick={() => navigate("/for-candidate/login")}
                  sx={{ color: "#2B7B7E", fontWeight: 700, cursor: "pointer" }}
                >
                  Login
                </Box>
              </Typography>

              {/* Divider */}
              <Divider
                sx={{
                  mb: 1.5,
                  "&::before,&::after": { borderColor: "#dde1e7" },
                }}
              >
                <Typography sx={{ fontSize: "11px", color: "#aaa", px: 1 }}>
                  or continue with
                </Typography>
              </Divider>

              {/* Social */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleGoogleLogin}
                  startIcon={<GoogleIcon />}
                  sx={{
                    background: "#fff",
                    border: "1px solid #dde1e7",
                    color: "#374151",
                    textTransform: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    py: 0.8,
                    boxShadow: "none",
                    "&:hover": {
                      background: "#f5f7fa",
                      borderColor: "#b0b7c3",
                      boxShadow: "none",
                    },
                  }}
                >
                  Sign up with Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MicrosoftIcon />}
                  sx={{
                    background: "#fff",
                    border: "1px solid #dde1e7",
                    color: "#374151",
                    textTransform: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    py: 0.8,
                    boxShadow: "none",
                    "&:hover": {
                      background: "#f5f7fa",
                      borderColor: "#b0b7c3",
                      boxShadow: "none",
                    },
                  }}
                >
                  Sign up with Microsoft
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CandidateSignup;