import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Checkbox,
  Grid,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDispatch, useSelector } from "react-redux";
import { isValid, format } from "date-fns";
import { toast } from "react-toastify";
import StepPageLayout from "../../../../../../components/StepPageLayout/index.jsx";
import candidateApi from "../../../../../../services/candidateApi.js";
import {
  useGetCandidateCountriesQuery,
  useLazyGetCandidateLocationsQuery,
  useGetWorkAuthorizationsQuery,
  useUpdatePersonalDetailsMutation,
} from "../../../../../../store/api/settings/CandidatePortalApis";
import {
  candidateSetInitialData,
  candidateUpdateFormData,
} from "../../../../../../store/slices/candidateSlice";
import { candidateGetUserDetails } from "../../../../../../utils/candidateReigister.js";
import {
  CANDIDATE_ACCESS_TOKEN,
  ACCESS_TOKEN,
  getItem,
} from "../../../../../../utils/helper.js";

/* ── Design tokens — shared visual system across Employment / Education / Personal ── */
const INK          = "#1F2937";
const TEXT_MUTED   = "#6B7280";
const PRIMARY      = "#2B6F71";
const PRIMARY_DARK = "#1E4F50";
const PRIMARY_TINT = "#EAF5F4";
const SURFACE      = "#F8FAF9"; // section panel background
const BORDER       = "#E1E5E7"; // softer than the old #E3E7EE

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

const checkboxSx = { color: PRIMARY, "&.Mui-checked": { color: PRIMARY } };

/* ── Section header — icon badge + title (+ optional tag), sits above a tinted panel ── */
const SectionHeader = ({ icon: Icon, title, tag }) => (
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
    {tag && (
      <Box
        sx={{
          ml: "auto",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".04em",
          color: PRIMARY_DARK,
          background: PRIMARY_TINT,
          borderRadius: "6px",
          px: 1,
          py: 0.3,
        }}
      >
        {tag}
      </Box>
    )}
  </Box>
);

/* ── Section panel — replaces the old "divider only" grouping ───────────── */
const SectionPanel = ({ icon, title, tag, children }) => (
  <Box
    sx={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: "14px",
      p: { xs: 2, sm: 2.5 },
      mb: 2.5,
    }}
  >
    <SectionHeader icon={icon} title={title} tag={tag} />
    {children}
  </Box>
);

/* ── Segmented chip selector — matches app-wide chip pattern ─────────────── */
const ChipSelect = ({ label, options, value, onChange, error }) => (
  <Box>
    <Typography sx={{ fontSize: "12.5px", color: TEXT_MUTED, mb: 0.6 }}>
      {label}
    </Typography>
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Box
            key={opt}
            onClick={() => onChange(opt)}
            sx={{
              cursor: "pointer",
              textAlign: "center",
              borderRadius: "9px",
              border: selected ? `1.5px solid ${PRIMARY}` : `1px solid ${BORDER}`,
              background: "#fff",
              boxShadow: selected ? `0 0 0 3px ${PRIMARY_TINT}` : "none",
              color: selected ? PRIMARY_DARK : "#4B5563",
              fontWeight: selected ? 700 : 500,
              fontSize: "13.5px",
              py: 0.95,
              px: 2.25,
              minWidth: 76,
              transition: "all .15s ease",
              "&:hover": { borderColor: PRIMARY },
            }}
          >
            {selected ? "✓ " : ""}
            {opt}
          </Box>
        );
      })}
    </Box>
    {error && (
      <Typography sx={{ fontSize: "11px", color: "#d32f2f", mt: 0.5 }}>
        {error}
      </Typography>
    )}
  </Box>
);

/* ── Single-value dropdown ───────────────────────────────────────────────── */
const SelectField = ({ label, options, value, onChange, loading = false }) => (
  <Autocomplete
    {...optionProps(options)}
    loading={loading}
    value={value || null}
    onChange={(_e, v) => onChange(v || "")}
    size="small"
    renderInput={(params) => <TextField {...params} label={label} sx={fieldSx} />}
  />
);

/* ── Multi-value dropdown (chips) ────────────────────────────────────────── */
const MultiSelectField = ({ label, options, value, onChange, loading = false }) => (
  <Autocomplete
    multiple
    filterSelectedOptions
    {...optionProps(options)}
    loading={loading}
    value={value || []}
    onChange={(_e, v) => onChange(v || [])}
    size="small"
    renderInput={(params) => <TextField {...params} label={label} sx={fieldSx} />}
  />
);

const genders = ["Male", "Female", "Other"];
const maritalOptions = ["Married", "UnMarried"];
const languageOptions = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
];

