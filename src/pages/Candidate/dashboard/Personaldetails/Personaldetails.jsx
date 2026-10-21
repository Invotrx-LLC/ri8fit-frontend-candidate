import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Paper,
  Grid,
  Autocomplete,
  Divider,
  Checkbox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MarkunreadMailboxOutlinedIcon from "@mui/icons-material/MarkunreadMailboxOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { parseISO, format, isValid } from "date-fns";
import candidateApi from "../../../../services/candidateApi.js";
import { CANDIDATE_ACCESS_TOKEN, ACCESS_TOKEN, getItem } from "../../../../utils/helper.js";
import {
  useGetCandidateCountriesQuery,
  useLazyGetCandidateLocationsQuery,
  useGetPersonalDetailsQuery,
  useUpdatePersonalDetailsMutation,
  useLazyGetWorkAuthorizationsQuery,
} from "../../../../store/api/settings/CandidatePortalApis";
import { palette, fonts } from "../../../../theme/candidateTokens";

const genders = ["Male", "Female", "Other"];
const maritalOptions = ["Married", "Unmarried"];
const isUSA = (value) =>
  value?.trim().toLowerCase() === "united states";

const dialogFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: palette.line },
    "&:hover fieldset": { borderColor: palette.teal },
    "&.Mui-focused fieldset": { borderColor: palette.teal },
  },
};

/* Selected items in multi-select dropdowns — same teal chips as Add Skills */
const multiChipSx = {
  bgcolor: palette.tealSoft,
  color: palette.teal,
  fontWeight: 600,
  fontSize: 12.5,
  "& .MuiChip-deleteIcon": {
    color: palette.teal,
    "&:hover": { color: palette.tealDeep },
  },
};

/* ══════════════════════ Extra details — config & helpers ══════════════════════ */

/* Every extra-details dropdown loads its options from these APIs */
const DROPDOWN_ENDPOINTS = {
  timezones: "/candidates/timezones",
  workArrangements: "/candidate-work-arrangement-preferences",
  usWorkAuthorizations: "/candidate-us-work-authorization-types",
  employerSponsorship: "/candidate-employer-sponsorship-preferences",
  compensationBasis: "/candidate-compensation-basis-types",
  w2Benefits: "/candidate-w2-benefit-preferences",
  benefitBasedRate: "/candidate-benefit-based-rate-preferences",
  employmentStatus: "/candidate-employment-status-types",
  preferredUsTimeZones: "/candidate-preferred-us-time-zones",
  workShifts: "/candidate-preferred-work-shifts",
  jobSearchStatus: "/candidate-job-search-status-types",
  opportunityFactors: "/candidate-job-opportunity-factors",
  interviewDays: "/candidate-preferred-interview-days",
  interviewPreferenceTypes: "/candidate-interview-preference-types",
  jobCategories: "/candidate-preferred-job-categories",
  seniorityLevels: "/candidate-preferred-seniority-levels",
  companyTypes: "/candidate-preferred-company-types",
  locationPreferences: "/candidate-location-preferences",
  // Requested from backend — until they exist, FALLBACK_OPTIONS below is used
  employmentTypes: "/candidate-preferred-employment-types",
  engagementTypes: "/candidate-preferred-engagement-types",
  contactMethods: "/candidate-preferred-contact-methods",
  referralSources: "/candidate-referral-sources",
};

/* Used ONLY when a dropdown API is missing (404) or returns nothing.
   Values are exactly what the save API accepts. As soon as the backend adds the
   endpoint above, its data replaces these automatically — no frontend change. */
const toOptions = (list) => list.map((v) => (typeof v === "string" ? { key: v, label: v } : v));
const FALLBACK_OPTIONS = {
  employmentTypes: toOptions(["Full-Time / Permanent", "Contract", "Contract-to-Hire", "Part-Time", "Temporary", "Freelance", "Open to All"]),
  engagementTypes: toOptions(["W-2 Direct", "W-2 Through Staffing Agency", "C2C / Corp-to-Corp", "1099 / Independent Contractor", "Direct Hire", "Open to All"]),
  contactMethods: toOptions(["Email", "Phone Call", "Text / SMS", { key: "whatsapp", label: "WhatsApp" }]),
  referralSources: toOptions(["LinkedIn", "Job Board", "Employee Referral", "Company Website", "Social Media", "Other"]),
};

/* Field list drives both the read-only view and the edit dialog.
   type: multi | single | date | text   ·   usOnly: show/send only for US */
