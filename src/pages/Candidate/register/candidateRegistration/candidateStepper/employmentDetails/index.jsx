import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Autocomplete,
  Grid,
  InputAdornment,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
} from "@mui/material";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import ExtensionRoundedIcon from "@mui/icons-material/ExtensionRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  CANDIDATE_ACCESS_TOKEN,
  ACCESS_TOKEN,
  getItem,
} from "../../../../../../utils/helper.js";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";
import candidateApi from "../../../../../../services/candidateApi.js";
import StepPageLayout from "../../../../../../components/StepPageLayout/index.jsx";
import { candidateUpdateFormData } from "../../../../../../store/slices/candidateSlice";
import { candidateGetUserDetails } from "../../../../../../utils/candidateReigister.js";
import { candidateSetInitialData } from "../../../../../../store/slices/candidateSlice";
/* ── Design tokens — shared visual system across Employment / Education / Personal ── */
const INK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const PRIMARY = "#2B6F71";
const PRIMARY_DARK = "#1E4F50";
const PRIMARY_TINT = "#EAF5F4";
const SURFACE = "#F8FAF9"; // section panel background
const BORDER = "#E1E5E7"; // softer than the old #E3E7EE

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    background: "#fff",
    fontSize: "14px",
    "& fieldset": { borderColor: BORDER },
    "&:hover fieldset": { borderColor: PRIMARY },
    "&.Mui-focused fieldset": { borderColor: PRIMARY, borderWidth: "1.5px" },
  },
  "& .MuiOutlinedInput-root.Mui-focused": {
    boxShadow: `0 0 0 3px ${PRIMARY_TINT}`,
  },
  "& .MuiInputLabel-root": { fontSize: "13.5px", color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY },
  "& .MuiFormHelperText-root": { fontSize: "11px", mt: "3px" },
};

/* ── Dropdown popup styling — shared across every Autocomplete instance ─── */
const autocompletePaperSx = {
  mt: 0.75,
  borderRadius: "12px",
  border: `1px solid ${BORDER}`,
  boxShadow: "0 16px 32px rgba(31, 41, 55, 0.14)",
  overflow: "hidden",
  "& .MuiAutocomplete-listbox": {
    p: 0.75,
    maxHeight: "260px",
    "& .MuiAutocomplete-option": {
      borderRadius: "8px",
      fontSize: "13.5px",
      color: INK,
      px: 1.5,
      py: 1,
      mb: 0.25,
      '&[aria-selected="true"]': {
        backgroundColor: PRIMARY_TINT,
        color: PRIMARY_DARK,
        fontWeight: 600,
      },
      "&.Mui-focused": {
        backgroundColor: PRIMARY_TINT,
      },
    },
  },
  "& .MuiAutocomplete-noOptions": {
    fontSize: "13.5px",
    color: TEXT_MUTED,
  },
};
const popupSlotProps = { paper: { sx: autocompletePaperSx } };

const countrySuggestions = [
  "India",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "Russia",
  "Mexico",
  "South Africa",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Finland",
  "Denmark",
  "New Zealand",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "South Korea",
];

const citySuggestions = [
  "Visakhapatnam",
  "New Delhi",
  "Bengaluru",
  "Mumbai",
  "Pune",
  "Chennai",
  "Hyderabad",
  "Gurugram",
  "Noida",
  "Ahmedabad",
  "Kolkata",
];

const availableSkills = [
  "SDTM",
  "ADaM",
  "SUBMISSIONS",
  "TLF",
  "SAS",
  "R",
  "Phase1",
  "Phase II - IV",
  "SDTM Specifications",
  "aCRF",
  "ADaM Specifications",
  "Define.xml",
  "DSUR",
  "PSUR",
  "Safety",
  "Efficacy",
];

const noticePeriodOptions = [
  "Immediate joiner",
  "Less than 7 days",
  "Less than 15 days",
  "Less than 1 Month",
  "Less Than 2 Months",
  "Less Than 3 Months",
];

const employmentTypeOptions = ["Full time", "Part time", "Freelance"];
const employmentTypes = ["PART TIME", "FULL TIME", "INTERNSHIP"];
const currencyOptions = ["₹", "$", "€", "£", "¥", "AED", "AUD"];
const salaryBreakdownOptions = [
  "Fixed",
  "Fixed + Variable",
  "Fixed + Variable + Stocks",
  "Fixed + Stocks",
];

