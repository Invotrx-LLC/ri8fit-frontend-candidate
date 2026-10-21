import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AppContext } from "../../../../AppContext";
import candidateApi from "../../../../services/candidateApi";
import {
  useGetCandidateKeySkillsQuery,
} from "../../../../store/api/settings/CandidatePortalApis";
import { palette, fonts } from "../../../../theme/candidateTokens";

const ACCENT = "#2B6F71";
const ACCENT_HOVER = "#1F5557";

const dialogFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: palette.line },
    "&:hover fieldset": { borderColor: palette.teal },
    "&.Mui-focused fieldset": { borderColor: palette.teal },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: palette.teal },
};

/* Same small heading used in the Personal Details dialog */
const GroupHeading = ({ icon: Icon, title }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
    <Icon sx={{ fontSize: 17, color: palette.teal }} />
    <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 14, color: palette.ink }}>
      {title}
    </Typography>
  </Box>
);

function SkillsSection({ keySkillInfo, completeDetailsApi }) {
  const { formData = {}, setFormData } = useContext(AppContext);
  const [skills, setSkills] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSkill, setCurrentSkill] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

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
    "Mapping/conversion",
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

  const {
    data: keySkillsResponse,
    isLoading,
    refetch,
  } = useGetCandidateKeySkillsQuery();
  const skillId = keySkillsResponse?.data?.candidate_id;

  // Initialize skills from keySkillInfo or formData.itSkills
  useEffect(() => {
    if (!keySkillsResponse?.data) return;

    const initialSkills =
      keySkillsResponse.data.key_skills
        ?.split(",")
        .map((skill) => skill.trim()) || [];

    setSkills(initialSkills);

    setFormData((prev) => ({
      ...prev,
      itSkills: initialSkills,
    }));
  }, [keySkillsResponse, setFormData]);

  const handleAddClick = () => {
    setCurrentSkill("");
    setEditIndex(null);
    setSuggestions(getSuggestions("", false));
    setOpenDialog(true);
    setError(null);
  };

  const handleEditClick = (index) => {
    setCurrentSkill(skills[index]);
    setEditIndex(index);
    setSuggestions(availableSkills);
    setOpenDialog(true);
    setError(null);
  };

  const handleDeleteClick = async (index) => {
    const skillToDelete = skills[index];
    try {
      const response = await candidateApi.delete(
        `/candidates/delete-skill/${skillId}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          data: new URLSearchParams({
            skill_to_delete: skillToDelete,
          }),
        }
      );

      if (response.status === 200) {
        const updatedSkills = skills.filter((_, i) => i !== index);
        setSkills(updatedSkills);
        setFormData((prev) => ({ ...prev, itSkills: updatedSkills }));
        refetch();
      }
    } catch (err) {
      setError("Failed to delete skill. Please try again.");
      console.error("Delete skill error:", err);
    }
  };

  const handleSave = async () => {
    if (currentSkill.trim() === "") return;

    let updatedSkills = [...skills];
    if (editIndex !== null) {
      updatedSkills[editIndex] = currentSkill.trim();
    } else {
      const newSkills = currentSkill
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill && !updatedSkills.includes(skill));
      updatedSkills = [...updatedSkills, ...newSkills];
    }

    const skillsString = updatedSkills.join(", ");
    try {
      const response = await candidateApi.put(
        `/candidates/update-skill-info/${skillId}`,
        {
          summary: keySkillInfo?.skill_info[0]?.summary || "",
          availability: keySkillInfo?.skill_info[0]?.availability || 0,
          ta_experience_combined:
            keySkillInfo?.skill_info[0]?.ta_experience_combined || "",
          key_skills: skillsString,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setSkills(updatedSkills);
        setFormData((prev) => ({ ...prev, itSkills: updatedSkills }));
        setOpenDialog(false);
        setCurrentSkill("");
        setEditIndex(null);
        setSuggestions([]);
        setError(null);
        completeDetailsApi();
      }
    } catch (err) {
      setError("Failed to save skills. Please try again.");
      console.error("Save skill error:", err);
    }
  };

  // Suggestions that aren't already typed in the box or saved on the profile
  const getSuggestions = (input, editing = editIndex !== null) => {
    const parts = input.split(",").map((skill) => skill.trim().toLowerCase());
    const lastSkill = parts[parts.length - 1] || "";
    const taken = new Set([
      ...parts.slice(0, -1).filter(Boolean),
      ...(editing ? [] : skills.map((skill) => skill.toLowerCase())),
    ]);
    return availableSkills.filter(
      (skill) =>
        !taken.has(skill.toLowerCase()) &&
        (!lastSkill || skill.toLowerCase().includes(lastSkill))
    );
  };

  const handleInputChange = (e) => {
    const input = e.target.value;
    setCurrentSkill(input);
    setSuggestions(getSuggestions(input));
  };

  // Skills typed so far in "Add" mode, shown as removable chips
  const pendingSkills = [
    ...new Set(
      currentSkill
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    ),
  ];

  const handleRemovePending = (skillToRemove) => {
    const remaining = pendingSkills.filter((skill) => skill !== skillToRemove);
    const next = remaining.length ? remaining.join(", ") + ", " : "";
    setCurrentSkill(next);
    setSuggestions(getSuggestions(next));
  };

  const handleSuggestionClick = (suggestion) => {
    if (editIndex !== null) {
      // Edit mode holds one skill — pick it and close the list
      setCurrentSkill(suggestion);
      setSuggestions([]);
      return;
    }
    // Add mode: keep the list open so more skills can be picked
    const skillsArray = currentSkill.split(",").map((skill) => skill.trim());
    skillsArray[skillsArray.length - 1] = suggestion;
    const next = skillsArray.filter(Boolean).join(", ") + ", ";
    setCurrentSkill(next);
    setSuggestions(getSuggestions(next));
  };

  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: 2, p: 2, mb: 2, boxShadow: 1 }}>
      <Box display="flex" alignItems="center" gap={0.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          Key Skills
        </Typography>
        <IconButton
          size="small"
          onClick={handleAddClick}
          sx={{
            bgcolor: ACCENT,
            color: "#fff",
            borderRadius: "6px",
            width: 26,
            height: 26,
            "&:hover": { bgcolor: ACCENT_HOVER },
          }}
        >
          <EditIcon sx={{ fontSize: "15px" }} />
        </IconButton>
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Box mt={{ xs: 1, sm: 1.5, md: 2 }} display="flex" gap={1} flexWrap="wrap">
        {skills.length > 0 ? (
          skills.map((skill, index) => (
            <Chip
              key={index}
              onClick={() => handleEditClick(index)}
              label={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{ fontSize: { xs: 10, sm: 12, md: 14 }, ml: 0.2 }}
                  >
                    {skill}
                  </Typography>

                  <DeleteOutlineIcon
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent edit click
                      handleDeleteClick(index);
                    }}
                    sx={{
                      fontSize: 16,
                      color: "#EF4444",
                      cursor: "pointer",
                      opacity: 0,
                      transform: "scale(0.8)",
                      transition: "all .2s ease",
                      ".MuiChip-root:hover &": {
                        opacity: 1,
                        transform: "scale(1)",
                      },
                      "&:hover": {
                        color: "#DC2626",
                      },
                    }}
                  />
                </Box>
              }
              sx={{
                bgcolor: "#fff",
                border: "1px solid #D1D5DB",
                color: "#374151",
                height: 34,
                "&:hover": {
                  borderColor: ACCENT,
                },
              }}
            />
          ))
        ) : (
          <Typography color="text.secondary">No skills available</Typography>
        )}
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontFamily: fonts.display, fontWeight: 600, color: palette.ink }}>
          {editIndex !== null ? "Edit Skill" : "Add Skills"}
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: palette.teal }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Typography sx={{ color: palette.coral, mb: 1.5, display: "block" }} variant="caption">
              {error}
            </Typography>
          )}

          <GroupHeading icon={PsychologyOutlinedIcon} title="Key Skills" />

          <TextField
            fullWidth
            size="small"
            label={editIndex !== null ? "Skill" : "Skills (comma-separated)"}
            value={currentSkill}
            onChange={handleInputChange}
            autoFocus
            helperText={
              editIndex === null ? "Enter multiple skills separated by commas" : ""
            }
            FormHelperTextProps={{ sx: { color: palette.muted, ml: 0 } }}
            sx={dialogFieldSx}
          />

          {/* Skills being added — click X to remove before saving */}
          {editIndex === null && pendingSkills.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
              {pendingSkills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  onDelete={() => handleRemovePending(skill)}
                  sx={{
                    bgcolor: palette.tealSoft,
                    color: palette.teal,
                    fontWeight: 600,
                    fontSize: 12.5,
                    "& .MuiChip-deleteIcon": {
                      color: palette.teal,
                      "&:hover": { color: palette.tealDeep },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 12.5, color: palette.muted, mb: 0.75 }}>
                Suggestions
              </Typography>
              <Box
                sx={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: `1px solid ${palette.line}`,
                  borderRadius: "10px",
                }}
              >
                <List dense disablePadding>
                  {suggestions.map((suggestion, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        py: 0.6,
                        "&:hover": { bgcolor: palette.tealSoft },
                      }}
                    >
                      <ListItemText
                        primary={suggestion}
                        primaryTypographyProps={{ fontSize: 13.5, color: palette.ink }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{ borderColor: palette.line, color: palette.ink, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              bgcolor: palette.teal,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: palette.tealDeep },
            }}
          >
            {editIndex !== null ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default React.memo(SkillsSection);