const EXTRA_GROUPS = [
  {
    title: "Work Preferences",
    icon: TuneOutlinedIcon,
    usOnly: true,
    fields: [
      { key: "preferredEmploymentTypes", api: "preferred_employment_types", label: "Employment Types", type: "multi", options: "employmentTypes" },
      { key: "preferredEngagementTypes", api: "preferred_engagement_types", label: "Payroll Types", type: "multi", options: "engagementTypes" },
      { key: "preferredWorkArrangements", api: "preferred_work_arrangements", label: "Work Arrangements", type: "multi", options: "workArrangements" },
      { key: "preferredContactMethods", api: "preferred_contact_methods", label: "Contact Methods", type: "multi", options: "contactMethods" },
    ],
  },
  {
    title: "US Work Authorization",
    icon: VerifiedUserOutlinedIcon,
    usOnly: true,
    fields: [
      { key: "currentUsWorkAuthorizations", api: "current_us_work_authorizations", label: "US Work Authorizations", type: "multi", options: "usWorkAuthorizations" },
      { key: "authorizationExpirationDate", api: "authorization_expiration_date", label: "Authorization Expiry", type: "date" },
      { key: "employerSponsorship", api: "employer_sponsorship", label: "Employer Sponsorship", type: "single", options: "employerSponsorship" },
    ],
  },
  {
    title: "Compensation & Benefits Preference",
    icon: PaymentsOutlinedIcon,
    usOnly: true,
    fields: [
      { key: "compensationBasis", api: "compensation_basis", label: "Compensation Basis", type: "single", options: "compensationBasis" },
      { key: "rateDependentOnBenefits", api: "rate_dependent_on_benefits", label: "Rate Depends on Benefits", type: "single", options: "benefitBasedRate" },
      { key: "importantW2Benefits", api: "important_w2_benefits", label: "Important W2 Benefits", type: "multi", options: "w2Benefits" },
    ],
  },
  {
    title: "Job Preferences",
    icon: WorkOutlineOutlinedIcon,
    fields: [
      { key: "preferredJobCategories", api: "preferred_job_categories", label: "Job Categories", type: "multi", options: "jobCategories" },
      { key: "preferredSeniorityLevels", api: "preferred_seniority_levels", label: "Seniority Levels", type: "multi", options: "seniorityLevels" },
      { key: "preferredCompanyTypes", api: "preferred_company_types", label: "Company Types", type: "multi", options: "companyTypes" },
      { key: "mostImportantOpportunityFactors", api: "most_important_opportunity_factors", label: "Opportunity Factors", type: "multi", options: "opportunityFactors" },
      { key: "locationPreference", api: "location_preference", label: "Location Preference", type: "single", options: "locationPreferences" },
    ],
  },
  {
    title: "Availability & Interviews",
    icon: EventAvailableOutlinedIcon,
    fields: [
      { key: "currentJobSearchStatus", api: "current_job_search_status", label: "Job Search Status", type: "single", options: "jobSearchStatus" },
      { key: "currentEmploymentStatus", api: "current_employment_status", label: "Employment Status", type: "single", options: "employmentStatus" },
      { key: "currentTimeZone", api: "current_time_zone", label: "Current Time Zone", type: "single", options: "timezones" },
      { key: "preferredUsTimeZone", api: "preferred_us_time_zone", label: "Preferred US Time Zone", type: "single", options: "preferredUsTimeZones", usOnly: true },
      { key: "preferredShift", api: "preferred_shift", label: "Preferred Shift", type: "single", options: "workShifts" },
      { key: "preferredInterviewDays", api: "preferred_interview_days", label: "Interview Days", type: "multi", options: "interviewDays" },
      { key: "preferredInterviewTime", api: "preferred_interview_time", label: "Interview Time", type: "single", options: "interviewPreferenceTypes" },
      { key: "interviewTimeZone", api: "interview_time_zone", label: "Interview Time Zone", type: "single", options: "timezones" },
    ],
  },
  {
    title: "Referral & Profile",
    icon: LinkOutlinedIcon,
    fields: [
      { key: "referralSource", api: "referral_source", label: "Heard About Us", type: "single", options: "referralSources" },
      { key: "referralSourceDetails", api: "referral_source_details", label: "Referral Details", type: "text" },
      { key: "linkedinUrl", api: "linkedin_url", label: "LinkedIn URL", type: "text" },
    ],
  },
];

const US_COUNTRY_NAMES = ["united states", "us", "usa", "united states of america"];
const isUSCountry = (c) => {
  const name = (typeof c === "string" ? c : c?.name || c?.label || c?.value || "")
    .trim()
    .toLowerCase();
  return name.startsWith("united states") || US_COUNTRY_NAMES.includes(name);
};

