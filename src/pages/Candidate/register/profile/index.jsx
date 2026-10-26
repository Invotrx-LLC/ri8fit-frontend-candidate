import React, { useContext, useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  FormControl,
  InputAdornment,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import TuneIcon from "@mui/icons-material/Tune";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import { keyframes } from "@emotion/react";
import { motion } from "framer-motion";
import { AppContext } from "../../../../AppContext";
import { toast } from "react-toastify";
import { getItem, CANDIDATE_ACCESS_TOKEN } from "../../../../utils/helper.js";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  candidateGetUserDetails,
  candidateSubmitUserForm,
} from "../../../../utils/candidateReigister.js";
import {
  useGetFunctionalRolesQuery,
  useLazyGetSubFunctionsQuery,
  useUploadCandidateAdditionalDetailsMutation,
  useGetCandidateResumeStatusQuery,
} from "../../../../store/api/settings/CandidatePortalApis";
import { candidateSetResumeParsedData } from "../../../../store/slices/candidateSlice";

/* ── ResumeLoader keyframes — teal theme ─────────────────────────────────── */
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.95; }
  100% { transform: scale(1); opacity: 1; }
`;
const scan = keyframes`
  0% { top: 0%; opacity: 0.8; }
  50% { opacity: 1; }
  100% { top: 100%; opacity: 0.8; }
`;
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;
const dots = keyframes`
  0%, 20% { opacity: 0; }
  40% { opacity: 1; }
  60% { opacity: 0; }
  80%, 100% { opacity: 1; }
