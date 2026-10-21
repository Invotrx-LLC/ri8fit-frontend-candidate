import React, { useCallback, useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Grid,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import candidateApi from "../../../../services/candidateApi";
import { CANDIDATE_ACCESS_TOKEN, ACCESS_TOKEN, getItem } from "../../../../utils/helper.js";
import {
  useAddCandidateEducationMutation,
  useDeleteCandidateEducationMutation,
  useGetCandidateEducationQuery,
  useUpdateCandidateEducationMutation,
} from "../../../../store/api/settings/CandidatePortalApis";
import { palette, fonts } from "../../../../theme/candidateTokens";

const dialogFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: palette.line },
    "&:hover fieldset": { borderColor: palette.teal },
    "&.Mui-focused fieldset": { borderColor: palette.teal },
  },
};

/* Same group heading as the Personal Details / Certification dialogs */
const GroupHeading = ({ icon: Icon, title }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
    <Icon sx={{ fontSize: 17, color: palette.teal }} />
    <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 14, color: palette.ink }}>
      {title}
    </Typography>
  </Box>
);

/* ── Dropdown APIs ───────────────────────────────────────────────────────────
   Education Level → Course → Specialization:
   GET /dropdown/education-levels
   GET /dropdown/courses?education_level=…
   GET /dropdown/specializations?education_level=…&course=…               */
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

/* Fetches a dropdown list; returns [] on failure so the dialog never breaks */
const fetchOptions = async (url, params) => {
  try {
    const res = await candidateApi.get(url, { params, headers: authHeaders() });
    return toStringList(res);
  } catch (error) {
    console.error(`Dropdown API failed: ${url}`, error);
    return [];
  }
};

const courseTypeOptions = ["Full Time", "Part Time", "Distance Learning"];

const yearOptions = Array.from({ length: 50 }, (_, i) =>
  (new Date().getFullYear() - i).toString(),
);

const gradingSystemOptions = [
  "Percentage",
  "CGPA Scale of 10",
  "CGPA Scale of 4",
  "GPA",
];