/* Reads a label out of a string or an object option ({ value } / { label } / { name } …) */
const optionLabel = (item) =>
  typeof item === "string"
    ? item
    : item?.value ?? item?.label ?? item?.name ?? item?.title ?? item?.display_name ?? "";

/* Turns any API item into { key, label }:
   key   = what the save API accepts  (e.g. "Yes — Currently")
   label = what the user sees          (e.g. "Currently need sponsorship") */
const toOption = (item) => {
  if (typeof item === "string") return { key: item, label: item };
  const key = item?.key ?? item?.value ?? item?.code ?? item?.label ?? item?.name ?? "";
  // "lable" is how /candidates/timezones spells it
  const label = item?.label ?? item?.lable ?? item?.time_zone ?? item?.name ?? item?.display_name ?? item?.value ?? key;
  return { key: String(key), label: String(label) };
};

/* Finds the options array whether the API returns [..], { data: [..] }, { data: { items: [..] } } … */
const extractOptions = (res) => {
  const list =
    [res, res?.data, res?.data?.data, res?.data?.items, res?.data?.data?.items, res?.items].find(Array.isArray) || [];
  const seen = new Set();
  return list.map(toOption).filter((o) => o.key && !seen.has(o.key) && seen.add(o.key));
};

/* Converts a stored value to the key the save API accepts.
   Fixes values saved earlier as labels and drops anything that isn't a valid option.
   If the options haven't loaded, the value is left untouched. */
const toKey = (options, v) => {
  if (!options?.length || !v) return v;
  const match = options.find((o) => o.key === v) || options.find((o) => o.label === v);
  return match ? match.key : null;
};

/* Label for a saved key — falls back to the key itself until options are loaded */
const labelFor = (options = [], k) => options.find((o) => o.key === k)?.label ?? k ?? "";

/* Loads every dropdown in parallel the first time it's enabled (when the dialog opens) */
const useDropdownOptions = (enabled) => {
  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;
    let active = true;
    setLoading(true);
    const token = getItem(CANDIDATE_ACCESS_TOKEN) || getItem(ACCESS_TOKEN);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const entries = Object.entries(DROPDOWN_ENDPOINTS);

    Promise.allSettled(entries.map(([, url]) => candidateApi.get(url, { headers }))).then((results) => {
      if (!active) return;
      const next = { ...FALLBACK_OPTIONS };
      results.forEach((result, i) => {
        const [key, url] = entries[i];
        const list = result.status === "fulfilled" ? extractOptions(result.value) : [];
        if (list.length) {
          next[key] = list; // API data always wins
        } else if (FALLBACK_OPTIONS[key]) {
          next[key] = FALLBACK_OPTIONS[key];
          console.warn(`Dropdown API not available yet, using fallback: ${url}`);
        } else {
          next[key] = [];
          console.error(`Dropdown API failed: ${url}`, result.reason);
        }
      });
      setOptions(next);
      setLoading(false);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [enabled, loaded]);

  return { options, loading };
};

const toArray = (v) =>
  Array.isArray(v)
    ? v.map(optionLabel).filter(Boolean)
    : typeof v === "string" && v.trim()
      ? v.split(",").map((s) => s.trim())
      : [];
const toText = (v) => (typeof v === "boolean" ? (v ? "Yes" : "No") : v ? optionLabel(v) : "");
const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isValid(d) ? d : null;
};

const ALL_EXTRA_FIELDS = EXTRA_GROUPS.flatMap((g) =>
  g.fields.map((f) => ({ ...f, usOnly: f.usOnly || g.usOnly }))
);

/* API response → form state */
const mapExtraFromApi = (src = {}) =>
  ALL_EXTRA_FIELDS.reduce((acc, f) => {
    const raw = src[f.api];
    acc[f.key] =
      f.type === "multi" ? toArray(raw)
        : f.type === "date" ? toDate(raw)
          : f.type === "text" ? raw || ""
            : toText(raw);
    return acc;
  }, {});

/* Form state → payload (US-only fields are left out for non-US candidates).
   Dropdown values are checked against their options so only valid keys are sent. */
const mapExtraToPayload = (data, isUS, dd = {}) =>
  ALL_EXTRA_FIELDS.reduce((acc, f) => {
    if (f.usOnly && !isUS) return acc;
    const opts = f.options ? dd[f.options] : null;
    const raw = data[f.key];
    const v = !opts
      ? raw
      : Array.isArray(raw)
        ? raw.map((x) => toKey(opts, x)).filter(Boolean)
        : toKey(opts, raw);
    acc[f.api] =
      f.type === "multi" ? (Array.isArray(v) && v.length ? v : null)
        : f.type === "date" ? (toDate(v) ? format(toDate(v), "yyyy-MM-dd") : null)
          : v || null;
    return acc;
  }, {});