/* ── Dropdown APIs — every extra-details dropdown loads its options from here ── */
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
  const list = [res, res?.data, res?.data?.data, res?.data?.items, res?.data?.data?.items, res?.items].find(
    Array.isArray
  ) || [];
  const seen = new Set();
  return list.map(toOption).filter((o) => o.key && !seen.has(o.key) && seen.add(o.key));
};

/* Converts a stored value to the key the save API accepts.
   Fixes values saved earlier as labels ("U.S. Citizen" → "US Citizen")
   and drops anything that isn't a valid option ("Background Check").
   If the options haven't loaded, the value is left untouched. */
const toKey = (options, v) => {
  if (!options?.length || !v) return v;
  const match = options.find((o) => o.key === v) || options.find((o) => o.label === v);
  return match ? match.key : null;
};
const sanitizeByOptions = (data, fieldOptions) => {
  const out = { ...data };
  Object.entries(fieldOptions).forEach(([field, options]) => {
    const v = out[field];
    out[field] = Array.isArray(v)
      ? v.map((x) => toKey(options, x)).filter(Boolean)
      : toKey(options, v) ?? "";
  });
  return out;
};

/* Autocomplete works on keys; the label is looked up for display */
const optionProps = (options = []) => ({
  options: options.map((o) => o.key),
  getOptionLabel: (k) => options.find((o) => o.key === k)?.label ?? k ?? "",
});

/* Loads every dropdown in parallel once; one failing API doesn't block the others */
const useDropdownOptions = () => {
  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = getItem(CANDIDATE_ACCESS_TOKEN) || getItem(ACCESS_TOKEN);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const entries = Object.entries(DROPDOWN_ENDPOINTS);

    Promise.allSettled(entries.map(([, url]) => candidateApi.get(url, { headers }))).then(
      (results) => {
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
      }
    );

    return () => {
      active = false;
    };
  }, []);

  return { options, loading };
};

/* ── Helpers for API <-> form conversion ─────────────────────────────────── */
const US_COUNTRY_NAMES = ["united states", "us", "usa", "united states of america"];
// Handles "United States", "United States of America", "USA", case/spacing
// differences, and object options like { name } / { label } / { value }.
const isUSCountry = (c) => {
  const name = (typeof c === "string" ? c : c?.name || c?.label || c?.value || "")
    .trim()
    .toLowerCase();
  return name.startsWith("united states") || US_COUNTRY_NAMES.includes(name);
};

const toArray = (v) =>
  Array.isArray(v)
    ? v.map(optionLabel).filter(Boolean)
    : typeof v === "string" && v.trim()
      ? v.split(",").map((s) => s.trim())
      : [];
const toText = (v) =>
  typeof v === "boolean" ? (v ? "Yes" : "No") : v ? optionLabel(v) : "";
const arrOrNull = (a) => (Array.isArray(a) && a.length ? a : null);
const strOrNull = (s) => (s ? s : null);
const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isValid(d) ? d : null;
};

/* Extra fields — all optional */
const EXTRA_FIELD_DEFAULTS = {
  preferredContactMethods: [],
  preferredEmploymentTypes: [],
  preferredEngagementTypes: [],
  preferredWorkArrangements: [],
  locationPreference: "",
  currentUsWorkAuthorizations: [],
  employerSponsorship: "",
  authorizationExpirationDate: null,
  compensationBasis: "",
  importantW2Benefits: [],
  rateDependentOnBenefits: "",
  currentEmploymentStatus: "",
  currentTimeZone: "",
  preferredUsTimeZone: "",
  preferredShift: "",
  currentJobSearchStatus: "",
  mostImportantOpportunityFactors: [],
  preferredInterviewDays: [],
  preferredInterviewTime: "",
  interviewTimeZone: "",
  preferredJobCategories: [],
  preferredSeniorityLevels: [],
  preferredCompanyTypes: [],
  referralSource: "",
  referralSourceDetails: "",
  linkedinUrl: "",
};