const stockTypeOptions = ["ESOPs", "SARs", "RSUs"];

/* ── Amount helpers — store raw digits, show Indian-style commas for ₹ ──── */
const toDigits = (v) => String(v ?? "").replace(/[^\d]/g, "");
const formatAmount = (value, currency) => {
  const digits = toDigits(value);
  if (!digits) return "";
  return Number(digits).toLocaleString(currency === "₹" || !currency ? "en-IN" : "en-US");
};

/* Label shown above a field (Naukri-style compensation block) */
const FieldLabel = ({ children }) => (
  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: INK, mb: 0.75 }}>
    {children}
  </Typography>
);

/* Read-only currency box next to Fixed / Variable / Stock amounts */
const CurrencyBox = ({ currency }) => (
  <Box
    sx={{
      width: 96,
      height: 40,
      flexShrink: 0,
      border: `1px solid ${BORDER}`,
      borderRadius: "10px",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: TEXT_MUTED,
      fontSize: 14,
    }}
  >
    {currency || "₹"}
  </Box>
);
const parseNoticePeriod = (value) => {
  const map = {
    "Immediate joiner": 0,
    "Less than 7 days": 7,
    "Less than 15 days": 15,
    "Less than 1 Month": 30,
    "Less Than 2 Months": 60,
    "Less Than 3 Months": 90,
  };
  return map[value] ?? null;
};
const formatNoticePeriod = (days) => {
  const map = { 0: "Immediate joiner", 7: "Less than 7 days", 15: "Less than 15 days", 30: "Less than 1 Month", 60: "Less Than 2 Months", 90: "Less Than 3 Months" };
  return map[days] ?? "";
};

const parseExperience = (relExpCal) => {
  if (!relExpCal) return { years: 0, months: 0 };
  const match = relExpCal.match(/(\d+)\s*years?\s*(\d+)?\s*months?/i);
  return {
    years: match?.[1] ? parseInt(match[1], 10) : 0,
    months: match?.[2] ? parseInt(match[2], 10) : 0,
  };
};
// ADD THESE TWO NEW HELPERS HERE:
const normalizeEmploymentType = (value) => {
  if (!value) return "";
  const clean = value.toLowerCase().replace(/[_-]/g, " ").trim();
  const map = {
    "full time": "Full time",
    "part time": "Part time",
    freelance: "Freelance",
  };
  return map[clean] || value;
};

const stripCountryFromLocation = (location, country) => {
  if (!location) return "";
  if (!country) return location;
  const suffix = `, ${country}`;
  return location.endsWith(suffix)
    ? location.slice(0, -suffix.length)
    : location;
};