/* Read-only display text for one field (keys shown as their labels) */
const displayValue = (f, v, options) => {
  if (f.type === "multi") return Array.isArray(v) ? v.map((k) => labelFor(options, k)).join(", ") : "";
  if (f.type === "date") return toDate(v) ? format(toDate(v), "yyyy-MM-dd") : "";
  if (f.type === "single") return v ? labelFor(options, v) : "";
  return v || "";
};

const DetailRow = ({ icon, label, value }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: { xs: 0.8, sm: 1.25 },
      mb: 1.4,
      width: "100%",
      minWidth: 0,
    }}
  >
    {/* Icon */}
    <Box
      sx={{
        color: palette.teal,
        display: "flex",
        flexShrink: 0,
        mt: "2px",
      }}
    >
      {icon}
    </Box>

    {/* Label */}
    <Typography
      sx={{
        fontSize: { xs: 10.5, sm: 12 },
        color: palette.muted,
        width: { xs: 100, sm: 150 },
        minWidth: { xs: 100, sm: 150 },
        flexShrink: 0,
      }}
    >
      {label}
    </Typography>

    {/* Value */}
    <Typography
      sx={{
        fontSize: { xs: 11.5, sm: 13.5 },
        color: palette.ink,
        flex: 1,
        minWidth: 0,
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        whiteSpace: "normal",
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

/* Small group heading used in both the view and the dialog */
const GroupHeading = ({ icon: Icon, title, tag }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
    <Icon sx={{ fontSize: 17, color: palette.teal }} />
    <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 14, color: palette.ink }}>
      {title}
    </Typography>
    {tag && (
      <Box
        sx={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: ".04em",
          color: palette.teal,
          bgcolor: palette.tealSoft,
          borderRadius: "6px",
          px: 0.8,
          py: 0.2,
        }}
      >
        {tag}
      </Box>
    )}
  </Box>
);

