import React, { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Chip,
  InputAdornment,
  IconButton,
  Grid,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ExtensionOutlinedIcon from "@mui/icons-material/ExtensionOutlined";
import { format } from "date-fns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const PRIMARY = "#2B6F71";
const PRIMARY_HOVER = "#1F5557";
const PRIMARY_LIGHT = "#D8ECEC";
// Same visual tokens as the Personal Details dialog
const INK = "#1F2937";
const MUTED = "#6B7280";
const LINE = "#DDE1EA";
const CORAL = "#D9534F";
const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    background: "#fff",
    "& fieldset": { borderColor: "#DDE1EA" },
    "&:hover fieldset": { borderColor: PRIMARY },
    "&.Mui-focused fieldset": { borderColor: PRIMARY },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY },
};

const radioSx = { color: LINE, p: 0.5, mr: 0.5, "&.Mui-checked": { color: PRIMARY } };

/* Group heading — same as the Personal Details dialog */
const GroupHeading = ({ icon: Icon, title }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
    <Icon sx={{ fontSize: 17, color: PRIMARY }} />
    <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 600, fontSize: 14, color: INK }}>
      {title}
    </Typography>
  </Box>
);

/* Divider + heading + content block */
const Section = ({ icon, title, children }) => (
  <Box sx={{ mt: 3 }}>
    <Divider sx={{ mb: 2, borderColor: LINE }} />
    <GroupHeading icon={icon} title={title} />
    {children}
  </Box>
);

/* Compact Yes / No radio with a small muted label */
const YesNo = ({ label, value, onChange }) => (
  <Box>
    <Typography sx={{ fontSize: 12.5, color: MUTED, mb: 0.25 }}>{label}</Typography>
    <RadioGroup
      row
      value={value === true ? "yes" : "no"}
      onChange={(e) => onChange(e.target.value === "yes")}
      sx={{ gap: 2 }}
    >
      {["yes", "no"].map((opt) => {
        const selected = (value === true ? "yes" : "no") === opt;
        return (
          <FormControlLabel
            key={opt}
            value={opt}
            control={<Radio size="small" sx={radioSx} />}
            label={opt === "yes" ? "Yes" : "No"}
            sx={{
              m: 0,
              "& .MuiFormControlLabel-label": {
                fontSize: 13.5,
                color: selected ? PRIMARY_HOVER : "#4B5563",
                fontWeight: selected ? 700 : 500,
              },
            }}
          />
        );
      })}
    </RadioGroup>
  </Box>
);

const autocompletePaperProps = {
  paper: {
    sx: {
      "& .MuiAutocomplete-option.Mui-focused": {
        backgroundColor: `${PRIMARY_LIGHT} !important`,
      },
      "& .MuiAutocomplete-option[aria-selected='true']": {
        backgroundColor: `${PRIMARY_LIGHT} !important`,
        color: PRIMARY_HOVER,
      },
    },
  },
};

const datePickerDaySx = {
  "&.MuiPickersDay-root.Mui-selected": {
    backgroundColor: PRIMARY,
    "&:hover, &:focus": { backgroundColor: PRIMARY_HOVER },
  },
  "&.MuiPickersDay-today": {
    borderColor: PRIMARY,
  },
};

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
      border: `1px solid ${LINE}`,
      borderRadius: "4px",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: MUTED,
      fontSize: 14,
    }}
  >
    {currency || "₹"}
  </Box>
);

const skillChipSx = {
  borderColor: PRIMARY,
  color: PRIMARY_HOVER,
  backgroundColor: "#fff",
  "& .MuiChip-deleteIcon": { color: PRIMARY },
  "& .MuiChip-deleteIcon:hover": { color: PRIMARY_HOVER },
};