`;

/* ── ResumeLoader — teal #2B7B7E ─────────────────────────────────────────── */
const ResumeLoader = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    height="100vh"
    sx={{
      background:
        "radial-gradient(circle, rgba(43,123,126,0.08) 0%, #f4f6fb 70%)",
    }}
    component={motion.div}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.5 }}
  >
    <Box
      sx={{
        width: 200,
        height: 250,
        borderRadius: 4,
        background:
          "linear-gradient(145deg, #ffffff 0%, rgba(43,123,126,0.08) 100%)",
        boxShadow: "0 12px 35px rgba(43,123,126,0.18)",
        position: "relative",
        overflow: "hidden",
        animation: `${pulse} 3s infinite ease-in-out`,
        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          borderStyle: "solid",
          borderWidth: "0 40px 40px 0",
          borderColor:
            "rgba(43,123,126,0.2) transparent transparent rgba(43,123,126,0.2)",
        },
      }}
      component={motion.div}
      animate={{ rotate: [0, 1, -1, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {[...Array(8)].map((_, i) => (
        <Box
          key={i}
          sx={{
            width: `${60 + (i % 3) * 20}%`,
            height: 14,
            borderRadius: 2,
            mt: i === 0 ? 3 : 2.5,
            mx: "auto",
            background:
              "linear-gradient(90deg, rgba(43,123,126,0.18) 25%, rgba(43,123,126,0.08) 50%, rgba(43,123,126,0.18) 75%)",
            backgroundSize: "400px 100%",
            animation: `${shimmer} 2s infinite`,
          }}
        />
      ))}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 32,
          bgcolor: "rgba(43,123,126,0.25)",
          animation: `${scan} 2.8s linear infinite`,
        }}
      />
    </Box>

    <Typography
      variant="h5"
      sx={{ mt: 5, fontWeight: 700, color: "#2B7B7E", textAlign: "center" }}
      component={motion.div}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      Processing Resume
      <Box
        component="span"
        sx={{ animation: `${dots} 1.5s steps(4, end) infinite` }}
      >
        ...
      </Box>
    </Typography>
    <Typography
      variant="body1"
      sx={{ mt: 1.5, color: "#2B7B7E", textAlign: "center", fontWeight: 500 }}
      component={motion.div}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      Extracting Structured Data
    </Typography>
  </Box>
);

/* ── Country options ─────────────────────────────────────────────────────── */
const countryOptions = [
  {
    code: "IN",
    label: "India",
    phone: "91",
    flag: (
      <svg
        width="24"
        height="16"
        viewBox="0 0 24 16"
        style={{ marginRight: 6 }}
      >
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
      <svg
        width="24"
        height="16"
        viewBox="0 0 24 16"
        style={{ marginRight: 6 }}
      >
        <rect x="0" y="0" width="24" height="16" fill="#B22234" />
        {[0, 2.46, 4.92, 7.38, 9.84, 12.3].map((y, i) => (
          <rect key={i} x="0" y={y} width="24" height="1.23" fill="#FFFFFF" />
        ))}
        <rect x="0" y="0" width="9.6" height="8.62" fill="#3C3B6E" />
      </svg>
    ),
  },
];

const formatPhoneNumber = (value, countryCode) => {
  if (!value) return "";
  const cleaned = value.replace(/[^0-9-]/g, "");
  if (countryCode === "+91") return cleaned.slice(0, 10);
  if (countryCode === "+1") {
    const digits = cleaned.replace(/-/g, "").slice(0, 10);
    const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return digits;
    let f = match[1];
    if (match[2]) f += `-${match[2]}`;
    if (match[3]) f += `-${match[3]}`;
    return f;
  }
  return value;
};

/* ── availability enum -> numeric code expected by the API ───────────────
   TODO: the curl sample only showed `availability=0` for one case — confirm
   the full mapping (0..4 below is a guess based on ascending time-to-join). */
const availabilityMap = {
  immediate: "0",
  "2_weeks": "1",
  "1_month": "2",
  "2_months": "3",
  "3_months": "4",
};

/* Function / Position type apply only to the Clinical domain */
const isClinicalDomain = (d) => String(d || "").trim().toLowerCase() === "clinical";

/* Option lists for the two selects (value → label) */
const domainOptions = [
  { value: "Clinical", label: "Clinical" },
  { value: "Non-Clinical", label: "Non-Clinical" },
];
const availabilityOptions = [
  { value: "immediate", label: "Immediate" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "1_month", label: "1 Month" },
  { value: "2_months", label: "2 Months" },
  { value: "3_months", label: "3 Months" },
];

/* Select props: grey placeholder when empty, the option label once chosen */
const selectPlaceholder = (text, options) => ({
  displayEmpty: true,
  renderValue: (v) =>
    v ? (
      options.find((o) => o.value === v)?.label ?? v
    ) : (
      <Typography component="span" sx={{ fontSize: "13px", color: "#9C9C9C" }}>
        {text}
      </Typography>
    ),
});

/* ── shared field style — teal focus ────────────────────────────────────── */
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    background: "#fff",
    fontSize: "13px",
    "& fieldset": { borderColor: "#e0e0e0" },
    "&:hover fieldset": { borderColor: "#2B7B7E" },
    "&.Mui-focused fieldset": { borderColor: "#2B7B7E", borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { color: "#9C9C9C", fontSize: "13px" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#2B7B7E" },
  "& .MuiFormHelperText-root": { fontSize: "11px", mt: "2px" },
};

/* ── reusable section header (icon badge + title + divider) ─────────────── */
const SectionHeader = ({ icon, title, hint }) => (
  <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "8px",
          background: "#EAF4F4",
          color: "#2B7B7E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: 16.5, fontWeight: 700, color: "#1F2937" }}>
        {title}
      </Typography>
      {hint && (
        <Typography sx={{ fontSize: 12, color: "#9CA3AF", ml: "auto" }}>
          {hint}
        </Typography>
      )}
    </Box>
    <Box sx={{ height: "1px", bgcolor: "#E5E7EB", mt: 1.25 }} />
  </Box>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const CandidateProfile = () => {
  const [errors, setErrors] = useState({});
  const { setLoading, formData = {}, setFormData } = useContext(AppContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loginDetails = useSelector(
    (state) => state?.candidate?.formData?.loginDetails || {},
  );
  const { email, phonenumber } = loginDetails?.user || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [selectedSubFunction, setSelectedSubFunction] = useState(null);
  const [functionLoading, setFunctionLoading] = useState(false);
  const [subFunctionLoading, setSubFunctionLoading] = useState(false);
  const [functionOptions, setFunctionOptions] = useState([]);
  const [subFunctionOptions, setSubFunctionOptions] = useState([]);
  const { data: functionalRolesData, isLoading: isFunctionalRolesLoading } =
    useGetFunctionalRolesQuery();
  const [triggerGetSubFunctions] = useLazyGetSubFunctionsQuery();
  const [uploadCandidateAdditionalDetails] =
    useUploadCandidateAdditionalDetailsMutation();
  const [taskId, setTaskId] = useState(null);

  // Polls only while a taskId is set — stops the moment we navigate away
  // (component unmounts) or we explicitly clear it on failure.
  const { data: statusData, error: statusError } = useGetCandidateResumeStatusQuery(
    taskId,
    {
      skip: !taskId,
      pollingInterval: 3000,
    },
  );

  useEffect(() => {
    if (!statusData) return;

    const payload = statusData?.data;

    // Completed: the parser has attached resume_data once processing finishes.
    // (We haven't seen the in-progress response shape directly — if it turns out
    // the API returns an explicit "processing"/"pending" indicator instead, that
    // would be a more reliable signal than this presence check. Confirm by
    // watching an earlier poll in Network tab before resume_data appears.)
    if (payload?.resume_data) {
      setTaskId(null);
      dispatch(candidateSetResumeParsedData(payload));
      toast.success("Registration successful 🎉");
      navigate("/for-candidate/profile-details");
      return;
    }

    // Explicit failure signal
    if (statusData?.success === false) {
      setTaskId(null);
      setIsSubmitting(false);
      toast.error(statusData?.message || "Resume processing failed. Please try again.");
    }
    // otherwise: still processing, no resume_data yet — keep polling
  }, [statusData]);

  useEffect(() => {
    if (!statusError) return;
    setTaskId(null);
    setIsSubmitting(false);
    toast.error("Couldn't check resume processing status. Please try again.");
  }, [statusError]);

  const safeFormData = formData || {};

  const fetchFunctions = async () => {
    try {
      setFunctionLoading(true);
      const response = functionalRolesData || [];
      const functions = Array.isArray(response)
        ? response
        : response?.data || [];
      setFunctionOptions(functions);
    } catch {
      setFunctionOptions([]);
    } finally {
      setFunctionLoading(false);
    }
  };

  const fetchSubFunctions = async (key) => {
    if (!key) {
      setSubFunctionOptions([]);
      return;
    }
    try {
      setSubFunctionLoading(true);
      const response = await triggerGetSubFunctions(key).unwrap();
      const subFunctions = Array.isArray(response)
        ? response
        : response?.data || [];
      setSubFunctionOptions(subFunctions);
    } catch {
      setSubFunctionOptions([]);
    } finally {
      setSubFunctionLoading(false);
    }
  };

  const fetchDetails = async () => {
    const token = getItem(CANDIDATE_ACCESS_TOKEN);
    setLoading(true);
    const details = await candidateGetUserDetails(token, setLoading);
    if (details) {
      let phone = details.phone_number || details.phone_no || "";
      let code = "+91";
      if (phone.startsWith("+1")) {
        code = "+1";
        phone = formatPhoneNumber(phone.slice(2), "+1");
      } else if (phone.startsWith("+91")) {
        phone = phone.slice(3);
      }
      setCountryCode(code);
      setFormData((prev) => ({
        ...prev,
        ...details,
        phone_number: phone,
        // API field names, kept 1:1 with what the backend actually returns/expects
        domain: details.domain || "",

        area_of_interest: details.area_of_interest || details.function || "",

        position_role: details.position_role || details.sub_function || "",
        availability: details.availability || "",
      }));
      // NOTE: selectedFunction / selectedSubFunction (Autocomplete objects) are
      // synced below once functionOptions / subFunctionOptions have loaded —
      // assigning the raw key string directly here was the original bug.
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDetails();
  }, []);
  useEffect(() => {
    fetchFunctions();
  }, [functionalRolesData]);
  useEffect(() => {
    if (selectedFunction?.function_key)
      fetchSubFunctions(selectedFunction.function_key);
  }, [selectedFunction]);
  useEffect(() => {
    if (loginDetails?.user) {
      setFormData((prev) => ({
        ...prev,
        email: email || "",
        phone_number: phonenumber
          ? formatPhoneNumber(
              phonenumber.slice(countryCode.length),
              countryCode,
            )
          : "",
      }));
    }
  }, [loginDetails, countryCode]);

  // Sync the Autocomplete "object" values once options are loaded and we know
  // which key came back from fetchDetails.
  useEffect(() => {
    if (safeFormData.area_of_interest && functionOptions.length && !selectedFunction) {
      const match = functionOptions.find(
        (o) => o.function_key === safeFormData.area_of_interest,
      );
      if (match) setSelectedFunction(match);
    }
  }, [functionOptions, safeFormData.area_of_interest]);

  useEffect(() => {
    if (safeFormData.position_role && subFunctionOptions.length && !selectedSubFunction) {
      const match = subFunctionOptions.find(
        (o) => o.sub_function_key === safeFormData.position_role,
      );
      if (match) setSelectedSubFunction(match);
    }
  }, [subFunctionOptions, safeFormData.position_role]);

  const validate = () => {
    const temp = {};
    if (!safeFormData.first_name) temp.first_name = "First name is required";
    if (!safeFormData.last_name) temp.last_name = "Last name is required";
    if (!safeFormData.email || !/\S+@\S+\.\S+/.test(safeFormData.email))
      temp.email = "Valid email required";
    const phoneRegex =
      countryCode === "+91" ? /^\d{10}$/ : /^\d{3}-\d{3}-\d{4}$/;
    if (
      !safeFormData.phone_number ||
      !phoneRegex.test(safeFormData.phone_number)
    )
      temp.phone_number = "Valid phone number required";
    if (!safeFormData.resume) temp.resume = "Resume is required";
    if (!safeFormData.domain) temp.domain = "Domain is required";
    // Function / Position type are asked only for the Clinical domain
    if (isClinicalDomain(safeFormData.domain)) {
      if (!safeFormData.area_of_interest)
        temp.area_of_interest = "Function is required";
      if (!safeFormData.position_role)
        temp.position_role = "Position type is required";
    }
    if (!safeFormData.availability)
      temp.availability = "Availability is required";
    return temp;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone_number") {
      setFormData({
        ...safeFormData,
        phone_number: formatPhoneNumber(value, countryCode),
      });
      setErrors((p) => ({ ...p, phone_number: null }));
    } else {
      setFormData({ ...safeFormData, [name]: value });
      setErrors((p) => ({ ...p, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    setFormData({ ...safeFormData, resume: file });
    setErrors((p) => ({ ...p, resume: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const rawPhone = safeFormData.phone_number.replace(/-/g, "");

      const fd = new FormData();
      fd.append("phone_number", rawPhone);
      fd.append("availability", availabilityMap[safeFormData.availability] ?? "");
      fd.append("domain", safeFormData.domain || "");
      const clinical = isClinicalDomain(safeFormData.domain);
      fd.append("position_role", clinical ? safeFormData.area_of_interest || "" : "");
      fd.append("area_of_interest", clinical ? safeFormData.position_role || "" : "");
      if (safeFormData.resume instanceof File) {
        fd.append("resume", safeFormData.resume);
      }

      const response = await uploadCandidateAdditionalDetails(fd).unwrap();

      if (response?.success && response?.data?.task_id) {
        setTaskId(response.data.task_id);
      } else {
        toast.error(response?.message || "Submission failed");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Submit error:", error?.response?.data || error);
      toast.error(
        error?.response?.data?.detail?.[0]?.msg ||
          "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const getFlagIcon = (code) =>
    countryOptions.find((o) => `+${o.phone}` === code)?.flag ?? null;

  /* ── render ──────────────────────────────────────────────────────────── */
  if (isSubmitting) return <ResumeLoader />;

  const resumeFile = safeFormData.resume;
  const resumeName =
    resumeFile && typeof resumeFile === "object" ? resumeFile.name : resumeFile;
  const resumeSize =
    resumeFile && typeof resumeFile === "object" && resumeFile.size
      ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB`
      : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f4f6fb",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        pt: { xs: 3, md: 4 },
        pb: 4,
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: {
            xs: "100%",
            sm: 600,
            md: 750,
            lg: 900,
            xl: 1000,
          },
          background: "#fff",
          borderRadius: {
            xs: "8px",
            sm: "12px",
            md: "16px",
          },
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          p: {
            xs: 2,
            sm: 3,
            md: 4,
            lg: 5,
          },
          mx: "auto",
        }}
      >
        {/* ── Heading ─────────────────────────────────────────────────── */}
        <Box sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1,
            }}
          >
            Create Your Profile
          </Typography>

          <Typography
            sx={{
              color: "#6B7280",
              fontSize: 15,
              mt: 0.5,
              lineHeight: 1.35,
            }}
          >
            Complete your profile to receive better job recommendations.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {/* ── Work Status ─────────────────────────────────────────────── */}
          <FormControl fullWidth sx={{ mb: { xs: 2.5, sm: 3 } }}>
            <SectionHeader
              icon={<WorkOutlineIcon sx={{ fontSize: 17 }} />}
              title="Work Status"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              {[
                {
                  value: "experienced",
                  label: "Experienced",
                  icon: "💼",
                },
                {
                  value: "fresher",
                  label: "Fresher",
                  icon: "🎓",
                },
              ].map((item) => {
                const selected = safeFormData.work_status === item.value;

                return (
                  <Box
                    key={item.value}
                    onClick={() =>
                      setFormData({
                        ...safeFormData,
                        work_status: item.value,
                      })
                    }
                    sx={{
                      flex: 1,
                      cursor: "pointer",
                      borderRadius: "12px",
                      border: selected
                        ? "2px solid #2B7B7E"
                        : "1px solid #D0D5DD",
                      background: selected ? "#F0F9F9" : "#FFFFFF",
                      py: 1,
                      px: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      transition: "all .2s ease",

                      "&:hover": {
                        borderColor: "#2B7B7E",
                        background: "#F8FCFC",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: 18 }}>
                      {selected ? "✓" : item.icon}
                    </Typography>

                    <Typography
                      sx={{
                        fontWeight: selected ? 600 : 500,
                        color: "#1F2937",
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </FormControl>

          {/* ── Personal Information ─────────────────────────────────────── */}
          <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
            <SectionHeader
              icon={<PersonOutlineIcon sx={{ fontSize: 17 }} />}
              title="Personal Information"
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {/* First Name */}
              <Box>
                <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                  First Name
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter First Name here"
                  name="first_name"
                  size="small"
                  value={safeFormData.first_name || ""}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  sx={fieldSx}
                />
              </Box>

              {/* Last Name */}
              <Box>
                <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                  Last Name
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter Last Name here"
                  name="last_name"
                  size="small"
                  value={safeFormData.last_name || ""}
                  onChange={handleChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  sx={fieldSx}
                />
              </Box>

              {/* Email */}
              <Box>
                <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter Email here"
                  name="email"
                  size="small"
                  disabled
                  value={safeFormData.email || ""}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={fieldSx}
                />
              </Box>

              {/* Phone */}
              <Box>
                <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                  Phone
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter Phone Number here"
                  name="phone_number"
                  size="small"
                  disabled
                  value={safeFormData.phone_number || ""}
                  onChange={handleChange}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0 }}>
                        <Select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          size="small"
                          disabled
                          sx={{
                            minWidth: 80,
                            "& .MuiSelect-select": {
                              display: "flex",
                              alignItems: "center",
                              py: 0.4,
                              pr: "36px !important",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              border: "none",
                            },
                          }}
                          renderValue={(v) => (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {getFlagIcon(v)}
                              <Typography sx={{ fontSize: "12px" }}>
                                {v}
                              </Typography>
                            </Box>
                          )}
                        >
                          {countryOptions.map((o) => (
                            <MenuItem key={o.code} value={`+${o.phone}`}>
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                {o.flag}
                                {o.label} (+{o.phone})
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <Box
                          sx={{
                            width: "1px",
                            height: "18px",
                            background: "#e0e0e0",
                            mr: 1,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={fieldSx}
                />
              </Box>
            </Box>
          </Box>

          {/* ── Job Preferences ──────────────────────────────────────────── */}
          <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
            <SectionHeader
              icon={<TuneIcon sx={{ fontSize: 17 }} />}
              title="Job Preferences"
              hint="Helps us match relevant roles"
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {/* Domain — NEW, was missing entirely */}
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                  Domain
                </Typography>
                <TextField
                  fullWidth
                  select
                  size="small"
                  value={safeFormData.domain || ""}
                  onChange={(e) => {
                    const domain = e.target.value;
                    const clinical = isClinicalDomain(domain);
                    // Leaving Clinical clears Function / Position type
                    if (!clinical) {
                      setSelectedFunction(null);
                      setSelectedSubFunction(null);
                      setSubFunctionOptions([]);
                    }
                    setFormData({
                      ...safeFormData,
                      domain,
                      ...(clinical ? {} : { area_of_interest: "", position_role: "" }),
                    });
                    setErrors((p) => ({
                      ...p,
                      domain: null,
                      ...(clinical ? {} : { area_of_interest: null, position_role: null }),
                    }));
                  }}
                  SelectProps={selectPlaceholder("Select Domain", domainOptions)}
                  error={!!errors.domain}
                  helperText={
                    errors.domain ||
                    (isClinicalDomain(safeFormData.domain)
                      )
                  }
                  FormHelperTextProps={{
                    sx: { color: errors.domain ? undefined : "#6B7280", ml: 0 },
                  }}
                  sx={fieldSx}
                >
                  {/* TODO: confirm the real option list/values with backend */}
                  {domainOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Function & Position type — only for the Clinical domain */}
              {isClinicalDomain(safeFormData.domain) && (
                <>
                {/* Function -> submitted as area_of_interest */}
                <Box>
                  <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                    Function
                  </Typography>
                  <Autocomplete
                    options={functionOptions}
                    value={selectedFunction}
                    onChange={(_, v) => {
                      setSelectedFunction(v);
                      setSelectedSubFunction(null);
                      setFormData({
                        ...safeFormData,
                        area_of_interest: v?.function_key || "",
                        position_role: "",
                      });
                      setErrors((p) => ({ ...p, area_of_interest: null }));
                    }}
                    getOptionLabel={(o) => o?.function_label || ""}
                    isOptionEqualToValue={(o, v) =>
                      o.function_key === v?.function_key
                    }
                    loading={functionLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Enter Function here"
                        size="small"
                        error={!!errors.area_of_interest}
                        helperText={errors.area_of_interest}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Box>

                {/* Position Type -> submitted as position_role */}
                <Box>
                  <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                    Position type
                  </Typography>
                  <Autocomplete
                    options={subFunctionOptions}
                    value={selectedSubFunction}
                    onChange={(_, v) => {
                      setSelectedSubFunction(v);
                      setFormData({
                        ...safeFormData,
                        position_role: v?.sub_function_key || "",
                      });
                      setErrors((p) => ({ ...p, position_role: null }));
                    }}
                    getOptionLabel={(o) => o?.sub_function_label || ""}
                    isOptionEqualToValue={(o, v) =>
                      o.sub_function_key === v?.sub_function_key
                    }
                    loading={subFunctionLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Enter Sub-Function here"
                        size="small"
                        error={!!errors.position_role}
                        helperText={errors.position_role}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Box>

                </>
              )}

              {/* Availability — full width, own row */}
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={{ fontSize: "12px", color: "#555", mb: 0.5 }}>
                  Availability
                </Typography>
                <TextField
                  fullWidth
                  select
                  size="small"
                  value={safeFormData.availability || ""}
                  onChange={(e) => {
                    setFormData({
                      ...safeFormData,
                      availability: e.target.value,
                    });
                    setErrors((p) => ({ ...p, availability: null }));
                  }}
                  SelectProps={selectPlaceholder("Select Availability", availabilityOptions)}
                  error={!!errors.availability}
                  helperText={errors.availability || "Select how soon you can join"}
                  FormHelperTextProps={{
                    sx: { color: errors.availability ? undefined : "#6B7280", ml: 0 },
                  }}
                  sx={fieldSx}
                >
                  {availabilityOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>

          {/* ── Resume section ───────────────────────────────────────────── */}
          <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>
            <SectionHeader
              icon={<DescriptionIcon sx={{ fontSize: 17 }} />}
              title="Resume"
            />

            {resumeFile ? (
              <Box
                sx={{
                  border: "1.5px solid #D0D5DD",
                  borderRadius: { xs: "10px", sm: "12px", md: "14px" },
                  background: "#FAFCFC",
                  py: { xs: 1.5, sm: 1.75 },
                  px: { xs: 2, sm: 2.5 },
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "8px",
                    background: "#EAF4F4",
                    color: "#2B7B7E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <DescriptionIcon fontSize="small" />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1F242F",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {resumeName}
                  </Typography>
                  <Typography sx={{ fontSize: "11px", color: "#9C9C9C" }}>
                    {resumeSize ? `${resumeSize} · ` : ""}Uploaded on{" "}
                    {new Date().toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    sx={{
                      color: "#2B7B7E",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      p: 0.8,
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setFormData({ ...safeFormData, resume: null })
                    }
                    sx={{
                      color: "#e53935",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      p: 0.8,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box
                onClick={() => document.getElementById("resume-upload").click()}
                sx={{
                  border: "2px dashed #D0D5DD",
                  borderRadius: { xs: "10px", sm: "12px", md: "14px" },
                  background: "#FAFCFC",
                  py: { xs: 2, sm: 2.25, md: 2.5 },
                  px: { xs: 2, sm: 2.5, md: 3 },
                  textAlign: "center",
                  cursor: "pointer",
                  transition: ".25s",
                  "&:hover": {
                    borderColor: "#2B7B7E",
                    background: "#F4FBFB",
                  },
                }}
              >
                <CloudUploadIcon
                  sx={{
                    fontSize: { xs: 30, sm: 34, md: 36 },
                    color: "#2B7B7E",
                    mb: 0.5,
                  }}
                />

                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: 14, sm: 15, md: 16 },
                    color: "#1F2937",
                  }}
                >
                  Upload Your Resume in PDF
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: "#6B7280",
                    fontSize: { xs: 12, sm: 12.5, md: 13 },
                  }}
                >
                  Drag & Drop your resume here
                </Typography>

                <Typography
                  sx={{
                    color: "#9CA3AF",
                    my: 0.5,
                    fontSize: { xs: 11, sm: 12, md: 12 },
                  }}
                >
                  or
                </Typography>

                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    background: "#2B7B7E",
                    borderRadius: "24px",
                    px: 3,
                    py: 0.6,
                    fontSize: { xs: 12, sm: 13 },
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      background: "#245F61",
                    },
                  }}
                >
                  Browse Files
                </Button>

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: { xs: 11, sm: 11.5, md: 12 },
                    color: "#98A2B3",
                  }}
                >
                 Upload Only PDF Max file size 5MB.
                </Typography>
              </Box>
            )}

            <input
              id="resume-upload"
              hidden
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />

            {errors.resume && (
              <Typography sx={{ fontSize: "11px", color: "#d32f2f", mt: 1 }}>
                {errors.resume}
              </Typography>
            )}
          </Box>

          {/* ── Save button ──────────────────────────────────────────────── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 3,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography sx={{ fontSize: 12.5, color: "#9CA3AF" }}>
              Your progress is saved automatically
            </Typography>

            <Button
              type="submit"
              variant="contained"
              size="small"
              disableElevation
              disabled={isSubmitting}
              sx={{
                background: "#2B7B7E",
                color: "#fff",
                fontWeight: 700,
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "15px",
                px: 5,
                py: 1.1,
                "&:hover": { background: "#235a5c" },
              }}
            >
              Save & Continue
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CandidateProfile;