function Personaldetails({ onSectionComplete }) {
  const {
    data: personalDetailsData,
    isLoading: isProfileLoading,
    refetch: refetchPersonalDetails,
  } = useGetPersonalDetailsQuery();

  const candidateCompleateDetails =
    personalDetailsData?.data ?? personalDetailsData;

  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState([]);
  const [stateAndCity, setStateAndCity] = useState([]);
  const [permanentStateOptions, setPermanentStateOptions] = useState([]);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState("");
  const { data: countriesData } = useGetCandidateCountriesQuery();
  const [triggerGetLocations] = useLazyGetCandidateLocationsQuery();
  const [updatePersonalDetails] = useUpdatePersonalDetailsMutation();
  const [workAuthOptions, setWorkAuthOptions] = useState([]);
  const [triggerGetWorkAuthorizations] = useLazyGetWorkAuthorizationsQuery();
  const { options: dd, loading: ddLoading } = useDropdownOptions(open);

  const [personalData, setPersonalData] = useState({
    gender: "",
    dob: null,
    marriage: "",
    currentAddress: "",
    permanentAddress: "",
    nationality: "",
    country: "",
    stateAndCity: "",
    workAuthorization: "",
    pinCode: "",
    permanentCountry: "",
    permanentStateAndCity: "",
    permanentPinCode: "",
    ...mapExtraFromApi(),
  });

  // US-only fields are shown/sent only when the country is United States
  const isUS = isUSCountry(selectedCountry || personalData.country);

  // Sync local form state whenever the candidate profile data loads/changes
  useEffect(() => {
    if (!candidateCompleateDetails) return;

    setPersonalData({
      gender: candidateCompleateDetails?.gender || "",
      dob: candidateCompleateDetails?.date_of_birth
        ? parseISO(candidateCompleateDetails.date_of_birth)
        : null,
      marriage: candidateCompleateDetails?.marital_status || "",
      currentAddress: candidateCompleateDetails?.present_address || "",
      permanentAddress: candidateCompleateDetails?.address || "",
      nationality: candidateCompleateDetails?.nationality || "",
      country: candidateCompleateDetails?.country || "",
      stateAndCity: candidateCompleateDetails?.state || "",
      workAuthorization: candidateCompleateDetails?.work_authorization || "",
      pinCode: candidateCompleateDetails?.pincode || "",
      permanentCountry: candidateCompleateDetails?.permanent_country || "",
      permanentStateAndCity:
        candidateCompleateDetails?.permanent_city || candidateCompleateDetails?.permanent_state || "",
      permanentPinCode: candidateCompleateDetails?.permanent_pincode || "",
      ...mapExtraFromApi(candidateCompleateDetails),
    });
    setSelectedCountry(candidateCompleateDetails?.country || "");
  }, [candidateCompleateDetails]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPersonalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (key) => (date) => {
    setPersonalData((prev) => ({
      ...prev,
      [key]: date,
    }));
    setErrors((prev) => ({ ...prev, dob: "" }));
  };

  const handleDropdownChange = (key) => (event, newValue) => {
    setPersonalData((prev) => ({ ...prev, [key]: newValue || "" }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toTitleCase = (value) =>
    value?.trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) || "";

  const loadLocations = async (country, setOptions) => {
    if (!country) {
      setOptions([]);
      return;
    }
    try {
      const response = await triggerGetLocations(country).unwrap();
      setOptions(Array.isArray(response) ? response : response?.data ?? []);
    } catch (error) {
      console.error("Error fetching states/cities:", error);
      setOptions([]);
    }
  };

  const handleSelectPermanentCountry = (country) => {
    const formatted = toTitleCase(country);
    setPersonalData((prev) => ({ ...prev, permanentCountry: formatted, permanentStateAndCity: "" }));
    loadLocations(formatted, setPermanentStateOptions);
  };

  // "Same as current address" copies the address AND its country / state & city / pincode
  const handleSameAsCurrent = (event) => {
    const isChecked = event.target.checked;
    setSameAsCurrent(isChecked);
    setPersonalData((prev) => ({
      ...prev,
      permanentAddress: isChecked ? prev.currentAddress : "",
      permanentCountry: isChecked ? prev.country : "",
      permanentStateAndCity: isChecked ? prev.stateAndCity : "",
      permanentPinCode: isChecked ? prev.pinCode : "",
    }));
    if (isChecked) setErrors((prev) => ({ ...prev, permanentAddress: "" }));
  };

  // While ticked, keep the permanent block in sync with the current one
  useEffect(() => {
    if (!sameAsCurrent) return;
    setPersonalData((prev) =>
      prev.permanentAddress === prev.currentAddress &&
      prev.permanentCountry === prev.country &&
      prev.permanentStateAndCity === prev.stateAndCity &&
      prev.permanentPinCode === prev.pinCode
        ? prev
        : {
            ...prev,
            permanentAddress: prev.currentAddress,
            permanentCountry: prev.country,
            permanentStateAndCity: prev.stateAndCity,
            permanentPinCode: prev.pinCode,
          }
    );
  }, [sameAsCurrent, personalData.currentAddress, personalData.country, personalData.stateAndCity, personalData.pinCode]);

  // Load state & city lists for saved countries when the dialog opens
  useEffect(() => {
    if (!open) return;
    if (personalData.country && !stateAndCity.length) loadLocations(personalData.country, setStateAndCity);
    if (personalData.permanentCountry && !permanentStateOptions.length)
      loadLocations(personalData.permanentCountry, setPermanentStateOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Generic setter for the extra-details fields
  const handleExtraChange = (key) => (value) => {
    setPersonalData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectCountry = async (country) => {
    const formattedCountry = country
      ?.trim()
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    setSelectedCountry(formattedCountry);

    setPersonalData((prev) => ({
      ...prev,
      country: formattedCountry,
      // clear work authorization if the new country isn't US
      workAuthorization: isUSA(formattedCountry) ? prev.workAuthorization : "",
    }));

    if (formattedCountry) {
      try {
        const response = await triggerGetLocations(formattedCountry).unwrap();
        const locations = Array.isArray(response) ? response : response?.data ?? [];
        setStateAndCity(locations);
      } catch (error) {
        console.error("Error fetching states/cities:", error);
        setStateAndCity([]);
      }
    } else {
      setStateAndCity([]);
    }

    if (isUSA(formattedCountry)) {
      try {
        const response = await triggerGetWorkAuthorizations(formattedCountry).unwrap();
        const options = Array.isArray(response) ? response : response?.data ?? [];
        setWorkAuthOptions(options.map((item) => item.value));
      } catch (error) {
        console.error("Error fetching work authorizations:", error);
        setWorkAuthOptions([]);
      }
    } else {
      setWorkAuthOptions([]);
    }
  };
  useEffect(() => {
    if (!open) return;
    if (selectedCountry !== "United States") return;
    if (workAuthOptions.length > 0) return; // already loaded, don't refetch

    (async () => {
      try {
        const response = await triggerGetWorkAuthorizations(selectedCountry).unwrap();
        const options = Array.isArray(response) ? response : response?.data ?? [];
        setWorkAuthOptions(options.map((item) => item.value));
      } catch (error) {
        console.error("Error fetching work authorizations:", error);
        setWorkAuthOptions([]);
      }
    })();
  }, [open, selectedCountry, workAuthOptions.length, triggerGetWorkAuthorizations]);

  const validate = () => {
    let tempErrors = {};
    if (!personalData.gender) tempErrors.gender = "Gender is required";
    if (!personalData.dob) tempErrors.dob = "Date of Birth is required";
    if (!personalData.marriage)
      tempErrors.marriage = "Marital Status is required";
    if (!personalData.currentAddress)
      tempErrors.currentAddress = "Current Address is required";
    if (!personalData.permanentAddress)
      tempErrors.permanentAddress = "Permanent Address is required";
    if (!personalData.nationality)
      tempErrors.nationality = "Nationality is required";
    if (!personalData.country) tempErrors.country = "Country is required";
    if (!personalData.stateAndCity)
      tempErrors.stateAndCity = "State & City is required";
    if (!personalData.pinCode) tempErrors.pinCode = "Pincode is required";
    // Extra-details fields are all optional — intentionally not validated
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        const payload = {
          // Formatted so the IST→UTC conversion can't shift it back a day
          date_of_birth: toDate(personalData.dob)
            ? format(toDate(personalData.dob), "yyyy-MM-dd")
            : null,
          gender: personalData.gender,
          marital_status: personalData.marriage,
          nationality: personalData.nationality,
          // This dialog doesn't edit these three — keep what's already saved
          // instead of overwriting with placeholders
          languages_known: candidateCompleateDetails?.languages_known ?? [],
          address: personalData.permanentAddress,
          present_address: personalData.currentAddress,
          preferred_salary: candidateCompleateDetails?.preferred_salary ?? 0,
          city: personalData.stateAndCity,
          state: personalData.stateAndCity,
          country: personalData.country,
          work_authorization: personalData.workAuthorization || "",
          pincode: personalData.pinCode,
          // Permanent address location — new keys, backend must accept them
          permanent_country: personalData.permanentCountry || null,
          permanent_state: personalData.permanentStateAndCity || null,
          permanent_city: personalData.permanentStateAndCity || null,
          permanent_pincode: personalData.permanentPinCode || null,
          willing_to_relocate: candidateCompleateDetails?.willing_to_relocate ?? false,
          ...mapExtraToPayload(personalData, isUS, dd),
        };

        const response = await updatePersonalDetails(payload).unwrap();

        refetchPersonalDetails();

        onSectionComplete("personal", true);
        handleClose();
      } catch (error) {
        console.error("Error updating personal details:", error);
      }
    } else {
      console.log("Validation failed:", errors);
    }
  };

  useEffect(() => {
    const countriesList = Array.isArray(countriesData)
      ? countriesData
      : countriesData?.data ?? [];
    setCountries(countriesList);
  }, [countriesData]);

  /* Groups / fields visible for the current country */
  const visibleGroups = EXTRA_GROUPS.filter((g) => !g.usOnly || isUS)
    .map((g) => ({ ...g, fields: g.fields.filter((f) => !f.usOnly || isUS) }))
    .filter((g) => g.fields.length);

  /* Read-only view: only groups that have at least one filled value */
  const filledGroups = visibleGroups
    .map((g) => ({
      ...g,
      rows: g.fields
        .map((f) => ({ ...f, text: displayValue(f, personalData[f.key], dd[f.options]) }))
        .filter((r) => r.text),
    }))
    .filter((g) => g.rows.length);

  /* One input in the dialog, chosen by field type */
  const renderExtraField = (f) => {
    const value = personalData[f.key];
    const onChange = handleExtraChange(f.key);

    if (f.type === "text") {
      return (
        <TextField
          fullWidth
          size="small"
          label={f.label}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          sx={dialogFieldSx}
        />
      );
    }

    if (f.type === "date") {
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label={f.label}
            value={toDate(value)}
            onChange={onChange}
            slotProps={{
              textField: { fullWidth: true, size: "small", sx: dialogFieldSx },
              field: { clearable: true },
              popper: { sx: { zIndex: 1300 } },
            }}
          />
        </LocalizationProvider>
      );
    }

    const isMulti = f.type === "multi";
    return (
      <Autocomplete
        multiple={isMulti}
        // Multi-select: list stays open after each pick, picked items drop out of it
        disableCloseOnSelect={isMulti}
        filterSelectedOptions={isMulti}
        ChipProps={{ size: "small", sx: multiChipSx }}
        options={(dd[f.options] || []).map((o) => o.key)}
        getOptionLabel={(k) => labelFor(dd[f.options], k)}
        loading={ddLoading}
        value={f.type === "multi" ? value || [] : value || null}
        onChange={(_e, v) => onChange(f.type === "multi" ? v || [] : v || "")}
        size="small"
        renderInput={(params) => <TextField {...params} label={f.label} sx={dialogFieldSx} />}
      />
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{ bgcolor: palette.paper, border: `1px solid ${palette.line}`, borderRadius: "14px", p: { xs: 2.5, sm: 3 } }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: palette.tealSoft,
              color: palette.teal,
            }}
          >
            <BadgeOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 17, color: palette.ink }}>
            Personal Details
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          sx={{ bgcolor: palette.teal, textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: palette.tealDeep } }}
          onClick={handleOpen}
        >
          {candidateCompleateDetails ? "Edit Personal Details" : "+ Add Personal Details"}
        </Button>
      </Box>

      {isProfileLoading && (
        <Typography sx={{ color: palette.muted, fontSize: 13.5, mt: 2 }}>
          Loading personal details...
        </Typography>
      )}
      {!isProfileLoading && !candidateCompleateDetails && (
        <Typography sx={{ color: palette.muted, fontSize: 13.5, mt: 2 }}>
          No personal details added yet.
        </Typography>
      )}

      {/* Display saved personal details */}
      {candidateCompleateDetails && (
        <Box sx={{ mt: 2.5 }}>
          <Grid container columnSpacing={4} rowSpacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailRow icon={<BadgeOutlinedIcon sx={{ fontSize: 18 }} />} label="Gender" value={personalData.gender} />
              <DetailRow
                icon={<CakeOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Date of Birth"
                value={
                  personalData.dob instanceof Date && !isNaN(personalData.dob)
                    ? format(personalData.dob, "yyyy-MM-dd")
                    : ""
                }
              />
              <DetailRow
                icon={<FavoriteBorderOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Marital Status"
                value={personalData.marriage}
              />
              <DetailRow
                icon={<PublicOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Nationality"
                value={personalData.nationality}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DetailRow
                icon={<HomeOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Current Address"
                value={personalData.currentAddress}
              />
              <DetailRow
                icon={<HomeOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Permanent Address"
                value={personalData.permanentAddress}
              />
              <DetailRow
                icon={<PublicOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Current Location"
                value={[personalData.stateAndCity, personalData.country].filter(Boolean).join(", ")}
              />
              <DetailRow
                icon={<MarkunreadMailboxOutlinedIcon sx={{ fontSize: 18 }} />}
                label="Pincode"
                value={personalData.pinCode}
              />
              {(personalData.permanentCountry || personalData.permanentStateAndCity) && (
                <DetailRow
                  icon={<PublicOutlinedIcon sx={{ fontSize: 18 }} />}
                  label="Permanent Location"
                  value={[
                    personalData.permanentStateAndCity,
                    personalData.permanentCountry,
                    personalData.permanentPinCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </Grid>
          </Grid>

          {/* ── Additional details (only groups with saved values) ───────── */}
          {filledGroups.length > 0 && (
            <>
              <Divider sx={{ my: 2, borderColor: palette.line }} />
              <Grid container columnSpacing={4} rowSpacing={2.5}>
                {filledGroups.map((g) => (
                  <Grid size={{ xs: 12, md: 6 }} key={g.title}>
                    <GroupHeading icon={g.icon} title={g.title} tag={g.usOnly ? "US" : null} />
                    {g.rows.map((r) => (
                      <DetailRow
                        key={r.key}
                        icon={<g.icon sx={{ fontSize: 18 }} />}
                        label={r.label}
                        value={r.text}
                      />
                    ))}
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      )}

      {/* Add Personal Details Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px" } }}>
        <DialogTitle sx={{ fontFamily: fonts.display, fontWeight: 600, color: palette.ink }}>
          {candidateCompleateDetails ? "Edit Personal Details" : "Add Personal Details"}
          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", right: 8, top: 8, color: palette.teal }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {Object.keys(errors).length > 0 && (
            <Typography sx={{ color: palette.coral, mb: 2 }} variant="caption">
              Please correct the errors below
            </Typography>
          )}
          {/* ── Basic Info ─────────────────────────────────────────────── */}
          <GroupHeading icon={BadgeOutlinedIcon} title="Basic Info" />
          <Grid container spacing={1.5}>
            <Grid item size={{ xs: 12 }}>
              <Typography sx={{ fontSize: 12.5, color: palette.muted, mb: 0.25 }}>Gender</Typography>
              <RadioGroup row name="gender" value={personalData.gender} onChange={handleChange}>
                {genders.map((gender) => (
                  <FormControlLabel
                    key={gender}
                    value={gender}
                    control={
                      <Radio
                        size="small"
                        sx={{ color: palette.line, "&.Mui-checked": { color: palette.teal } }}
                      />
                    }
                    label={<Typography fontSize="13.5px" color={palette.ink}>{gender}</Typography>}
                  />
                ))}
              </RadioGroup>
              {errors.gender && (
                <Typography sx={{ color: palette.coral }} variant="caption">
                  {errors.gender}
                </Typography>
              )}
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth"
                  name="dob"
                  value={personalData?.dob || null}
                  onChange={handleDateChange("dob")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      error: !!errors.dob,
                      helperText: errors.dob,
                      sx: dialogFieldSx,
                    },
                    popper: { sx: { zIndex: 1300 } },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={maritalOptions}
                value={personalData.marriage || null}
                onChange={handleDropdownChange("marriage")}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Marital Status"
                    error={!!errors.marriage}
                    helperText={errors.marriage}
                    sx={dialogFieldSx}
                  />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Nationality"
                name="nationality"
                value={personalData.nationality}
                onChange={handleChange}
                error={!!errors.nationality}
                helperText={errors.nationality}
                sx={dialogFieldSx}
              />
            </Grid>
          </Grid>

          {/* ── Address — current + its location, then permanent + its location ── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={HomeOutlinedIcon} title="Address" />
            <Grid container spacing={1.5}>
              {/* Current address */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Current Address"
                  name="currentAddress"
                  value={personalData.currentAddress}
                  onChange={handleChange}
                  error={!!errors.currentAddress}
                  helperText={errors.currentAddress}
                  sx={dialogFieldSx}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={countries}
                  value={selectedCountry || null}
                  onChange={(e, value) => {
                    setPersonalData((prev) => ({ ...prev, stateAndCity: "" }));
                    handleSelectCountry(value);
                  }}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      error={!!errors.country}
                      helperText={errors.country}
                      sx={dialogFieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={stateAndCity}
                  disabled={!selectedCountry}
                  value={personalData.stateAndCity || null}
                  onChange={handleDropdownChange("stateAndCity")}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="State & City"
                      error={!!errors.stateAndCity}
                      helperText={errors.stateAndCity}
                      sx={dialogFieldSx}
                    />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pincode"
                  name="pinCode"
                  value={personalData.pinCode}
                  onChange={handleChange}
                  error={!!errors.pinCode}
                  helperText={errors.pinCode}
                  sx={dialogFieldSx}
                />
              </Grid>

              {/* Same as current — right above the permanent address */}
              <Grid item size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sameAsCurrent}
                      onChange={handleSameAsCurrent}
                      size="small"
                      sx={{ color: palette.teal, "&.Mui-checked": { color: palette.teal } }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: 13, color: palette.ink }}>
                      Same as current address
                    </Typography>
                  }
                />
              </Grid>

              {/* Permanent address */}
              <Grid item size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Permanent Address"
                  name="permanentAddress"
                  value={personalData.permanentAddress}
                  onChange={handleChange}
                  disabled={sameAsCurrent}
                  error={!!errors.permanentAddress}
                  helperText={errors.permanentAddress}
                  sx={dialogFieldSx}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={countries}
                  disabled={sameAsCurrent}
                  value={personalData.permanentCountry || null}
                  onChange={(e, value) => handleSelectPermanentCountry(value)}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="Country" sx={dialogFieldSx} />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={sameAsCurrent ? stateAndCity : permanentStateOptions}
                  disabled={sameAsCurrent || !personalData.permanentCountry}
                  value={personalData.permanentStateAndCity || null}
                  onChange={handleDropdownChange("permanentStateAndCity")}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="State & City" sx={dialogFieldSx} />
                  )}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pincode"
                  name="permanentPinCode"
                  disabled={sameAsCurrent}
                  value={personalData.permanentPinCode}
                  onChange={handleChange}
                  sx={dialogFieldSx}
                />
              </Grid>
            </Grid>
          </Box>

          {/* ── Additional details — all optional, US-only groups shown for US ── */}
          {visibleGroups.map((g) => (
            <Box key={g.title} sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2, borderColor: palette.line }} />
              <GroupHeading icon={g.icon} title={g.title} tag={g.usOnly ? "US" : null} />
              <Grid container spacing={1.5}>
                {g.fields.map((f) => (
                  <Grid item size={{ xs: 12, sm: f.type === "multi" || f.type === "text" ? 12 : 6 }} key={f.key}>
                    {renderExtraField(f)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} variant="outlined" sx={{ borderColor: palette.line, color: palette.ink, textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: palette.teal, textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: palette.tealDeep } }}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default React.memo(Personaldetails);