const EducationPage = ({
  educationSelectionInfo,
  handleNext = () => {},
  onEducationChange,
  completeDetailsApi,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [educationHistory, setEducationHistory] = useState([]);
  const [educationLevel, setEducationLevel] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [courseType, setCourseType] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [gradingSystem, setGradingSystem] = useState("");
  const [marks, setMarks] = useState("");
  const [error, setError] = useState("");
  const [addCandidateEducation] = useAddCandidateEducationMutation();
  const [updateCandidateEducation] = useUpdateCandidateEducationMutation();
  const [deleteCandidateEducation] = useDeleteCandidateEducationMutation();

  // Cascading dropdown options
  const [educationLevelOptions, setEducationLevelOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [specsLoading, setSpecsLoading] = useState(false);

  // Auto-fetches on mount (unless educationSelectionInfo was already passed
  // in) and, because getCandidateEducation provides the "CandidateEducation"
  // tag and add/update/delete all invalidate it (see CandidatePortalApis.js),
  // this automatically refetches after every save or delete — no manual
  // trigger calls needed.
  const { data: candidateEducationData } = useGetCandidateEducationQuery(
    undefined,
    { skip: !!educationSelectionInfo },
  );

  const endYearOptions = startYear
    ? yearOptions.filter((y) => parseInt(y) >= parseInt(startYear))
    : yearOptions;

  //=========================== Load initial education history from educationSelectionInfo======================//
  // education_level is now kept exactly as the API returns it — the old
  // front-end mapping ("Graduation" → "Graduation/Diploma") no longer
  // matches the /dropdown/education-levels values.
  useEffect(() => {
    const educationData = Array.isArray(educationSelectionInfo?.education)
      ? educationSelectionInfo.education
      : [];
    setEducationHistory(educationData);
    if (onEducationChange) onEducationChange(educationData);
  }, [educationSelectionInfo, onEducationChange]);

  useEffect(() => {
    if (educationSelectionInfo) return;

    // GET /candidates/get-education returns
    const sourceEducation = Array.isArray(candidateEducationData?.data)
      ? candidateEducationData.data
      : Array.isArray(candidateEducationData)
        ? candidateEducationData
        : [];

    setEducationHistory(sourceEducation);
    if (onEducationChange) onEducationChange(sourceEducation);
  }, [educationSelectionInfo, candidateEducationData, onEducationChange]);

  // Populate form fields when opening dialog
  useEffect(() => {
    if (!openDialog) return;

    let educationData = {
      education_level: "",
      university: "",
      course: "",
      specialization: "",
      course_type: "",
      start_year: "",
      end_year: "",
      grading_system: "",
      marks: "",
    };

    if (editingIndex !== null && educationHistory[editingIndex]) {
      educationData = educationHistory[editingIndex];
    }

    setEducationLevel(educationData.education_level || "");
    setUniversity(educationData.university || "");
    setCourse(educationData.course || "");
    setSpecialization(educationData.specialization || "");
    setCourseType(educationData.course_type || "");
    setStartYear(educationData.start_year?.toString() || "");
    setEndYear(educationData.end_year?.toString() || "");
    setGradingSystem(educationData.grading_system || "");
    setMarks(educationData.marks?.toString() || "");
  }, [openDialog, editingIndex, educationHistory]);

  // 1. Education levels — loaded the first time the dialog opens
  useEffect(() => {
    if (!openDialog || educationLevelOptions.length) return;
    let active = true;
    setLevelsLoading(true);
    fetchOptions("/dropdown/education-levels").then((list) => {
      if (!active) return;
      setEducationLevelOptions(list);
      setLevelsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [openDialog, educationLevelOptions.length]);

  // 2. Courses — reload whenever the education level changes
  useEffect(() => {
    if (!openDialog || !educationLevel) {
      setCourseOptions([]);
      return;
    }
    let active = true;
    setCoursesLoading(true);
    fetchOptions("/dropdown/courses", { education_level: educationLevel }).then((list) => {
      if (!active) return;
      setCourseOptions(list);
      setCoursesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [openDialog, educationLevel]);

  // 3. Specializations — reload whenever education level or course changes
  useEffect(() => {
    if (!openDialog || !educationLevel || !course) {
      setSpecializationOptions([]);
      return;
    }
    let active = true;
    setSpecsLoading(true);
    fetchOptions("/dropdown/specializations", {
      education_level: educationLevel,
      course,
    }).then((list) => {
      if (!active) return;
      setSpecializationOptions(list);
      setSpecsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [openDialog, educationLevel, course]);

  // A new parent selection makes the child values invalid — clear them
  const handleEducationLevelChange = (_e, value) => {
    const next = value || "";
    if (next !== educationLevel) {
      setCourse("");
      setSpecialization("");
    }
    setEducationLevel(next);
  };

  const handleCourseChange = (_e, value) => {
    const next = value || "";
    if (next !== course) setSpecialization("");
    setCourse(next);
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!educationLevel) errors.educationLevel = "Education level is required";
    if (!university) errors.university = "University is required";
    if (!course) errors.course = "Course is required";
    if (!startYear) errors.startYear = "Start year is required";
    if (!endYear) errors.endYear = "End year is required";
    if (marks && isNaN(parseFloat(marks))) {
      errors.marks = "Marks must be a valid number";
    } else if (marks) {
      const marksValue = parseFloat(marks);
      if (gradingSystem === "Percentage" && marksValue > 100) {
        errors.marks = "Percentage cannot exceed 100";
      } else if (gradingSystem === "CGPA Scale of 10" && marksValue > 10) {
        errors.marks = "CGPA cannot exceed 10";
      } else if (gradingSystem === "CGPA Scale of 4" && marksValue > 4) {
        errors.marks = "CGPA cannot exceed 4";
      }
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSaveEducation = async () => {
    const { isValid, errors } = validateForm();
    if (!isValid) {
      setError(Object.values(errors).join(", "));
      return;
    }

    const educationPayload = {
      education_level: educationLevel,
      university,
      course,
      specialization: specialization || null,
      course_type: courseType || null,
      start_year: parseInt(startYear),
      end_year: parseInt(endYear),
      grading_system: gradingSystem || null,
      marks: marks ? parseFloat(marks) : null,
    };

    try {
      if (editingIndex !== null) {
        const eduId = educationHistory[editingIndex].id;
        await updateCandidateEducation({
          id: eduId,
          body: educationPayload,
        }).unwrap();
      } else {
        await addCandidateEducation(educationPayload).unwrap();
      }

      setError("");
      setEditingIndex(null);
      setOpenDialog(false);
      handleNext();
    } catch (err) {
      setError(
        err?.data?.message || err?.message || "Error saving education record.",
      );
      console.error("Save Error:", err);
    }
  };

  const handleDelete = useCallback(
    async (edu) => {
      try {
        await deleteCandidateEducation(edu?.id).unwrap();
        setEducationHistory((prev) => prev.filter((e) => e.id !== edu.id));
        await completeDetailsApi();
      } catch (err) {
        setError(
          err?.data?.message ||
            err?.message ||
            "Failed to delete education record.",
        );
        console.error("Delete Error:", err);
      }
    },
    [completeDetailsApi],
  );

  const handleEdit = (index) => {
    setEditingIndex(index);
    setOpenDialog(true);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setOpenDialog(false);
    setError("");
  };

  const marksLabel =
    gradingSystem === "Percentage"
      ? "Percentage out of 100"
      : gradingSystem === "CGPA Scale of 10"
        ? "CGPA out of 10"
        : gradingSystem === "CGPA Scale of 4"
          ? "CGPA out of 4"
          : "Marks";

  const marksHint =
    gradingSystem === "Percentage"
      ? "e.g., 85.5"
      : gradingSystem === "CGPA Scale of 10"
        ? "e.g., 8.5"
        : gradingSystem === "CGPA Scale of 4"
          ? "e.g., 3.5"
          : gradingSystem
            ? "Enter marks"
            : "Select a grading system first";

  const renderEducationEntry = (edu, index) => (
    <Box
      key={edu.id || index}
      sx={{
        mt: 2,
        p: 2.25,
        position: "relative",
        border: `1px solid ${palette.line}`,
        borderRadius: "10px",
        "&:hover": { borderColor: palette.teal },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          gap: 0.5,
        }}
      >
        <IconButton
          size="small"
          sx={{ color: palette.teal }}
          onClick={() => handleEdit(index)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ color: palette.coral }}
          onClick={() => handleDelete(edu)}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography
        sx={{
          fontSize: { xs: 13, sm: 15 },
          fontWeight: 600,
          color: palette.ink,
        }}
      >
        {edu.education_level || edu.course || "Education"}
      </Typography>
      <Typography
        sx={{
          color: palette.teal,
          fontSize: { xs: 12.5, sm: 14 },
          fontWeight: 500,
        }}
      >
        {edu.university || "N/A"}
      </Typography>
      <Typography sx={{ color: palette.muted, fontSize: { xs: 12, sm: 13.5 } }}>
        {edu.course || "N/A"} {edu.specialization && `in ${edu.specialization}`}
      </Typography>
      <Typography
        sx={{
          color: palette.muted,
          fontFamily: fonts.mono,
          fontSize: { xs: 11.5, sm: 13 },
        }}
      >
        {edu.start_year} - {edu.end_year || "N/A"}
      </Typography>
      {edu.course_type && (
        <Typography
          sx={{ color: palette.muted, fontSize: { xs: 12, sm: 13.5 } }}
        >
          Course Type: {edu.course_type}
        </Typography>
      )}
      {edu.marks !== null && edu.marks !== undefined && (
        <Typography
          sx={{ color: palette.muted, fontSize: { xs: 12, sm: 13.5 } }}
        >
          Marks: {edu.marks} {edu.grading_system && `(${edu.grading_system})`}
        </Typography>
      )}
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: palette.paper,
        border: `1px solid ${palette.line}`,
        borderRadius: "14px",
        p: { xs: 2.5, sm: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
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
            <SchoolOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            sx={{
              fontFamily: fonts.display,
              fontWeight: 600,
              fontSize: 17,
              color: palette.ink,
            }}
          >
            Education
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: palette.teal,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: palette.tealDeep },
          }}
          onClick={() => setOpenDialog(true)}
        >
          + Add Education
        </Button>
      </Box>

      {error && !openDialog && (
        <Typography sx={{ color: palette.coral, fontSize: 13, mt: 1.5 }}>
          {error}
        </Typography>
      )}

      {educationHistory.length > 0 ? (
        educationHistory.map((edu, index) => renderEducationEntry(edu, index))
      ) : (
        <Typography sx={{ color: palette.muted, fontSize: 13.5, mt: 2 }}>
          No education details available.
        </Typography>
      )}

      {/* ══════════════════════ Add / Edit dialog ══════════════════════ */}
      <Dialog
        open={openDialog}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle
          sx={{
            fontFamily: fonts.display,
            fontWeight: 600,
            color: palette.ink,
          }}
        >
          {editingIndex !== null ? "Edit Education" : "Add Education"}
          <IconButton
            onClick={handleCancel}
            sx={{ position: "absolute", right: 8, top: 8, color: palette.teal }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Typography sx={{ color: palette.coral, mb: 2 }} variant="body2">
              {error}
            </Typography>
          )}

          {/* ── Qualification ──────────────────────────────────────────── */}
          <GroupHeading icon={SchoolOutlinedIcon} title="Qualification" />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                options={educationLevelOptions}
                loading={levelsLoading}
                value={educationLevel || null}
                onChange={handleEducationLevelChange}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Education Level"
                    sx={dialogFieldSx}
                    error={error.includes("Education")}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="University / Institute"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                sx={dialogFieldSx}
                error={error.includes("University")}
              />
            </Grid>
          </Grid>

          {/* ── Course Details ─────────────────────────────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={MenuBookOutlinedIcon} title="Course Details" />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={courseOptions}
                  loading={coursesLoading}
                  disabled={!educationLevel}
                  value={course || null}
                  onChange={handleCourseChange}
                  size="small"
                  noOptionsText="No courses for this education level"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Course"
                      sx={dialogFieldSx}
                      error={error.includes("Course is")}
                      helperText={!educationLevel ? "Select an education level first" : ""}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={specializationOptions}
                  loading={specsLoading}
                  disabled={!course}
                  value={specialization || null}
                  onChange={(_e, v) => setSpecialization(v || "")}
                  size="small"
                  noOptionsText="No specializations for this course"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Specialization"
                      sx={dialogFieldSx}
                      helperText={!course ? "Select a course first" : ""}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Autocomplete
                  options={courseTypeOptions}
                  value={courseType || null}
                  onChange={(_e, v) => setCourseType(v || "")}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="Course Type" sx={dialogFieldSx} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Autocomplete
                  options={yearOptions}
                  value={startYear || null}
                  onChange={(e, newValue) => {
                    setStartYear(newValue || "");
                    // if the current end year is now before the new start year, reset it
                    if (
                      newValue &&
                      endYear &&
                      parseInt(endYear) < parseInt(newValue)
                    ) {
                      setEndYear("");
                    }
                  }}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Start Year"
                      sx={dialogFieldSx}
                      error={error.includes("Start")}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Autocomplete
                  options={endYearOptions}
                  value={endYear || null}
                  onChange={(e, newValue) => setEndYear(newValue || "")}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="End Year"
                      sx={dialogFieldSx}
                      error={error.includes("End")}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          {/* ── Grading ─────────────────────────────────────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={BarChartOutlinedIcon} title="Grading" />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={gradingSystemOptions}
                  value={gradingSystem || null}
                  onChange={(e, newValue) => {
                    setGradingSystem(newValue || "");
                    setMarks("");
                  }}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="Grading System" sx={dialogFieldSx} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={marksLabel}
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  disabled={!gradingSystem}
                  sx={dialogFieldSx}
                  error={error.includes("Marks") || error.includes("cannot exceed")}
                  helperText={marksHint}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            sx={{
              borderColor: palette.line,
              color: palette.ink,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEducation}
            variant="contained"
            sx={{
              bgcolor: palette.teal,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: palette.tealDeep },
            }}
          >
            {editingIndex !== null ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default React.memo(EducationPage);