const mapExtraFieldsFromApi = (pd) => ({
  preferredContactMethods: toArray(pd.preferred_contact_methods),
  preferredEmploymentTypes: toArray(pd.preferred_employment_types),
  preferredEngagementTypes: toArray(pd.preferred_engagement_types),
  preferredWorkArrangements: toArray(pd.preferred_work_arrangements),
  locationPreference: toText(pd.location_preference),
  currentUsWorkAuthorizations: toArray(pd.current_us_work_authorizations),
  employerSponsorship: toText(pd.employer_sponsorship),
  authorizationExpirationDate: toDate(pd.authorization_expiration_date),
  compensationBasis: toText(pd.compensation_basis),
  importantW2Benefits: toArray(pd.important_w2_benefits),
  rateDependentOnBenefits: toText(pd.rate_dependent_on_benefits),
  currentEmploymentStatus: toText(pd.current_employment_status),
  currentTimeZone: toText(pd.current_time_zone),
  preferredUsTimeZone: toText(pd.preferred_us_time_zone),
  preferredShift: toText(pd.preferred_shift),
  currentJobSearchStatus: toText(pd.current_job_search_status),
  mostImportantOpportunityFactors: toArray(pd.most_important_opportunity_factors),
  preferredInterviewDays: toArray(pd.preferred_interview_days),
  preferredInterviewTime: toText(pd.preferred_interview_time),
  interviewTimeZone: toText(pd.interview_time_zone),
  preferredJobCategories: toArray(pd.preferred_job_categories),
  preferredSeniorityLevels: toArray(pd.preferred_seniority_levels),
  preferredCompanyTypes: toArray(pd.preferred_company_types),
  referralSource: toText(pd.referral_source),
  referralSourceDetails: pd.referral_source_details || "",
  linkedinUrl: pd.linkedin_url || "",
});

/* Sent only when the country is United States */
const mapUSOnlyFieldsToPayload = (d) => ({
  preferred_contact_methods: arrOrNull(d.preferredContactMethods),
  preferred_employment_types: arrOrNull(d.preferredEmploymentTypes),
  preferred_engagement_types: arrOrNull(d.preferredEngagementTypes),
  preferred_work_arrangements: arrOrNull(d.preferredWorkArrangements),
  current_us_work_authorizations: arrOrNull(d.currentUsWorkAuthorizations),
  employer_sponsorship: strOrNull(d.employerSponsorship),
  authorization_expiration_date: toDate(d.authorizationExpirationDate)
    ? format(toDate(d.authorizationExpirationDate), "yyyy-MM-dd")
    : null,
  compensation_basis: strOrNull(d.compensationBasis),
  important_w2_benefits: arrOrNull(d.importantW2Benefits),
  rate_dependent_on_benefits: strOrNull(d.rateDependentOnBenefits),
  preferred_us_time_zone: strOrNull(d.preferredUsTimeZone),
});

/* Sent for every country (India, US, others) */
const mapCommonExtraFieldsToPayload = (d) => ({
  location_preference: strOrNull(d.locationPreference),
  current_employment_status: strOrNull(d.currentEmploymentStatus),
  current_time_zone: strOrNull(d.currentTimeZone),
  preferred_shift: strOrNull(d.preferredShift),
  current_job_search_status: strOrNull(d.currentJobSearchStatus),
  most_important_opportunity_factors: arrOrNull(d.mostImportantOpportunityFactors),
  preferred_interview_days: arrOrNull(d.preferredInterviewDays),
  preferred_interview_time: strOrNull(d.preferredInterviewTime),
  interview_time_zone: strOrNull(d.interviewTimeZone),
  preferred_job_categories: arrOrNull(d.preferredJobCategories),
  preferred_seniority_levels: arrOrNull(d.preferredSeniorityLevels),
  preferred_company_types: arrOrNull(d.preferredCompanyTypes),
  referral_source: strOrNull(d.referralSource),
  referral_source_details: strOrNull(d.referralSourceDetails),
  linkedin_url: strOrNull(d.linkedinUrl),
});

const PersonalDetails = ({ handleBack, activeStep, handleStepClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const candidateDetails = useSelector(
    (state) => state?.candidate?.formData?.candidateDetails || {}
  );

  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [countries, setCountries] = useState([]);
  const [stateAndCityOptions, setStateAndCityOptions] = useState([]);
  const [workAuthorizationOptions, setWorkAuthorizationOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedStateAndCity, setSelectedStateAndCity] = useState(null);
  const [errors, setErrors] = useState({});
  const [updatePersonalDetails, { isLoading: isUpdating }] = useUpdatePersonalDetailsMutation();
  const { data: countriesData, isLoading: isCountriesLoading } =
    useGetCandidateCountriesQuery();
  const [triggerGetLocations] = useLazyGetCandidateLocationsQuery();
  const { options: dd, loading: ddLoading } = useDropdownOptions();

  // Fields ordered to match the API payload shape
  const [localData, setLocalData] = useState({
    dob: null,
    gender: "",
    marriage: "",
    nationality: "",
    languagesKnown: [],
    currentAddress: "",
    permanentAddress: "",
    preferredSalary: "",
    country: "",
    stateAndCity: "",
    workAuthorization: "",
    pinCode: "",
    willingToRelocate: false,
    ...EXTRA_FIELD_DEFAULTS,
  });
  const isUnitedStates =
    isUSCountry(localData.country) || isUSCountry(selectedCountry);
  const { data: workAuthorizationsData, isLoading: isWorkAuthorizationsLoading } =
    useGetWorkAuthorizationsQuery("united states", { skip: !isUnitedStates });

  useEffect(() => {
    const countriesList = Array.isArray(countriesData)
      ? countriesData
      : countriesData?.data ?? [];
    setCountries(countriesList);
  }, [countriesData]);
// Data the user already saved on a previous visit to this step
const savedPersonalDetails = useSelector(
  (state) => state?.candidate?.formData?.personalDetails
);
const hasSavedPersonalDetails = Object.keys(savedPersonalDetails || {}).length > 0;

  // Populates Redux with resume_data if this step is opened before any
  // earlier step (Employment, Education) has already fetched it — otherwise
  // candidateDetails.resume_data stays empty and none of the autofill below
  // ever fires. Guarded by the resume_data check so it only runs once.
  useEffect(() => {
    if (candidateDetails?.resume_data) return;

    const fetchDetails = async () => {
      const token = getItem(CANDIDATE_ACCESS_TOKEN);
      const details = await candidateGetUserDetails(token, () => {});
      if (details) dispatch(candidateSetInitialData(details));
    };
    fetchDetails();
  }, [candidateDetails?.resume_data, dispatch]);

useEffect(() => {
  if (hasSavedPersonalDetails) {
    // Already in localData's own shape — use directly
    setLocalData((prev) => ({ ...prev, ...savedPersonalDetails }));
    // Keep the Country / State & City inputs in sync with the saved data
    if (savedPersonalDetails.country) setSelectedCountry(savedPersonalDetails.country);
    if (savedPersonalDetails.stateAndCity) setSelectedStateAndCity(savedPersonalDetails.stateAndCity);
    return;
  }

  const pd = candidateDetails?.resume_data?.personal_details || {};
  if (!Object.keys(pd).length) return;
  setLocalData((prev) => ({
    ...prev,
    dob: pd.date_of_birth ? new Date(pd.date_of_birth) : null,
    gender: pd.gender || "",
    marriage: pd.marital_status || "",
    nationality: pd.nationality || "",
    languagesKnown: pd.languages_known
      ? (Array.isArray(pd.languages_known)
          ? pd.languages_known
          : pd.languages_known.split(",").map((l) => l.trim()))
      : [],
    currentAddress: pd.address || "",
    permanentAddress: pd.present_address || "",
    preferredSalary: pd.preferred_salary || "",
    country: pd.country || "",
    stateAndCity: pd.city || pd.state || "",
    workAuthorization: pd.work_authorization || "",
    pinCode: pd.pincode || "",
    willingToRelocate: !!pd.willing_to_relocate,
    ...mapExtraFieldsFromApi(pd),
  }));

  if (pd.country) {
    setSelectedCountry(pd.country);
    // Without this, stateAndCityOptions stays empty after autofill — the
    // saved value still displays (the field is freeSolo) but the dropdown
    // itself has no suggestions until the user manually re-picks a country.
    (async () => {
      try {
        const response = await triggerGetLocations(pd.country).unwrap();
        const locationsList = Array.isArray(response)
          ? response
          : response?.data ?? [];
        setStateAndCityOptions(locationsList);
      } catch (error) {
        console.error("Error fetching states/cities:", error);
      }
    })();
  }
  if (pd.city || pd.state) setSelectedStateAndCity(pd.city || pd.state);
}, [candidateDetails, hasSavedPersonalDetails, savedPersonalDetails, triggerGetLocations]);
  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setLocalData((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "currentAddress" && sameAsCurrent)
        updated.permanentAddress = value;
      return updated;
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleDateChange = (key) => (date) => {
    setLocalData((prev) => ({ ...prev, [key]: date }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleAutoCompleteChange = (key) => (_e, value) => {
    setLocalData((prev) => ({ ...prev, [key]: value || "" }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleChipChange = (key) => (value) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // Generic setter for the extra-details dropdowns (single + multi)
  const handleValue = (key) => (value) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  };

  const handleLanguagesChange = (_e, value) => {
    setLocalData((prev) => ({ ...prev, languagesKnown: value || [] }));
    setErrors((prev) => ({ ...prev, languagesKnown: "" }));
  };

  const handleCheckboxField = (key) => (event) => {
    setLocalData((prev) => ({ ...prev, [key]: event.target.checked }));
  };

  const handleSameAsCurrent = (event) => {
    const isChecked = event.target.checked;
    setSameAsCurrent(isChecked);
    setLocalData((prev) => ({
      ...prev,
      permanentAddress: isChecked ? prev.currentAddress : "",
    }));
    if (isChecked) setErrors((prev) => ({ ...prev, permanentAddress: "" }));
  };

  const handleSelectCountry = async (country) => {
    setSelectedCountry(country);
    setLocalData((prev) => ({
      ...prev,
      country,
      workAuthorization: isUSCountry(country) ? prev.workAuthorization : "",
    }));
    setErrors((prev) => ({ ...prev, country: "" }));
    if (!country) {
      setStateAndCityOptions([]);
      return;
    }

    try {
      const response = await triggerGetLocations(country).unwrap();
      const locationsList = Array.isArray(response)
        ? response
        : response?.data ?? [];
      setStateAndCityOptions(locationsList);
    } catch (error) {
      console.error("Error fetching states/cities:", error);
      setStateAndCityOptions([]);
    }
  };

  useEffect(() => {
    const authorizations = Array.isArray(workAuthorizationsData?.data)
      ? workAuthorizationsData.data
      : Array.isArray(workAuthorizationsData)
        ? workAuthorizationsData
        : [];
    setWorkAuthorizationOptions(authorizations);
  }, [workAuthorizationsData]);

  const validate = () => {
    let tempErrors = {};
    if (!localData.dob) tempErrors.dob = "Date of Birth is required";
    if (!localData.gender) tempErrors.gender = "Gender is required";
    if (!localData.marriage) tempErrors.marriage = "Marital Status is required";
    if (!localData.nationality)
      tempErrors.nationality = "Nationality is required";
    if (!localData.languagesKnown.length)
      tempErrors.languagesKnown = "At least one language is required";
    if (!localData.currentAddress)
      tempErrors.currentAddress = "Current Address is required";
    if (!localData.permanentAddress)
      tempErrors.permanentAddress = "Permanent Address is required";
    if (!localData.country) tempErrors.country = "Country is required";
    if (isUnitedStates && !localData.workAuthorization)
      tempErrors.workAuthorization = "Work authorization is required";
    if (!localData.stateAndCity)
      tempErrors.stateAndCity = "State & City is required";
    if (!localData.pinCode) tempErrors.pinCode = "Pincode is required";
    // Extra-details fields are all optional — intentionally not validated
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Which option list each dropdown field is checked against before saving
  const fieldOptions = {
    preferredContactMethods: dd.contactMethods,
    preferredEmploymentTypes: dd.employmentTypes,
    preferredEngagementTypes: dd.engagementTypes,
    preferredWorkArrangements: dd.workArrangements,
    currentUsWorkAuthorizations: dd.usWorkAuthorizations,
    employerSponsorship: dd.employerSponsorship,
    compensationBasis: dd.compensationBasis,
    rateDependentOnBenefits: dd.benefitBasedRate,
    importantW2Benefits: dd.w2Benefits,
    currentJobSearchStatus: dd.jobSearchStatus,
    currentEmploymentStatus: dd.employmentStatus,
    currentTimeZone: dd.timezones,
    preferredUsTimeZone: dd.preferredUsTimeZones,
    preferredShift: dd.workShifts,
    preferredInterviewDays: dd.interviewDays,
    preferredInterviewTime: dd.interviewPreferenceTypes,
    interviewTimeZone: dd.timezones,
    preferredJobCategories: dd.jobCategories,
    preferredSeniorityLevels: dd.seniorityLevels,
    preferredCompanyTypes: dd.companyTypes,
    mostImportantOpportunityFactors: dd.opportunityFactors,
    locationPreference: dd.locationPreferences,
    referralSource: dd.referralSources,
  };

  // Old/invalid values sitting in Redux or the form are cleaned up as soon as options load
  useEffect(() => {
    if (ddLoading) return;
    setLocalData((prev) => sanitizeByOptions(prev, fieldOptions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ddLoading]);

  const handleSaveAndNext = () => {
  // if (!validate()) return;
  const cleanData = sanitizeByOptions(localData, fieldOptions);
  dispatch(candidateUpdateFormData({ section: "personalDetails", updates: cleanData }));

    const payload = {
      date_of_birth:
        localData.dob && isValid(localData.dob)
          ? format(localData.dob, "yyyy-MM-dd")
          : null,
      gender: localData.gender,
      marital_status: localData.marriage,
      nationality: localData.nationality,
      languages_known: localData.languagesKnown,
      address: localData.currentAddress,
      present_address: localData.permanentAddress,
      preferred_salary: Number(localData.preferredSalary) || 0,
      city: localData.stateAndCity,
      state: localData.stateAndCity,
      country: localData.country,
      work_authorization: isUnitedStates ? localData.workAuthorization : "",
      pincode: localData.pinCode,
      willing_to_relocate: localData.willingToRelocate,
      // Extra fields — common ones for everyone, US-only ones only for US
      ...mapCommonExtraFieldsToPayload(cleanData),
      ...(isUnitedStates ? mapUSOnlyFieldsToPayload(cleanData) : {}),
    };

    const save = async () => {
      try {
        const res = await updatePersonalDetails(payload).unwrap();
        if (res?.success || res?.data?.success) navigate("/for-candidate/profile");
      } catch (error) {
        toast.error(error?.data?.message || error?.message || "An error occurred");
      }
    };
    save();
  };

  return (
    <StepPageLayout activeStep={activeStep} handleStepClick={handleStepClick}>
      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
          Personal Details
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: TEXT_MUTED, mt: 0.4, lineHeight: 1.35 }}>
          Enter your contact and personal information to finish setting up your profile.
        </Typography>
      </Box>

      {/* Basic Info */}
      <SectionPanel icon={PersonRoundedIcon} title="Basic Info">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date of Birth"
                value={localData.dob}
                onChange={handleDateChange("dob")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!errors.dob,
                    helperText: errors.dob,
                    sx: fieldSx,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Nationality"
              value={localData.nationality || ""}
              onChange={handleChange("nationality")}
              error={!!errors.nationality}
              helperText={errors.nationality}
              sx={fieldSx}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <ChipSelect
              label="Gender"
              options={genders}
              value={localData.gender}
              onChange={handleChipChange("gender")}
              error={errors.gender}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <ChipSelect
              label="Marital Status"
              options={maritalOptions}
              value={localData.marriage}
              onChange={handleChipChange("marriage")}
              error={errors.marriage}
            />
          </Grid>
        </Grid>
      </SectionPanel>

      {/* Languages & Salary */}
      <SectionPanel icon={ChatBubbleOutlineRoundedIcon} title="Languages & Salary">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              multiple
              options={languageOptions}
              value={localData.languagesKnown}
              onChange={handleLanguagesChange}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Languages Known"
                  error={!!errors.languagesKnown}
                  helperText={errors.languagesKnown}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Preferred Salary"
              type="number"
              value={localData.preferredSalary || ""}
              onChange={handleChange("preferredSalary")}
              error={!!errors.preferredSalary}
              helperText={errors.preferredSalary}
              sx={fieldSx}
            />
          </Grid>
        </Grid>
      </SectionPanel>

      {/* Address */}
      <SectionPanel icon={HomeRoundedIcon} title="Address">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Current Address"
              value={localData.currentAddress || ""}
              onChange={handleChange("currentAddress")}
              error={!!errors.currentAddress}
              helperText={errors.currentAddress}
              sx={fieldSx}
            />
          </Grid>
          <Grid item size={{ xs: 12 }} sx={{ mt: -1.2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={sameAsCurrent}
                  onChange={handleSameAsCurrent}
                  size="small"
                  sx={checkboxSx}
                />
              }
              label={
                <Typography sx={{ fontSize: "13px", color: "#4B5563" }}>
                  Same as current address
                </Typography>
              }
            />
          </Grid>
          <Grid item size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Permanent Address"
              value={localData.permanentAddress || ""}
              onChange={handleChange("permanentAddress")}
              error={!!errors.permanentAddress}
              helperText={errors.permanentAddress}
              sx={fieldSx}
            />
          </Grid>
        </Grid>
      </SectionPanel>

      {/* Location */}
      <SectionPanel icon={PlaceRoundedIcon} title="Location">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              freeSolo
              options={countries}
              value={selectedCountry || ""}
              onChange={(_e, value) => handleSelectCountry(value)}
              size="small"
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
          <Grid item size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              freeSolo
              options={stateAndCityOptions}
              disabled={!selectedCountry}
              value={selectedStateAndCity || ""}
              onChange={(_e, value) => {
                setSelectedStateAndCity(value);
                setLocalData((prev) => ({
                  ...prev,
                  stateAndCity: value || "",
                }));
                setErrors((prev) => ({ ...prev, stateAndCity: "" }));
              }}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="State & City"
                  error={!!errors.stateAndCity}
                  helperText={errors.stateAndCity}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Pincode"
              value={localData.pinCode || ""}
              onChange={handleChange("pinCode")}
              error={!!errors.pinCode}
              helperText={errors.pinCode}
              sx={fieldSx}
            />
          </Grid>
          {isUnitedStates && (
            <Grid item size={{ xs: 12, sm: 4 }}>
              <Autocomplete
                options={workAuthorizationOptions}
                loading={isWorkAuthorizationsLoading}
                value={workAuthorizationOptions.find(
                  (option) => option.value === localData.workAuthorization
                ) || null}
                onChange={(_e, option) => {
                  setLocalData((prev) => ({
                    ...prev,
                    workAuthorization: option?.value || "",
                  }));
                  setErrors((prev) => ({ ...prev, workAuthorization: "" }));
                }}
                getOptionLabel={(option) => option?.value || ""}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Work Authorization"
                    error={!!errors.workAuthorization}
                    helperText={errors.workAuthorization}
                    sx={fieldSx}
                  />
                )}
              />
            </Grid>
          )}
          <Grid item size={{ xs: 12 }} sx={{ mt: -0.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localData.willingToRelocate}
                  onChange={handleCheckboxField("willingToRelocate")}
                  size="small"
                  sx={checkboxSx}
                />
              }
              label={
                <Typography sx={{ fontSize: "13px", color: "#4B5563" }}>
                  Willing to relocate
                </Typography>
              }
            />
          </Grid>
        </Grid>
      </SectionPanel>

      {/* ══════════════ US-only extra details (all optional) ══════════════ */}
      {isUnitedStates && (
        <>
          {/* Work Preferences */}
          <SectionPanel icon={TuneRoundedIcon} title="Work Preferences" tag="US">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <MultiSelectField
                  label="Preferred Contact Methods"
                  options={dd.contactMethods}
                  loading={ddLoading}
                  value={localData.preferredContactMethods}
                  onChange={handleValue("preferredContactMethods")}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <MultiSelectField
                  label="Preferred Employment Types"
                  options={dd.employmentTypes}
                  loading={ddLoading}
                  value={localData.preferredEmploymentTypes}
                  onChange={handleValue("preferredEmploymentTypes")}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <MultiSelectField
                  label="Preferred Engagement Types"
                  options={dd.engagementTypes}
                  loading={ddLoading}
                  value={localData.preferredEngagementTypes}
                  onChange={handleValue("preferredEngagementTypes")}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <MultiSelectField
                  label="Preferred Work Arrangements"
                  options={dd.workArrangements}
                  loading={ddLoading}
                  value={localData.preferredWorkArrangements}
                  onChange={handleValue("preferredWorkArrangements")}
                />
              </Grid>
            </Grid>
          </SectionPanel>

          {/* US Work Authorization */}
          <SectionPanel icon={VerifiedUserRoundedIcon} title="US Work Authorization" tag="US">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <MultiSelectField
                  label="Current US Work Authorizations"
                  options={dd.usWorkAuthorizations}
                  loading={ddLoading}
                  value={localData.currentUsWorkAuthorizations}
                  onChange={handleValue("currentUsWorkAuthorizations")}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Authorization Expiration Date"
                    value={toDate(localData.authorizationExpirationDate)}
                    onChange={handleDateChange("authorizationExpirationDate")}
                    slotProps={{
                      textField: { fullWidth: true, size: "small", sx: fieldSx },
                      field: { clearable: true },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <SelectField
                  label="Employer Sponsorship"
                  options={dd.employerSponsorship}
                  loading={ddLoading}
                  value={localData.employerSponsorship}
                  onChange={handleValue("employerSponsorship")}
                />
              </Grid>
            </Grid>
          </SectionPanel>

          {/* Compensation & Benefits */}
          <SectionPanel icon={PaymentsRoundedIcon} title="Compensation & Benefits" tag="US">
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <SelectField
                  label="Compensation Basis"
                  options={dd.compensationBasis}
                  loading={ddLoading}
                  value={localData.compensationBasis}
                  onChange={handleValue("compensationBasis")}
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <SelectField
                  label="Rate Dependent on Benefits"
                  options={dd.benefitBasedRate}
                  loading={ddLoading}
                  value={localData.rateDependentOnBenefits}
                  onChange={handleValue("rateDependentOnBenefits")}
                />
              </Grid>
              <Grid item size={{ xs: 12 }}>
                <MultiSelectField
                  label="Important W2 Benefits"
                  options={dd.w2Benefits}
                  loading={ddLoading}
                  value={localData.importantW2Benefits}
                  onChange={handleValue("importantW2Benefits")}
                />
              </Grid>
            </Grid>
          </SectionPanel>
        </>
      )}

      {/* ══════════════ Extra details for every country (all optional) ══════════════ */}

      {/* Availability & Interviews */}
      <SectionPanel icon={EventAvailableRoundedIcon} title="Availability & Interviews">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Current Job Search Status"
              options={dd.jobSearchStatus}
              loading={ddLoading}
              value={localData.currentJobSearchStatus}
              onChange={handleValue("currentJobSearchStatus")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Current Employment Status"
              options={dd.employmentStatus}
              loading={ddLoading}
              value={localData.currentEmploymentStatus}
              onChange={handleValue("currentEmploymentStatus")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Current Time Zone"
              options={dd.timezones}
              loading={ddLoading}
              value={localData.currentTimeZone}
              onChange={handleValue("currentTimeZone")}
            />
          </Grid>
          {/* US-only — Indian / other candidates don't need a US time zone */}
          {isUnitedStates && (
            <Grid item size={{ xs: 12, sm: 6 }}>
              <SelectField
                label="Preferred US Time Zone"
                options={dd.preferredUsTimeZones}
                loading={ddLoading}
                value={localData.preferredUsTimeZone}
                onChange={handleValue("preferredUsTimeZone")}
              />
            </Grid>
          )}
          <Grid item size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Preferred Shift"
              options={dd.workShifts}
              loading={ddLoading}
              value={localData.preferredShift}
              onChange={handleValue("preferredShift")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <MultiSelectField
              label="Preferred Interview Days"
              options={dd.interviewDays}
              loading={ddLoading}
              value={localData.preferredInterviewDays}
              onChange={handleValue("preferredInterviewDays")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Preferred Interview Time"
              options={dd.interviewPreferenceTypes}
              loading={ddLoading}
              value={localData.preferredInterviewTime}
              onChange={handleValue("preferredInterviewTime")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="Interview Time Zone"
              options={dd.timezones}
              loading={ddLoading}
              value={localData.interviewTimeZone}
              onChange={handleValue("interviewTimeZone")}
            />
          </Grid>
        </Grid>
      </SectionPanel>

      {/* Job Preferences */}
      <SectionPanel icon={WorkOutlineRoundedIcon} title="Job Preferences">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <MultiSelectField
              label="Preferred Job Categories"
              options={dd.jobCategories}
              loading={ddLoading}
              value={localData.preferredJobCategories}
              onChange={handleValue("preferredJobCategories")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <MultiSelectField
              label="Preferred Seniority Levels"
              options={dd.seniorityLevels}
              loading={ddLoading}
              value={localData.preferredSeniorityLevels}
              onChange={handleValue("preferredSeniorityLevels")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <MultiSelectField
              label="Preferred Company Types"
              options={dd.companyTypes}
              loading={ddLoading}
              value={localData.preferredCompanyTypes}
              onChange={handleValue("preferredCompanyTypes")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <MultiSelectField
              label="Most Important Opportunity Factors"
              options={dd.opportunityFactors}
              loading={ddLoading}
              value={localData.mostImportantOpportunityFactors}
              onChange={handleValue("mostImportantOpportunityFactors")}
            />
          </Grid>
          <Grid item size={{ xs: 12 }}>
            <SelectField
              label="Location Preference"
              options={dd.locationPreferences}
              loading={ddLoading}
              value={localData.locationPreference}
              onChange={handleValue("locationPreference")}
            />
          </Grid>
        </Grid>
      </SectionPanel>

      {/* Referral & Profile */}
      <SectionPanel icon={LinkRoundedIcon} title="Referral & Profile">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <SelectField
              label="How did you hear about us?"
              options={dd.referralSources}
              value={localData.referralSource}
              onChange={handleValue("referralSource")}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Referral Details"
              placeholder="e.g. referrer name or job board"
              value={localData.referralSourceDetails || ""}
              onChange={handleChange("referralSourceDetails")}
              sx={fieldSx}
            />
          </Grid>
          <Grid item size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="LinkedIn URL"
              placeholder="https://www.linkedin.com/in/your-profile"
              value={localData.linkedinUrl || ""}
              onChange={handleChange("linkedinUrl")}
              sx={fieldSx}
            />
          </Grid>
        </Grid>
      </SectionPanel>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" mt={1}>
        <Button
          onClick={handleBack}
          variant="outlined"
          sx={{
            borderColor: BORDER,
            color: "#4B5563",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            "&:hover": {
              borderColor: PRIMARY,
              background: PRIMARY_TINT,
            },
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveAndNext}
          disabled={isUpdating}
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
          {isUpdating ? (
            <CircularProgress size={20} sx={{ color: "#fff" }} />
          ) : (
            "Save & Next"
          )}
        </Button>
      </Box>
    </StepPageLayout>
  );
};

PersonalDetails.propTypes = {
  handleBack: PropTypes.func.isRequired,
  activeStep: PropTypes.number.isRequired,
  handleStepClick: PropTypes.func.isRequired,
};

export default PersonalDetails;