const parseFlexibleDate = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.toLowerCase() === "present") return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const d = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`);
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const mapSourceToLocal = (source) => {
  if (!source) return {};
  const isCurrent =
    typeof source.is_current === "boolean" ? source.is_current : true;

  const hasExplicitTotal =
    Number(source.total_exp_years) > 0 || Number(source.total_exp_months) > 0;
  const parsedDuration = parseExperience(source.duration);

  return {
    isEmployed: isCurrent ? "yes" : "no",
    is_current: isCurrent,
    employmentType: normalizeEmploymentType(source.employment_type),
    previousEmployementType: normalizeEmploymentType(source.employment_type),
    experienceYears: hasExplicitTotal
      ? (source.total_exp_years ?? 0)
      : parsedDuration.years,
    experienceMonths: hasExplicitTotal
      ? (source.total_exp_months ?? 0)
      : parsedDuration.months,
    companyName: source.company_name || "",
    previousCompany: source.company_name || "",
    jobTitle: source.job_title || "",
    previousJobTitle: source.job_title || "",
    startDate: parseFlexibleDate(source.joining_date),
    endDate: parseFlexibleDate(source.end_date),
    currentSalary: source.current_salary ?? "",
    expectedSalary: source.expected_salary ?? "",
    fixedSalary: source.fixed_salary ?? "",
    variableSalary: source.variable_salary ?? "",
    typeOfStocks: source.type_of_stocks || "",
    valueOfStocks: source.value_of_stocks ?? "",
    salaryBreakdown: source.salary_breakdown || "",
    itSkills: Array.isArray(source.skills_used) ? source.skills_used : [],
    jobProfile: source.job_profile || "",
    previousJobProfile: source.job_profile || "",
    country: source.country || "",
    // Strip a trailing ", <country>" so the City field doesn't duplicate
    // what's already shown in Country (e.g. "Ramakrishnapur, India" -> "Ramakrishnapur")
    location: stripCountryFromLocation(source.location, source.country),
    key_responsibilities: source.key_responsibilities || "",
    noticePeriodDays: formatNoticePeriod(source.notice_period_days),
    is_relevant: source.is_relevant === false ? "no" : "yes",
    relocate:
      typeof source.willing_to_relocate === "boolean"
        ? source.willing_to_relocate
          ? "yes"
          : "no"
        : null,
  };
};

/* ── Section header — icon badge + title, sits above a tinted panel ─────── */
const SectionHeader = ({ icon: Icon, title }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, mb: 1.75 }}>
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: "8px",
        background: PRIMARY_TINT,
        color: PRIMARY_DARK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon sx={{ fontSize: 17 }} />
    </Box>
    <Typography sx={{ fontSize: 15, fontWeight: 700, color: INK }}>
      {title}
    </Typography>
  </Box>
);

/* ── Section panel — replaces the old "divider only" grouping ───────────── */
const SectionPanel = ({ icon, title, children }) => (
  <Box
    sx={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: "14px",
      p: { xs: 2, sm: 2.5 },
      mb: 2.5,
    }}
  >
    <SectionHeader icon={icon} title={title} />
    {children}
  </Box>
);

/* ── Yes/No radio group — pill look, real radio semantics ────────────────── */
/* ── Yes/No radio group — visible radio circle + label ───────────────────── */
const YesNoToggle = ({ label, name, value, onChange, error }) => (
  <Box>
    <Typography sx={{ fontSize: "12.5px", color: TEXT_MUTED, mb: 0.6 }}>
      {label}
    </Typography>
    <RadioGroup
      row
      name={name || label}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      sx={{ display: "flex", gap: 3 }}
    >
      {["yes", "no"].map((opt) => (
        <FormControlLabel
          key={opt}
          value={opt}
          control={
            <Radio
              size="small"
              sx={{
                color: BORDER,
                p: 0.5,
                mr: 0.5,
                "&.Mui-checked": { color: PRIMARY },
              }}
            />
          }
          label={opt === "yes" ? "Yes" : "No"}
          sx={{
            m: 0,
            "& .MuiFormControlLabel-label": {
              fontSize: "13.5px",
              color: value === opt ? PRIMARY_DARK : "#4B5563",
              fontWeight: value === opt ? 700 : 500,
            },
          }}
        />
      ))}
    </RadioGroup>
    {error && (
      <Typography sx={{ fontSize: "11px", color: "#d32f2f", mt: 0.5 }}>
        {error}
      </Typography>
    )}
  </Box>
);

const EmploymentDetailsPage = ({
  handleNext,
  handleBack,
  activeStep,
  handleStepClick,
}) => {
  const dispatch = useDispatch();
  const candidateDetails = useSelector(
    (state) => state?.candidate?.formData?.candidateDetails || {}
  );
  const savedEmploymentDetails = useSelector(
    (state) => state?.candidate?.formData?.employmentDetails
  );
  const employeeDetailsTest = useSelector(
    (state) => state?.candidate?.formData
  )
  console.log("employeeDetailsTest", employeeDetailsTest)
  const hasSavedEmploymentDetails = Object.keys(savedEmploymentDetails || {}).length > 0;

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [fetchedResumeData, setFetchedResumeData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const [localData, setLocalData] = useState({
    empID: null,
    isEmployed: "yes",
    is_current: true,
    employmentType: "",
    experienceYears: 0,
    experienceMonths: 0,
    companyName: "",
    jobTitle: "",
    startDate: null,
    endDate: null,
    currentSalary: "",
    expectedSalary: "",
    fixedSalary: "",
    variableSalary: "",
    typeOfStocks: "",
    valueOfStocks: "",
    salaryBreakdown: "",
    itSkills: [],
    customSkill: "",
    jobProfile: "",
    country: "",
    location: "",
    key_responsibilities: "",
    noticePeriodDays: "",
    is_relevant: "yes",
    relocate: null,
    currency: "₹",
    previousEmployementType: "",
    previousCompany: "",
    previousJobTitle: "",
    previousJoiningDate: null,
    previousEndingDate: null,
    previousJobProfile: "",
  });
  console.log("localData,,", localData)

  //   useEffect(() => {
  //   if (candidateDetails?.resume_data) {
  //     setDetailsLoading(false);
  //     return;
  //   }

  //   const fetchDetails = async () => {
  //     setDetailsLoading(true);

  //     const token = getItem(CANDIDATE_ACCESS_TOKEN);
  //     const details = await candidateGetUserDetails(token, () => {});

  //     if (details) {
  //       setFetchedResumeData(details);
  //       dispatch(candidateSetInitialData(details));
  //     }

  //     setDetailsLoading(false);
  //   };

  //   fetchDetails();
  // }, []);

  useEffect(() => {
    if (hydrated) return;
    console.log("hasSavedEmploymentDetails", hasSavedEmploymentDetails)
    console.log("savedEmploymentDetails", savedEmploymentDetails)
    const source =
      (hasSavedEmploymentDetails && savedEmploymentDetails) ||
      fetchedResumeData?.resume_data?.Relevant_professional_experience ||
      candidateDetails?.resume_data?.Relevant_professional_experience;
    console.log("source", source)
    if (!source) return;
    setLocalData((prev) => ({
      ...prev,
      ...mapSourceToLocal(source),
      empID: source?.id ?? prev.empID,
    }));
    setHydrated(true);
  }, [candidateDetails, hasSavedEmploymentDetails, savedEmploymentDetails, fetchedResumeData, hydrated]);

  const handleInputChange = (key) => (e) => {
    const value = e.target.value;
    setLocalData((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "isEmployed" && { is_current: value === "yes" }),
    }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleToggleChange = (key) => (value) => {
    setLocalData((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "isEmployed" && { is_current: value === "yes" }),
    }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleAutoCompleteChange = (key) => (_e, value) => {
    setLocalData((prev) => ({ ...prev, [key]: value || "" }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };
  const handleSalaryBreakdownChange = (_e, value) => {
    const selected = value || "";

    setLocalData((prev) => ({
      ...prev,
      salaryBreakdown: selected,

      // "Fixed" means the whole current salary is fixed — no separate split
      fixedSalary: selected === "Fixed" || !selected ? "" : prev.fixedSalary,

      // Remove variable salary when Variable isn't selected
      variableSalary:
        selected === "Fixed + Variable" ||
          selected === "Fixed + Variable + Stocks"
          ? prev.variableSalary
          : "",

      // Remove stock data when Stocks isn't selected
      typeOfStocks:
        selected === "Fixed + Stocks" ||
          selected === "Fixed + Variable + Stocks"
          ? prev.typeOfStocks
          : "",

      valueOfStocks:
        selected === "Fixed + Stocks" ||
          selected === "Fixed + Variable + Stocks"
          ? prev.valueOfStocks
          : "",
    }));

    setErrors((prev) => ({
      ...prev,
      salaryBreakdown: "",
      variableSalary: "",
      typeOfStocks: "",
      valueOfStocks: "",
    }));
  };
  const handleDateChange = (key) => (date) => {
    setLocalData((prev) => ({ ...prev, [key]: date }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSkillsChange = (_e, value) => {
    setLocalData((prev) => ({ ...prev, itSkills: value || [] }));
    setErrors((prev) => ({ ...prev, itSkills: "" }));
  };

  const handleCustomSkillAdd = (e) => {
    if (e.key === "Enter" && localData.customSkill.trim()) {
      e.preventDefault();
      setLocalData((prev) => ({
        ...prev,
        itSkills: [...(prev.itSkills || []), prev.customSkill.trim()],
        customSkill: "",
      }));
    }
  };

  // Only the top "Role & Company" section is mandatory (fields marked *)
  const validateForm = () => {
    const tempErrors = {};
    const isBlank = (v) => !String(v ?? "").trim();

    if (localData.is_current) {
      if (isBlank(localData.employmentType))
        tempErrors.employmentType = "Employment type is required";
      if (isBlank(localData.companyName))
        tempErrors.companyName = "Current company name is required";
      if (isBlank(localData.jobTitle))
        tempErrors.jobTitle = "Job title is required";
    } else {
      if (isBlank(localData.previousEmployementType))
        tempErrors.previousEmployementType = "Employment type is required";
      if (isBlank(localData.previousCompany))
        tempErrors.previousCompany = "Previous company name is required";
      if (isBlank(localData.previousJobTitle))
        tempErrors.previousJobTitle = "Job title is required";
      if (!localData.endDate) tempErrors.endDate = "End date is required";
    }
    if (!localData.startDate) tempErrors.startDate = "Start date is required";

    setErrors(tempErrors);
    if (Object.keys(tempErrors).length > 0) {
      toast.error("Please fill all the required fields marked with *");
    }
    return Object.keys(tempErrors).length === 0;
  };

  const computeDuration = (start, end) => {
    if (!start) return "";
    const endDate =
      end && !isNaN(new Date(end).getTime()) ? new Date(end) : new Date();
    const startDate = new Date(start);
    let months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    if (months < 0) months = 0;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years === 0) return `${rem} months`;
    if (rem === 0) return `${years} years`;
    return `${years} years ${rem} months`;
  };

  // Payload keys ordered to match the API schema exactly
  const buildPayload = () => {
    const endDate = localData.isEmployed === "yes" ? null : localData.endDate;
    return {
      is_current: localData.isEmployed === "yes",
      employment_type: localData.is_current
        ? localData.employmentType
        : localData.previousEmployementType,
      total_exp_years: Number(localData.experienceYears) || 0,
      total_exp_months: Number(localData.experienceMonths) || 0,
      company_name: localData.is_current ? localData.companyName : localData.previousCompany,
      job_title: localData.is_current ? localData.jobTitle : localData.previousJobTitle,
      joining_date: localData.startDate
        ? format(localData.startDate, "dd/MM/yyyy")
        : null,
      end_date:
        localData.isEmployed === "yes"
          ? "present"
          : endDate && !isNaN(new Date(endDate).getTime())
            ? format(new Date(endDate), "dd/MM/yyyy")
            : null,
      current_salary: Number(toDigits(localData.currentSalary)) || 0,
      // No longer asked in the form — previously saved value is kept as-is
      expected_salary: Number(localData.expectedSalary) || 0,
      // "Fixed" breakdown → the whole current salary is the fixed component
      fixed_salary:
        localData.salaryBreakdown === "Fixed"
          ? Number(toDigits(localData.currentSalary)) || 0
          : Number(toDigits(localData.fixedSalary)) || 0,
      variable_salary: Number(toDigits(localData.variableSalary)) || 0,
      type_of_stocks: String(localData.typeOfStocks || ""),
      value_of_stocks: Number(toDigits(localData.valueOfStocks)) || 0,
      salary_breakdown: String(localData.salaryBreakdown || ""),
      skills_used: localData.itSkills,
      job_profile: localData.is_current ? localData.jobProfile : localData.previousJobProfile,
      country: localData.country,
      location: localData.location,
      key_responsibilities: localData.key_responsibilities || "",
      notice_period_days: parseNoticePeriod(localData.noticePeriodDays),
      duration: computeDuration(localData.startDate, endDate),
      is_relevant: localData.is_relevant === "yes",
      // No longer asked in the form — previously saved value is kept as-is
      willing_to_relocate: localData.relocate === "yes",
    };
  };

  const handleSaveAndNext = () => {
    if (!validateForm()) return;
    const payload = buildPayload();

    const save = async () => {
      setLoading(true);
      try {
        const candidateToken =
          getItem(CANDIDATE_ACCESS_TOKEN) || getItem(ACCESS_TOKEN);
        const headers = {
          "Content-Type": "application/json",
          ...(candidateToken && { Authorization: `Bearer ${candidateToken}` }),
        };
        const experienceId =
          localData.empID ||
          fetchedResumeData?.resume_data?.Relevant_professional_experience?.id ||
          candidateDetails?.resume_data?.Relevant_professional_experience?.id;
        const res = await candidateApi.put(
          `/candidates/update-employment/${experienceId}`,
          payload,
          { headers },
        )
        // const res = experienceId
        //   ? await candidateApi.put(
        //     `/candidates/update-employment/${experienceId}`,
        //     payload,
        //     { headers },
        //   )
        //   : await candidateApi.post(
        //     "/candidates/add-employment",
        //     payload,
        //     { headers },
        //   );

        if (res.data.success || res.data.status) {
          const newId = res.data?.data?.id || res.data?.id;
          const resolvedId = experienceId || newId || null;

          if (!experienceId && newId) {
            setLocalData((prev) => ({ ...prev, empID: newId }));
          }

          // dispatch(
          //   candidateUpdateFormData({
          //     section: "employmentDetails",
          //     updates: { ...payload, id: resolvedId },
          //   }),
          // );
          handleNext();
        } else {
          toast.error(res.data.message || "An error occurred");
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || error.message || "An error occurred",
        );
      } finally {
        setLoading(false);
      }
    };
    save();
  };
  const hasVariableSalary =
    localData.salaryBreakdown === "Fixed + Variable" ||
    localData.salaryBreakdown === "Fixed + Variable + Stocks";

  const hasStocks =
    localData.salaryBreakdown === "Fixed + Stocks" ||
    localData.salaryBreakdown === "Fixed + Variable + Stocks";

  // Fixed salary is asked separately for every breakdown except plain "Fixed"
  const hasFixedSplit =
    !!localData.salaryBreakdown && localData.salaryBreakdown !== "Fixed";

  /* Currency + amount row. The main salary row has a currency dropdown;
     the others show the same currency in a read-only box. */
  const renderAmountRow = ({ field, placeholder, selectableCurrency = false }) => (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      {selectableCurrency ? (
        <Autocomplete
          options={currencyOptions}
          value={localData.currency || "₹"}
          onChange={(_e, v) => setLocalData((prev) => ({ ...prev, currency: v || "₹" }))}
          disableClearable
          size="small"
          slotProps={popupSlotProps}
          sx={{ width: 96, flexShrink: 0 }}
          renderInput={(params) => <TextField {...params} sx={fieldSx} />}
        />
      ) : (
        <CurrencyBox currency={localData.currency} />
      )}
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={formatAmount(localData[field], localData.currency)}
        onChange={(e) => {
          const digits = toDigits(e.target.value);
          setLocalData((prev) => ({ ...prev, [field]: digits }));
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }}
        inputProps={{ inputMode: "numeric" }}
        error={!!errors[field]}
        helperText={errors[field]}
        sx={fieldSx}
      />
    </Box>
  );

  /* Naukri-style compensation block — used for current and previous role */
  const renderCompensation = (salaryLabel) => (
    <SectionPanel icon={PaidRoundedIcon} title="Compensation & Salary">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <Box>
          <FieldLabel>{salaryLabel}</FieldLabel>
          {renderAmountRow({
            field: "currentSalary",
            placeholder: "Eg. 3,25,000",
            selectableCurrency: true,
          })}
        </Box>

        <Box>
          <FieldLabel>Salary breakdown</FieldLabel>
          <Autocomplete
            options={salaryBreakdownOptions}
            value={localData.salaryBreakdown || null}
            onChange={handleSalaryBreakdownChange}
            size="small"
            slotProps={popupSlotProps}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select salary breakdown"
                helperText={
                  localData.salaryBreakdown === "Fixed"
                    ? "Your total salary has been considered as fixed component"
                    : ""
                }
                FormHelperTextProps={{ sx: { color: "#2e7d32" } }}
                sx={fieldSx}
              />
            )}
          />
        </Box>

        {hasFixedSplit && (
          <Box>
            <FieldLabel>Fixed salary</FieldLabel>
            {renderAmountRow({ field: "fixedSalary", placeholder: "Eg. 26,000" })}
          </Box>
        )}

        {hasVariableSalary && (
          <Box>
            <FieldLabel>Variable salary</FieldLabel>
            {renderAmountRow({ field: "variableSalary", placeholder: "Eg. 45,765" })}
          </Box>
        )}

        {hasStocks && (
          <Box>
            <FieldLabel>Type of stocks</FieldLabel>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {stockTypeOptions.map((stock) => {
                const selected = localData.typeOfStocks === stock;
                return (
                  <Box
                    key={stock}
                    onClick={() => {
                      setLocalData((prev) => ({ ...prev, typeOfStocks: stock }));
                      setErrors((prev) => ({ ...prev, typeOfStocks: "" }));
                    }}
                    sx={{
                      cursor: "pointer",
                      borderRadius: "20px",
                      px: 2,
                      py: 0.75,
                      fontSize: "13.5px",
                      fontWeight: selected ? 700 : 500,
                      color: selected ? PRIMARY_DARK : TEXT_MUTED,
                      border: `1px solid ${selected ? PRIMARY : BORDER}`,
                      background: selected ? PRIMARY_TINT : "#fff",
                      transition: "all .15s ease",
                      "&:hover": { borderColor: PRIMARY },
                    }}
                  >
                    {stock}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {hasStocks && (
          <Box>
            <FieldLabel>Value of stock benefits</FieldLabel>
            {renderAmountRow({
              field: "valueOfStocks",
              placeholder: "Share total stock value you receive as part of your package",
            })}
          </Box>
        )}
      </Box>
    </SectionPanel>
  );

  // if (detailsLoading) {
  //   return (
  //     <StepPageLayout activeStep={activeStep} handleStepClick={handleStepClick}>
  //       <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
  //         <CircularProgress sx={{ color: PRIMARY }} />
  //       </Box>
  //     </StepPageLayout>
  //   );
  // }

  return (
    <StepPageLayout activeStep={activeStep} handleStepClick={handleStepClick}>
      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
          Employment Details
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: TEXT_MUTED, mt: 0.4, lineHeight: 1.35 }}>
          Tell us about your current role so we can match you with the right openings.
        </Typography>
        <Typography sx={{ fontSize: 12, color: TEXT_MUTED, mt: 0.75 }}>
          Fields marked with <Box component="span" sx={{ color: "#d32f2f" }}>*</Box> are required.
        </Typography>
      </Box>

      {/* ── Status toggles ─────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <YesNoToggle
          label="Currently employed?"
          name="isEmployed"
          value={localData.isEmployed}
          onChange={handleToggleChange("isEmployed")}
        />
        <Tooltip title="test">
          <YesNoToggle
            label="Is this role relevant to your target job?"
            name="is_relevant"
            value={localData.is_relevant}
            onChange={handleToggleChange("is_relevant")}
          />
        </Tooltip>
      </Box>

      {localData.is_current ? (
        /* ═══════════════════ CURRENTLY EMPLOYED ═══════════════════════ */
        <>
          {/* Role & Company */}
          <SectionPanel icon={WorkOutlineRoundedIcon} title="Role & Company">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={employmentTypeOptions}
                  value={localData.employmentType || ""}
                  onChange={handleAutoCompleteChange("employmentType")}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Employment Type"
                      error={!!errors.employmentType}
                      helperText={errors.employmentType}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 6, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Experience (Years)"
                  value={localData.experienceYears}
                  onChange={handleInputChange("experienceYears")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item size={{ xs: 6, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Experience (Months)"
                  value={localData.experienceMonths}
                  onChange={handleInputChange("experienceMonths")}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Current Company Name"
                  value={localData.companyName || ""}
                  onChange={handleInputChange("companyName")}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Job Title"
                  value={localData.jobTitle || ""}
                  onChange={handleInputChange("jobTitle")}
                  error={!!errors.jobTitle}
                  helperText={errors.jobTitle}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={localData.startDate || null}
                    onChange={handleDateChange("startDate")}
                    slotProps={{
                      textField: {
                        required: true,
                        size: "small",
                        fullWidth: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate,
                        sx: fieldSx,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={localData.endDate || null}
                    onChange={handleDateChange("endDate")}
                    disabled={localData.isEmployed === "yes"}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        helperText: "Present (current role)",
                        sx: fieldSx,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </SectionPanel>

          {/* Location & Availability */}
          <SectionPanel icon={PlaceRoundedIcon} title=" Current Location & Availability">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  options={countrySuggestions}
                  value={localData.country || ""}
                  onChange={handleAutoCompleteChange("country")}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      error={!!errors.country}
                      helperText={errors.country}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  options={citySuggestions}
                  value={localData.location || ""}
                  onChange={handleAutoCompleteChange("location")}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="City"
                      error={!!errors.location}
                      helperText={errors.location}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={noticePeriodOptions}
                  value={localData.noticePeriodDays || ""}
                  onChange={handleAutoCompleteChange("noticePeriodDays")}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Notice Period"
                      error={!!errors.noticePeriodDays}
                      helperText={errors.noticePeriodDays}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </SectionPanel>

          {/* Compensation */}
          {renderCompensation("Current salary")}

          {/* Skills & Profile */}
          <SectionPanel icon={ExtensionRoundedIcon} title="Skills & Profile">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={availableSkills}
                  value={localData.itSkills || []}
                  onChange={handleSkillsChange}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Skills Used"
                      placeholder="Type to add skills"
                      error={!!errors.itSkills}
                      helperText={errors.itSkills}
                      onKeyDown={handleCustomSkillAdd}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
              {/* <Grid item size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Job Profile"
                  value={localData.jobProfile || ""}
                  onChange={handleInputChange("jobProfile")}
                  sx={fieldSx}
                />
              </Grid> */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  label="Key Responsibilities"
                  value={localData.key_responsibilities || ""}
                  onChange={handleInputChange("key_responsibilities")}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
          </SectionPanel>
        </>
      ) : (
        /* ═══════════════════ NOT CURRENTLY EMPLOYED ═══════════════════ */
        <>
          <SectionPanel icon={WorkOutlineRoundedIcon} title="Recent Role">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={employmentTypes}
                  value={localData.previousEmployementType || ""}
                  onChange={handleAutoCompleteChange("previousEmployementType")}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Employment Type"
                      error={!!errors.previousEmployementType}
                      helperText={errors.previousEmployementType}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Experience (Years)"
                  value={localData.experienceYears}
                  onChange={handleInputChange("experienceYears")}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Experience (Months)"
                  value={localData.experienceMonths}
                  onChange={handleInputChange("experienceMonths")}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Previous Company Name"
                  value={localData.previousCompany || ""}
                  onChange={handleInputChange("previousCompany")}
                  error={!!errors.previousCompany}
                  helperText={errors.previousCompany}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Job Title"
                  value={localData.previousJobTitle || ""}
                  onChange={handleInputChange("previousJobTitle")}
                  error={!!errors.previousJobTitle}
                  helperText={errors.previousJobTitle}
                  sx={fieldSx}
                />
              </Grid>

              <Grid item size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={localData.startDate || null}
                    onChange={handleDateChange("startDate")}
                    slotProps={{
                      textField: {
                        required: true,
                        size: "small",
                        fullWidth: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate,
                        sx: fieldSx,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={localData.endDate || null}
                    onChange={handleDateChange("endDate")}
                    minDate={localData.startDate || undefined}
                    slotProps={{
                      textField: {
                        required: true,
                        size: "small",
                        fullWidth: true,
                        error: !!errors.endDate,
                        helperText: errors.endDate,
                        sx: fieldSx,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </SectionPanel>

          <SectionPanel icon={PlaceRoundedIcon} title="Previous Company Location ">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  options={countrySuggestions}
                  value={localData.country || ""}
                  onChange={handleAutoCompleteChange("country")}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      error={!!errors.country}
                      helperText={errors.country}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  options={citySuggestions}
                  value={localData.location || ""}
                  onChange={handleAutoCompleteChange("location")}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="City"
                      error={!!errors.location}
                      helperText={errors.location}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </SectionPanel>

          {renderCompensation("Last drawn salary")}

          <SectionPanel icon={ExtensionRoundedIcon} title="Skills & Profile">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={availableSkills}
                  value={localData.itSkills || []}
                  onChange={handleSkillsChange}
                  size="small"
                  slotProps={popupSlotProps}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Skills Used"
                      placeholder="Type to add skills"
                      error={!!errors.itSkills}
                      helperText={errors.itSkills}
                      onKeyDown={handleCustomSkillAdd}
                      sx={fieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Key Responsibilities"
                  multiline
                  minRows={3}
                  value={localData.key_responsibilities || ""}
                  onChange={handleInputChange("key_responsibilities")}
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
          </SectionPanel>
        </>
      )}

      {/* ── Action Button ────────────────────────────────────────────────── */}
      <Box display="flex" justifyContent="flex-end" mt={1}>
        <Button
          variant="contained"
          onClick={handleSaveAndNext}
          disabled={loading}
          sx={{
            background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
            color: "#fff",
            minWidth: 140,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            py: 1,
            boxShadow: "none",
            "&:hover": {
              background: `linear-gradient(135deg, ${PRIMARY_DARK} 0%, ${PRIMARY_DARK} 100%)`,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : (
            "Save & continue"
          )}
        </Button>
      </Box>
    </StepPageLayout>
  );
};

EmploymentDetailsPage.propTypes = {
  handleNext: PropTypes.func.isRequired,
  handleBack: PropTypes.func.isRequired,
  activeStep: PropTypes.number.isRequired,
  handleStepClick: PropTypes.func.isRequired,
};

export default EmploymentDetailsPage;