// Your app saves dates as "yyyy/MM/dd" (see EmploymentForm.jsx: format(..., "yyyy/MM/dd")).
// Parse in that same order first, then fall back to a generic Date parse for any other shape.
const parseDate = (dateStr) => {
  if (!dateStr) return null;

  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const [first, second, third] = dateStr.split("/");
    if (first && second && third) {
      // yyyy/MM/dd (matches what this app writes on save)
      if (first.length === 4) {
        const parsed = new Date(`${first}-${second}-${third}`);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      // dd/MM/yyyy fallback, in case any legacy records use this shape
      const parsed = new Date(`${third}-${second}-${first}`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  const directParsed = new Date(dateStr);
  return isNaN(directParsed.getTime()) ? null : directParsed;
};

// Converts a rupee amount into an Indian-style words string, e.g.
// 400000 -> "Four Lakh rupees". Only used when currency === "₹".
const numberToWordsIndian = (num) => {
  const n = Math.floor(Number(num));
  if (!num || isNaN(n) || n === 0) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const twoDigits = (num) =>
    num < 20 ? ones[num] : tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");

  const threeDigits = (num) =>
    num < 100
      ? twoDigits(num)
      : ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + twoDigits(num % 100) : "");

  let result = "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  if (crore) result += threeDigits(crore) + " Crore ";
  if (lakh) result += threeDigits(lakh) + " Lakh ";
  if (thousand) result += threeDigits(thousand) + " Thousand ";
  if (rest) result += threeDigits(rest);

  return result.trim() + " rupees";
};

// ── API-shape helpers, mirroring EmploymentDetailsPage's parseNoticePeriod
// pattern ── these convert the descriptive labels this form's dropdowns
// show ("fresher", "2 Years", "15 Days or Less") into the numeric values a
// typical `total_exp_years` / `notice_period_days` field expects. This was
// the most likely source of the 422: those labels were previously sent to
// the API as raw strings.
// NOTE: the exact day-count mapping for notice period is inferred to match
// the style used elsewhere in this app — verify against your backend's
// actual accepted values before relying on it in production.
const parseTotalExpYears = (value) => {
  if (!value || value === "fresher") return 0;
  const match = String(value).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const parseTotalExpMonths = (value) => {
  if (!value) return 0;
  const match = String(value).match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const parseNoticePeriodDaysLabel = (value) => {
  const map = {
    "15 Days or Less": 15,
    "1 Month": 30,
    "2 Months": 60,
    "3 Months": 90,
    "More then 3 Months": 91,
    "Serving Notice Period": 0,
  };
  return map[value] ?? null;
};

const AddEmployment = ({
  open,
  setOpen,
  handleSaveEmployment,
  editingData,
  editingIndex,
  // true when this record is the candidate's most recent employment —
  // compensation is only asked for the current / latest role
  isLatestEmployment = false,
}) => {
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const initialState = {
    id: "",
    is_current: false,
    employment_type: "",
    total_exp_years: "",
    total_exp_months: "",
    overall_exp_years: "",
    overall_exp_months: "",
    company_name: "",
    job_title: "",
    joining_date: null,
    end_date: null,
    duration: "",
    currency: "₹",
    current_salary: "",
    salary_breakdown: "",
    fixed_salary: "",
    variable_salary: "",
    stock_types: [],
    value_of_stocks: "",
    skills_used: [],
    job_profile: "",
    key_responsibilities: "",
    country: "",
    location: "",
    notice_period_days: "",
    is_relevant: true,
    customSkill: "",
    previousEmployementType: "",
    previousCompany: "",
    previousJobTitle: "",
    previousJoiningDate: "",
    previousEndingDate: "",
    previousJobProfile: "",
  };

  const [localData, setLocalData] = useState(initialState);

  // ✅ String-based options (your request)
  const employmentTypes = ["PART TIME", "FULL TIME", "INTERNSHIP"];
  const salaryBreakdownList = [
    "Fixed",
    "Fixed + Variable",
    "Fixed + Variable + Stocks",
    "Fixed + Stocks",
  ];
  const stockTypeOptions = ["ESOPs", "SARs", "RSUs"];
  const currencyOptions = ["₹", "$", "€", "£", "¥", "AED", "AUD"];
  const totalYearsList = [
    "fresher",
    "1 Year",
    "2 Years",
    "3 Years",
    "4 Years",
    "5 Years",
  ];
  const noticePeriodDaysList = [
    "15 Days or Less",
    "1 Month",
    "2 Months",
    "3 Months",
    "More then 3 Months",
    "Serving Notice Period",
  ];
  const totalMonths = ["0 Month", "1 Month", "2 Months", "3 Months"];
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
    "Mapping/conversion ",
    "aCRF",
    "Complex SDTM domains",
    "ADaM Specifications",
    "ADEFF",
    "TP experience",
    "CTT meetings",
    "Randomization checks",
    "SDRG",
    "ADRG",
    "Project level",
    "Pooling SCS",
    "Pooling SCE",
    "Define.xml",
    "DSUR",
    "PSUR",
    "DSMB",
    "DMC",
    "RMP",
    "Safety",
    "Efficacy",
    "Figures",
  ];

  const handleSkillsChange = (_e, value) => {
    setLocalData((prev) => ({
      ...prev,
      skills_used: value || [],
    }));
  };

  const handleCustomSkillAdd = (e) => {
    if (e.key === "Enter" && localData.customSkill.trim() !== "") {
      e.preventDefault();
      setLocalData((prev) => ({
        ...prev,
        skills_used: [...(prev.skills_used || []), prev.customSkill.trim()],
        customSkill: "",
      }));
    }
  };

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setLocalData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleAutoCompleteChange = (field) => (event, value) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleDateChange = (field) => (value) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleSalaryBreakdownChange = (_e, value) => {
    const selected = value || "";
    const withVariable =
      selected === "Fixed + Variable" || selected === "Fixed + Variable + Stocks";
    const withStocks =
      selected === "Fixed + Stocks" || selected === "Fixed + Variable + Stocks";
    setLocalData((prev) => ({
      ...prev,
      salary_breakdown: selected,
      // reset dependent fields whenever the breakdown type changes
      fixed_salary: selected && selected !== "Fixed" ? prev.fixed_salary : "",
      variable_salary: withVariable ? prev.variable_salary : "",
      stock_types: withStocks ? prev.stock_types : [],
      value_of_stocks: withStocks ? prev.value_of_stocks : "",
    }));
  };

  const toggleStockType = (type) => {
    setLocalData((prev) => {
      const exists = prev.stock_types.includes(type);
      return {
        ...prev,
        stock_types: exists
          ? prev.stock_types.filter((t) => t !== type)
          : [...prev.stock_types, type],
      };
    });
  };

  const resetForm = () => {
    setLocalData(initialState);
    setError("");
    setErrors({});
  };

  // Only the top "Role & Company" section is mandatory (fields marked *)
  const validate = () => {
    const t = {};
    const isBlank = (v) => !String(v ?? "").trim();
    if (localData.is_current) {
      if (isBlank(localData.employment_type)) t.employment_type = "Employment type is required";
      if (isBlank(localData.company_name)) t.company_name = "Current company name is required";
      if (isBlank(localData.job_title)) t.job_title = "Job title is required";
      if (!localData.joining_date) t.joining_date = "Start date is required";
    } else {
      if (isBlank(localData.previousEmployementType))
        t.previousEmployementType = "Employment type is required";
      if (isBlank(localData.previousCompany)) t.previousCompany = "Previous company name is required";
      if (isBlank(localData.previousJobTitle)) t.previousJobTitle = "Job title is required";
      if (!localData.previousJoiningDate) t.previousJoiningDate = "Joining date is required";
      if (!localData.previousEndingDate) t.previousEndingDate = "Ending date is required";
    }
    setErrors(t);
    if (Object.keys(t).length) setError("Please fill all the required fields marked with *");
    return Object.keys(t).length === 0;
  };

  // Builds the API-ready payload, matching the field set and types
  // EmploymentDetailsPage.buildPayload() sends: numeric experience,
  // dd/MM/yyyy dates, "present" for a current role's end_date, numeric
  // salary fields, and boolean flags — rather than the raw descriptive
  // labels this form's dropdowns display.
  const buildPayload = () => {
    const isCurrent = !!localData.is_current;

    const employmentType = isCurrent
      ? localData.employment_type
      : localData.previousEmployementType;
    const companyName = isCurrent
      ? localData.company_name
      : localData.previousCompany;
    const jobTitle = isCurrent
      ? localData.job_title
      : localData.previousJobTitle;
    const jobProfile = isCurrent
      ? localData.job_profile
      : localData.previousJobProfile;
    const joiningDateValue = isCurrent
      ? localData.joining_date
      : localData.previousJoiningDate;
    const endDateValue = isCurrent
      ? localData.end_date
      : localData.previousEndingDate;

    return {
      is_current: isCurrent,
      employment_type: employmentType || "",
      total_exp_years: parseTotalExpYears(localData.total_exp_years),
      total_exp_months: parseTotalExpMonths(localData.total_exp_months),
      company_name: companyName || "",
      job_title: jobTitle || "",
      joining_date: joiningDateValue
        ? format(new Date(joiningDateValue), "dd/MM/yyyy")
        : null,
      end_date: isCurrent
        ? "present"
        : endDateValue && !isNaN(new Date(endDateValue).getTime())
          ? format(new Date(endDateValue), "dd/MM/yyyy")
          : null,
      current_salary: Number(toDigits(localData.current_salary)) || 0,
      expected_salary: Number(editingData?.expected_salary) || 0,
      fixed_salary:
        localData.salary_breakdown === "Fixed"
          ? Number(toDigits(localData.current_salary)) || 0
          : Number(toDigits(localData.fixed_salary)) || 0,
      variable_salary: Number(toDigits(localData.variable_salary)) || 0,
      type_of_stocks: (localData.stock_types || []).join(", "),
      value_of_stocks: Number(toDigits(localData.value_of_stocks)) || 0,
      salary_breakdown: localData.salary_breakdown || "",
      skills_used: localData.skills_used || [],
      job_profile: jobProfile || "",
      country: localData.country || "",
      location: localData.location || "",
      key_responsibilities: localData.key_responsibilities || "",
      notice_period_days: parseNoticePeriodDaysLabel(localData.notice_period_days),
      duration: localData.duration || "",
      is_relevant: !!localData.is_relevant,
      willing_to_relocate: false,
    };
  };

  // FIX: `handleSave` used to call `resetForm()` immediately and synchronously,
  // right after firing the (async) save to the parent. That wiped the form
  // to blank before the parent's update/GET-refresh cycle ever completed —
  // on failure it discarded the user's edits, and even on success it caused
  // a visible flash of blank/incorrect data before the dialog closed.
  //
  // The `useEffect` below (keyed on `editingData` + `open`) is what should own
  // resetting/repopulating the form. It fires whenever the parent updates
  // `editingData` or toggles `open`, so there's no need to reset manually here.
  //
  // NOTE: this now passes the built API-ready payload as the first argument
  // (previously it passed the raw form-shaped `localData`). If the parent's
  // handleSaveEmployment expects the old raw shape — e.g. to look up
  // editingIndex or read UI-only fields — it will need updating to match
  // this new (payload, rawFormState) signature. The raw state is still
  // passed as a second argument for that purpose.
  const handleSave = () => {
    setError("");
    if (!validate()) return;
    const payload = buildPayload();
    handleSaveEmployment?.(payload, localData);
    // no resetForm() here — parent flips `open`/`editingData` when the
    // save (and refetch) actually finishes, and the effect below handles it
  };

  useEffect(() => {
    if (editingData) {
      setLocalData({
        id: editingData.id || "",
        // FIX: normalize to a strict boolean. Previously this stored whatever
        // raw truthy value the API returned, but the RadioGroup below checks
        // `=== true`, so anything other than the literal boolean `true` was
        // silently rendered as "No".
        is_current: !!editingData.is_current,
        employment_type: editingData.employment_type || "",
        total_exp_years: editingData.total_exp_years?.toString() || "",
        total_exp_months: editingData.total_exp_months?.toString() || "",
        overall_exp_years: editingData.overall_exp_years?.toString() || "",
        overall_exp_months: editingData.overall_exp_months?.toString() || "",
        company_name: editingData.company_name || "",
        job_title: editingData.job_title || "",
        joining_date: parseDate(editingData.joining_date),
        end_date: parseDate(editingData.end_date),
        duration: editingData.duration || "",
        currency: editingData.currency || "₹",
        current_salary: toDigits(editingData.current_salary),
        salary_breakdown: editingData.salary_breakdown || "",
        fixed_salary: toDigits(editingData.fixed_salary),
        variable_salary: toDigits(editingData.variable_salary),
        // API may return stock_types (array) or type_of_stocks ("ESOPs, RSUs")
        stock_types: Array.isArray(editingData.stock_types)
          ? editingData.stock_types
          : String(editingData.stock_types || editingData.type_of_stocks || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
        value_of_stocks: toDigits(editingData.value_of_stocks),
        skills_used: Array.isArray(editingData.skills_used)
          ? editingData.skills_used
          : typeof editingData.skills_used === "string"
          ? editingData.skills_used.split(",").map((s) => s.trim())
          : [],
        job_profile: editingData.job_profile || "",
        key_responsibilities: editingData.key_responsibilities || "",
        country: editingData.country || "",
        location: editingData.location || "",
        notice_period_days: editingData.notice_period_days?.toString() || "",
        is_relevant: editingData.is_relevant ?? true,
        customSkill: "",
        previousEmployementType: editingData.employment_type || "",
        previousCompany: editingData.company_name || "",
        previousJobTitle: editingData.job_title || "",
        previousJoiningDate: parseDate(editingData.joining_date),
        previousEndingDate: parseDate(editingData.end_date),
        previousJobProfile: editingData.job_profile || "",
      });
    } else {
      setLocalData(initialState);
    }
    setErrors({});
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingData, open]);

  // Rendered in both the current and previous layouts.
  // Called as a function (not <Component />) so the textarea keeps focus while typing.
  const renderKeyResponsibilities = () => (
    <TextField
      label="Key Responsibilities"
      fullWidth
      multiline
      minRows={3}
      size="small"
      placeholder="e.g. Built SDTM/ADaM datasets, reviewed TLFs, led a team of 4"
      value={localData.key_responsibilities}
      onChange={handleFieldChange("key_responsibilities")}
      sx={fieldSx}
    />
  );

  const breakdown = localData.salary_breakdown;
  const hasFixedSplit = !!breakdown && breakdown !== "Fixed";
  const hasVariableSalary =
    breakdown === "Fixed + Variable" || breakdown === "Fixed + Variable + Stocks";
  const hasStocks = breakdown === "Fixed + Stocks" || breakdown === "Fixed + Variable + Stocks";
  // Compensation is shown only while EDITING the current / latest employment —
  // never in "Add Employment"
  const isEditing = editingIndex !== null && editingIndex !== undefined;
  const showCompensation = isEditing && (!!localData.is_current || isLatestEmployment);

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
          componentsProps={autocompletePaperProps}
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
        }}
        inputProps={{ inputMode: "numeric" }}
        sx={fieldSx}
      />
    </Box>
  );

  /* Naukri-style compensation block */
  const renderCompensation = () => (
    <Section icon={PaymentsOutlinedIcon} title="Compensation">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <Box>
          <FieldLabel>{localData.is_current ? "Current salary" : "Last drawn salary"}</FieldLabel>
          {renderAmountRow({
            field: "current_salary",
            placeholder: "Eg. 3,25,000",
            selectableCurrency: true,
          })}
        </Box>

        <Box>
          <FieldLabel>Salary breakdown</FieldLabel>
          <Autocomplete
            options={salaryBreakdownList}
            value={breakdown || null}
            onChange={handleSalaryBreakdownChange}
            size="small"
            componentsProps={autocompletePaperProps}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select salary breakdown"
                helperText={
                  breakdown === "Fixed"
                    ? "Your total salary has been considered as fixed component"
                    : ""
                }
                FormHelperTextProps={{ sx: { color: "#2e7d32", mx: 0 } }}
                sx={fieldSx}
              />
            )}
          />
        </Box>

        {hasFixedSplit && (
          <Box>
            <FieldLabel>Fixed salary</FieldLabel>
            {renderAmountRow({ field: "fixed_salary", placeholder: "Eg. 26,000" })}
          </Box>
        )}

        {hasVariableSalary && (
          <Box>
            <FieldLabel>Variable salary</FieldLabel>
            {renderAmountRow({ field: "variable_salary", placeholder: "Eg. 45,765" })}
          </Box>
        )}

        {hasStocks && (
          <Box>
            <FieldLabel>Type of stocks</FieldLabel>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {stockTypeOptions.map((type) => {
                const selected = localData.stock_types.includes(type);
                return (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => toggleStockType(type)}
                    variant="outlined"
                    sx={{
                      borderRadius: "20px",
                      px: 0.5,
                      height: 34,
                      fontSize: 13.5,
                      borderColor: selected ? PRIMARY : LINE,
                      color: selected ? PRIMARY_HOVER : MUTED,
                      backgroundColor: selected ? PRIMARY_LIGHT : "#fff",
                      fontWeight: selected ? 700 : 500,
                      "&:hover": { borderColor: PRIMARY },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {hasStocks && (
          <Box>
            <FieldLabel>Value of stock benefits</FieldLabel>
            {renderAmountRow({
              field: "value_of_stocks",
              placeholder: "Share total stock value you receive as part of your package",
            })}
          </Box>
        )}
      </Box>
    </Section>
  );

  /* Small helpers so every field shares the Personal Details look */
  const dateSlotProps = {
    textField: { size: "small", fullWidth: true, sx: fieldSx },
    popper: { sx: { zIndex: 1300 } },
    day: { sx: datePickerDaySx },
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
        resetForm();
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px" } }}
    >
      <DialogTitle sx={{ fontFamily: DISPLAY_FONT, fontWeight: 600, color: INK }}>
        {editingIndex !== null ? "Edit Employment" : "Add Employment"}
        <IconButton
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8, color: PRIMARY }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Typography sx={{ color: CORAL, mb: 2 }} variant="body2">
            {error}
          </Typography>
        )}

        <Typography sx={{ fontSize: 12, color: MUTED, mb: 1.5 }}>
          Fields marked with <Box component="span" sx={{ color: "#d32f2f" }}>*</Box> are required.
        </Typography>

        {/* ── Status ─────────────────────────────────────────────────── */}
        <GroupHeading icon={TuneOutlinedIcon} title="Status" />
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <YesNo
              label="Is this your current employment?"
              value={localData.is_current}
              onChange={(v) => setLocalData((prev) => ({ ...prev, is_current: v }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <YesNo
              label="Is this relevant experience?"
              value={localData.is_relevant}
              onChange={(v) => setLocalData((prev) => ({ ...prev, is_relevant: v }))}
            />
          </Grid>
        </Grid>

        {localData?.is_current ? (
          <>
            {/* ── Role & Company ─────────────────────────────────────── */}
            <Section icon={WorkOutlineOutlinedIcon} title="Role & Company">
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Autocomplete
                    options={employmentTypes}
                    value={localData.employment_type || null}
                    onChange={handleAutoCompleteChange("employment_type")}
                    size="small"
                    componentsProps={autocompletePaperProps}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Employment Type"
                        error={!!errors.employment_type}
                        helperText={errors.employment_type}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Autocomplete
                    options={totalYearsList}
                    value={localData.total_exp_years || null}
                    onChange={handleAutoCompleteChange("total_exp_years")}
                    size="small"
                    componentsProps={autocompletePaperProps}
                    renderInput={(params) => (
                      <TextField {...params} label="Experience (Years)" sx={fieldSx} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Autocomplete
                    options={totalMonths}
                    value={localData.total_exp_months || null}
                    onChange={handleAutoCompleteChange("total_exp_months")}
                    size="small"
                    componentsProps={autocompletePaperProps}
                    renderInput={(params) => (
                      <TextField {...params} label="Experience (Months)" sx={fieldSx} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Current Company Name"
                    fullWidth
                    size="small"
                    value={localData.company_name}
                    onChange={handleFieldChange("company_name")}
                    error={!!errors.company_name}
                    helperText={errors.company_name}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Job Title"
                    fullWidth
                    size="small"
                    value={localData.job_title}
                    onChange={handleFieldChange("job_title")}
                    error={!!errors.job_title}
                    helperText={errors.job_title}
                    sx={fieldSx}
                  />
                </Grid>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="Start Date"
                      value={localData.joining_date || null}
                      onChange={(value) => {
                        clearError("joining_date");
                        setLocalData((prev) => ({
                          ...prev,
                          joining_date: value,
                          // clear end date if it's now before the new start date
                          end_date:
                            prev.end_date && value && new Date(prev.end_date) < new Date(value)
                              ? null
                              : prev.end_date,
                        }));
                      }}
                      maxDate={localData.end_date ? new Date(localData.end_date) : undefined}
                      slotProps={{
                        ...dateSlotProps,
                        textField: {
                          ...dateSlotProps.textField,
                          required: true,
                          error: !!errors.joining_date,
                          helperText: errors.joining_date,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="End Date"
                      value={localData.end_date || null}
                      onChange={handleDateChange("end_date")}
                      disabled={localData.is_current}
                      minDate={localData.joining_date ? new Date(localData.joining_date) : undefined}
                      slotProps={{
                        ...dateSlotProps,
                        textField: {
                          ...dateSlotProps.textField,
                          helperText: localData.is_current ? "Present (current role)" : "",
                        },
                      }}
                    />
                  </Grid>
                </LocalizationProvider>
              </Grid>
            </Section>

            {showCompensation && renderCompensation()}

            {/* ── Location & Availability ────────────────────────────── */}
            <Section icon={PlaceOutlinedIcon} title="Location & Availability">
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Country"
                    fullWidth
                    size="small"
                    value={localData.country}
                    onChange={handleFieldChange("country")}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Location"
                    fullWidth
                    size="small"
                    value={localData.location}
                    onChange={handleFieldChange("location")}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={noticePeriodDaysList}
                    value={localData.notice_period_days || null}
                    onChange={handleAutoCompleteChange("notice_period_days")}
                    size="small"
                    componentsProps={autocompletePaperProps}
                    renderInput={(params) => (
                      <TextField {...params} label="Notice Period" sx={fieldSx} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Duration"
                    fullWidth
                    size="small"
                    value={localData.duration}
                    onChange={handleFieldChange("duration")}
                    sx={fieldSx}
                  />
                </Grid>
              </Grid>
            </Section>

            {/* ── Skills & Responsibilities ──────────────────────────── */}
            <Section icon={ExtensionOutlinedIcon} title="Skills & Responsibilities">
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={availableSkills}
                    value={localData.skills_used || []}
                    onChange={handleSkillsChange}
                    getOptionLabel={(option) => option || ""}
                    size="small"
                    componentsProps={autocompletePaperProps}
                    ChipProps={{ variant: "outlined", size: "small", sx: skillChipSx }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tech Skills"
                        placeholder="Type to add or pick from list"
                        onKeyDown={handleCustomSkillAdd}
                        sx={fieldSx}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  {renderKeyResponsibilities()}
                </Grid>
              </Grid>
            </Section>
          </>
        ) : (
          <>
            {/* ── Role & Company (previous) ──────────────────────────── */}
            <Section icon={WorkOutlineOutlinedIcon} title="Role & Company">
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={employmentTypes}
                    value={localData.previousEmployementType || null}
                    onChange={handleAutoCompleteChange("previousEmployementType")}
                    size="small"
                    componentsProps={autocompletePaperProps}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Previous Company Name"
                    fullWidth
                    size="small"
                    value={localData.previousCompany}
                    onChange={handleFieldChange("previousCompany")}
                    error={!!errors.previousCompany}
                    helperText={errors.previousCompany}
                    sx={fieldSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Job Title"
                    fullWidth
                    size="small"
                    value={localData.previousJobTitle}
                    onChange={handleFieldChange("previousJobTitle")}
                    error={!!errors.previousJobTitle}
                    helperText={errors.previousJobTitle}
                    sx={fieldSx}
                  />
                </Grid>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="Joining Date"
                      value={localData.previousJoiningDate || null}
                      onChange={(value) => {
                        clearError("previousJoiningDate");
                        setLocalData((prev) => ({
                          ...prev,
                          previousJoiningDate: value,
                          previousEndingDate:
                            prev.previousEndingDate &&
                            value &&
                            new Date(prev.previousEndingDate) < new Date(value)
                              ? null
                              : prev.previousEndingDate,
                        }));
                      }}
                      maxDate={
                        localData.previousEndingDate
                          ? new Date(localData.previousEndingDate)
                          : undefined
                      }
                      slotProps={{
                        ...dateSlotProps,
                        textField: {
                          ...dateSlotProps.textField,
                          required: true,
                          error: !!errors.previousJoiningDate,
                          helperText: errors.previousJoiningDate,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="Ending Date"
                      value={localData.previousEndingDate || null}
                      onChange={handleDateChange("previousEndingDate")}
                      minDate={
                        localData.previousJoiningDate
                          ? new Date(localData.previousJoiningDate)
                          : undefined
                      }
                      slotProps={{
                        ...dateSlotProps,
                        textField: {
                          ...dateSlotProps.textField,
                          required: true,
                          error: !!errors.previousEndingDate,
                          helperText: errors.previousEndingDate,
                        },
                      }}
                    />
                  </Grid>
                </LocalizationProvider>
              </Grid>
            </Section>

            {/* ── Compensation — only when this is the latest employment ── */}
            {showCompensation && renderCompensation()}

            {/* ── Responsibilities (previous) ────────────────────────── */}
            <Section icon={ExtensionOutlinedIcon} title="Responsibilities">
              {renderKeyResponsibilities()}
            </Section>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => setOpen(false)}
          variant="outlined"
          sx={{ borderColor: LINE, color: INK, textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: PRIMARY,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: PRIMARY_HOVER },
          }}
        >
          {editingIndex !== null ? "Save Changes" : "Add Employment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEmployment;