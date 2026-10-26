import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
  Grid,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import { useDispatch, useSelector } from "react-redux";
import { ACCESS_TOKEN, CANDIDATE_ACCESS_TOKEN, getItem } from "../../../../../../utils/helper.js";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import candidateApi from "../../../../../../services/candidateApi.js";
import StepPageLayout from "../../../../../../components/StepPageLayout/index.jsx";
import { candidateSetInitialData, candidateUpdateFormData } from "../../../../../../store/slices/candidateSlice";
import { candidateGetUserDetails } from "../../../../../../utils/candidateReigister.js";

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

/* Qualification → Course → Specialization all come from the dropdown APIs:
   GET /dropdown/education-levels
   GET /dropdown/courses?education_level=…
   GET /dropdown/specializations?education_level=…&course=… */
const courseTypes = ["Full Time", "Part Time", "Distance Learning"];

const authHeaders = () => {
  const token = getItem(CANDIDATE_ACCESS_TOKEN) || getItem(ACCESS_TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* These APIs return a plain string array; also tolerates { data: [...] } / object items */
const toStringList = (res) => {
  const list = [res?.data, res?.data?.data, res].find(Array.isArray) || [];
  return list
    .map((x) => (typeof x === "string" ? x : x?.label ?? x?.value ?? x?.name ?? ""))
    .filter(Boolean);
};

/* Fetches a dropdown list; returns [] on failure so the page never breaks */
const fetchOptions = async (url, params) => {
  try {
    const res = await candidateApi.get(url, { params, headers: authHeaders() });
    return toStringList(res);
  } catch (error) {
    console.error(`Dropdown API failed: ${url}`, error);
    return [];
  }
};
const gradingSystems = [
  "CGPA (10-point scale)",
  "CGPA (4-point scale)",
  "Percentage",
];
/* ── Resume education → one record for this step ──────────────────────────
   New response: resume_data.education is an ARRAY (highest qualification first).
   Old response sent a single object — both are handled. */
const getResumeEducation = (resumeData) => {
  const edu = resumeData?.education;
  if (Array.isArray(edu)) return edu.find(Boolean) || null;
  return edu && Object.keys(edu).length ? edu : null;
};

/* Matches a resume value to the dropdown's own spelling
   ("B.Sc." ↔ "B.Sc", "postgraduate / master's degree" ↔ "Postgraduate / Master's Degree") */
const looseKey = (v) => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const matchOption = (options, value) => {
  if (!value || !options?.length) return value;
  const hit = options.find((o) => looseKey(o) === looseKey(value));
  return hit ?? value;
};

const years = Array.from({ length: 50 }, (_, i) => `${2025 - i}`);

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

const EducationalPage = ({
  handleNext,
  handleBack,
  activeStep,
  handleStepClick,
}) => {
  const dispatch = useDispatch();

  // FIX: this was previously `state?.candidate?.formData || {}`, which
  // grabs the WHOLE formData tree — {loginDetails, candidateDetails,
  // employmentDetails, educationDetails, ...} — not the candidateDetails
  // slice inside it. Every `candidateDetails?.resume_data?...` read below
  // was therefore looking for a `resume_data` key directly on formData,
  // which doesn't exist; the real path is formData.candidateDetails.resume_data.
  // That's why autofill was silently doing nothing.
  const candidateDetails = useSelector(
    (state) => state?.candidate?.formData?.candidateDetails || {}
  );
  const savedEducationDetails = useSelector(
    (state) => state?.candidate?.formData?.educationDetails
  );
  const hasSavedEducationDetails = Object.keys(savedEducationDetails || {}).length > 0;

  // State ordered to match the API payload
  const [localData, setLocalData] = useState({
    educationId: null,
    qualification: "", // education_level — picked from /dropdown/education-levels
    university: "",
    course: "",
    specialization: "",
    courseType: "Full Time", // course_type
    startYear: null,
    endYear: null,
    gradingSystem: "",
    marks: "",
  });
  const [loading, setLoading] = useState(false);

  // Cascading dropdown options
  const [educationLevels, setEducationLevels] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [specsLoading, setSpecsLoading] = useState(false);

  // 1. Qualification list — loaded once
  useEffect(() => {
    let active = true;
    fetchOptions("/dropdown/education-levels").then((list) => {
      if (!active) return;
      setEducationLevels(list);
      setLevelsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Resume values use their own spelling — align them to the dropdown options
  // so the cascade (courses → specializations) is called with valid values
  useEffect(() => {
    setLocalData((prev) => {
      const qualification = matchOption(educationLevels, prev.qualification);
      return qualification === prev.qualification ? prev : { ...prev, qualification };
    });
  }, [educationLevels, localData.qualification]);

  useEffect(() => {
    setLocalData((prev) => {
      const course = matchOption(courseOptions, prev.course);
      return course === prev.course ? prev : { ...prev, course };
    });
  }, [courseOptions, localData.course]);

  useEffect(() => {
    setLocalData((prev) => {
      const specialization = matchOption(specializationOptions, prev.specialization);
      return specialization === prev.specialization ? prev : { ...prev, specialization };
    });
  }, [specializationOptions, localData.specialization]);

  // 2. Courses — reload whenever the qualification changes
  useEffect(() => {
    if (!localData.qualification) {
      setCourseOptions([]);
      return;
    }
    let active = true;
    setCoursesLoading(true);
    fetchOptions("/dropdown/courses", { education_level: localData.qualification }).then((list) => {
      if (!active) return;
      setCourseOptions(list);
      setCoursesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [localData.qualification]);

  // 3. Specializations — reload whenever qualification or course changes
  useEffect(() => {
    if (!localData.qualification || !localData.course) {
      setSpecializationOptions([]);
      return;
    }
    let active = true;
    setSpecsLoading(true);
    fetchOptions("/dropdown/specializations", {
      education_level: localData.qualification,
      course: localData.course,
    }).then((list) => {
      if (!active) return;
      setSpecializationOptions(list);
      setSpecsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [localData.qualification, localData.course]);

  // Populates Redux with resume_data if this step is opened before any
  // earlier step has already fetched it. Guarded so it only runs once.
  useEffect(() => {
    if (candidateDetails?.resume_data) return;

    const fetchDetails = async () => {
      const token = getItem(CANDIDATE_ACCESS_TOKEN);
      const details = await candidateGetUserDetails(token, () => { });
      if (details) dispatch(candidateSetInitialData(details));
    };
    fetchDetails();
  }, [candidateDetails?.resume_data, dispatch]);

  useEffect(() => {
    if (hasSavedEducationDetails) {
      // Already in localData's own shape (it's exactly what we dispatched),
      // so use it directly rather than re-mapping API field names.
      setLocalData((prev) => ({ ...prev, ...savedEducationDetails }));
      return;
    }
    const edu = getResumeEducation(candidateDetails?.resume_data);
    if (!edu) return;
    setLocalData({
      educationId: edu.id ?? null,
      qualification: edu.education_level || "",
      university: edu.university || "",
      course: edu.course || "",
      specialization: edu.specialization || "",
      courseType: edu.course_type || "Full Time",
      startYear: edu.start_year ? String(edu.start_year) : null,
      endYear: edu.end_year ? String(edu.end_year) : null,
      gradingSystem: edu.grading_system || "",
      marks: edu.marks ? String(edu.marks) : "",
    });
  }, [candidateDetails, hasSavedEducationDetails, savedEducationDetails]);

  // Only years strictly after the selected start year are valid end years.
  // With no start year picked yet, the full list is offered.
  const endYearOptions = useMemo(() => {
    if (!localData.startYear) return years;
    return years.filter((y) => Number(y) > Number(localData.startYear));
  }, [localData.startYear]);

  const handleAutoCompleteChange = (key) => (_event, value) => {
    setLocalData((prev) => {
      const next = { ...prev, [key]: value || "" };
      // A new parent selection makes the child values invalid — clear them
      if (key === "qualification" && value !== prev.qualification) {
        next.course = "";
        next.specialization = "";
      }
      if (key === "course" && value !== prev.course) {
        next.specialization = "";
      }
      // If the new start year is at or after the current end year,
      // the end year is no longer valid — clear it.
      if (
        key === "startYear" &&
        prev.endYear &&
        Number(value) >= Number(prev.endYear)
      ) {
        next.endYear = null;
      }
      return next;
    });
  };

  const handleChange = (key) => (event) => {
    setLocalData((prev) => ({ ...prev, [key]: event.target.value ?? "" }));
  };

  const handleSaveAndNext = () => {
    const payload = {
      education_level: localData.qualification,
      university: (localData.university || "").trim(),
      course: localData.course,
      specialization: localData.specialization,
      course_type: localData.courseType,
      start_year: Number(localData.startYear) || 0,
      end_year: Number(localData.endYear) || 0,
      grading_system: localData.gradingSystem,
      marks: Number(localData.marks) || 0,
    };

    const save = async () => {
      setLoading(true);
      try {
        const token = getItem(CANDIDATE_ACCESS_TOKEN) || getItem(ACCESS_TOKEN);
        // localData.educationId is set during hydration (see the effect
        // above) and is now the primary source of truth for which record
        // to update. Falls back to the live Redux value for the edge case
        // where hydration hasn't run yet.
        const existingEducationId =
          localData.educationId || getResumeEducation(candidateDetails?.resume_data)?.id;

        const res = existingEducationId
          ? await candidateApi.put(
              `/candidates/update-education/${existingEducationId}`,
              payload,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              },
            )
          : await candidateApi.post(
              `/candidates/add-education`,
              payload,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              },
            );

        const status = res.data.status;
        const message = res.data.message;

        if (status) {
          // If this was a create, capture the new record's id (adjust the
          // path below if your API returns it elsewhere) so a second save
          // in this session updates instead of creating a duplicate.
          const newId = res.data?.data?.id || res.data?.id;
          const resolvedId = existingEducationId || newId || null;

          dispatch(
            candidateUpdateFormData({
              section: "educationDetails",
              updates: { ...localData, educationId: resolvedId },
            }),
          );
          handleNext();
        } else {
          toast.error(message || "An error occurred");
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "An error occurred",
        );
      } finally {
        setLoading(false);
      }
    };
    save();
  };

  const getMarksLabel = () => {
    if (localData.gradingSystem === "CGPA (10-point scale)")
      return "CGPA out of 10*";
    if (localData.gradingSystem === "CGPA (4-point scale)")
      return "CGPA out of 4*";
    if (localData.gradingSystem === "Percentage")
      return "Percentage out of 100*";
    return "Marks / CGPA*";
  };

  return (
    <StepPageLayout
      activeStep={activeStep}
      handleStepClick={handleStepClick}
      minHeight={{ xl: 480, lg: 460, md: 440, sm: "auto", xs: "auto" }}
    >
      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
          Education Details
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: TEXT_MUTED, mt: 0.4, lineHeight: 1.35 }}>
          Add your academic background to complete your profile.
        </Typography>
      </Box>

      {/* Qualification, course details and grading — all in one panel */}
      <SectionPanel icon={SchoolRoundedIcon} title="Qualification & Course Details">
        <Grid container spacing={2}>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              options={educationLevels}
              loading={levelsLoading}
              value={localData.qualification || null}
              onChange={handleAutoCompleteChange("qualification")}
              size="small"
              slotProps={popupSlotProps}
              renderInput={(params) => (
                <TextField {...params} label="Qualification" sx={fieldSx} />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            {/* Free text — whatever the candidate types is saved as-is */}
            <TextField
              fullWidth
              size="small"
              label="University / Institute"
              placeholder="Enter your university or college name"
              value={localData.university || ""}
              onChange={handleChange("university")}
              sx={fieldSx}
            />
          </Grid>

          {/* Course details — same panel */}
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              options={courseOptions}
              loading={coursesLoading}
              disabled={!localData.qualification}
              value={localData.course || null}
              onChange={handleAutoCompleteChange("course")}
              size="small"
              slotProps={popupSlotProps}
              noOptionsText="No courses for this qualification"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Course"
                  helperText={!localData.qualification ? "Select a qualification first" : ""}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              options={specializationOptions}
              loading={specsLoading}
              disabled={!localData.course}
              value={localData.specialization || null}
              onChange={handleAutoCompleteChange("specialization")}
              size="small"
              slotProps={popupSlotProps}
              noOptionsText="No specializations for this course"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Specialization"
                  helperText={!localData.course ? "Select a course first" : ""}
                  sx={fieldSx}
                />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              freeSolo
              options={courseTypes}
              value={localData.courseType || null}
              onChange={handleAutoCompleteChange("courseType")}
              size="small"
              slotProps={popupSlotProps}
              renderInput={(params) => (
                <TextField {...params} label="Course Type" sx={fieldSx} />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              freeSolo
              options={years}
              value={localData.startYear || null}
              onChange={handleAutoCompleteChange("startYear")}
              size="small"
              slotProps={popupSlotProps}
              renderInput={(params) => (
                <TextField {...params} label="Starting Year" sx={fieldSx} />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 4 }}>
            <Autocomplete
              freeSolo
              options={endYearOptions}
              value={localData.endYear || null}
              onChange={handleAutoCompleteChange("endYear")}
              size="small"
              slotProps={popupSlotProps}
              renderInput={(params) => (
                <TextField {...params} label="Ending Year" sx={fieldSx} />
              )}
            />
          </Grid>

          {/* Grading — same panel */}
          <Grid item size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              freeSolo
              options={gradingSystems}
              value={localData.gradingSystem || null}
              onChange={handleAutoCompleteChange("gradingSystem")}
              size="small"
              slotProps={popupSlotProps}
              renderInput={(params) => (
                <TextField {...params} label="Grading System" sx={fieldSx} />
              )}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              label={getMarksLabel()}
              value={localData.marks || ""}
              onChange={handleChange("marks")}
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
            "Save & Next"
          )}
        </Button>
      </Box>
    </StepPageLayout>
  );
};

EducationalPage.propTypes = {
  handleNext: PropTypes.func.isRequired,
  handleBack: PropTypes.func.isRequired,
  activeStep: PropTypes.number.isRequired,
  handleStepClick: PropTypes.func.isRequired,
};

export default EducationalPage;