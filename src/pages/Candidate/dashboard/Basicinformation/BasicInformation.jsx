import React, { useState, useContext, useEffect } from "react";
import Verified from "@mui/icons-material/Verified";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Divider,
  Paper,
} from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import EditIcon from "@mui/icons-material/Edit";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import { AppContext } from "../../../../AppContext";
import {
  useGetCandidateProfileImageQuery,
  useUploadCandidateProfileImageMutation,
  useUpdateCandidateProfileDetailsMutation,
  useGetCandidateSpecificDetailsQuery,
} from "../../../../store/api/settings/CandidatePortalApis";
import { GridCloseIcon } from "@mui/x-data-grid";
import { EmailOutlined } from "@mui/icons-material";
import { palette, fonts } from "../../../../theme/candidateTokens";

// Small reusable row for the info grid
const InfoRow = ({ icon, children, verified }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.4 }}>
    <Box sx={{ color: palette.teal, display: "flex", flexShrink: 0 }}>{icon}</Box>
    <Typography sx={{ fontSize: 13.5, color: palette.ink }}>{children}</Typography>
    {verified && <Verified fontSize="small" sx={{ color: palette.teal, ml: 0.3 }} />}
  </Box>
);

/* Same group heading as the Personal Details dialog */
const GroupHeading = ({ icon: Icon, title }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
    <Icon sx={{ fontSize: 17, color: palette.teal }} />
    <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 14, color: palette.ink }}>
      {title}
    </Typography>
  </Box>
);

const dialogFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: palette.line },
    "&:hover fieldset": { borderColor: palette.teal },
    "&.Mui-focused fieldset": { borderColor: palette.teal },
  },
};

function BasicInformation({ candidateInfo, completeDetailsApi }) {
  const { setFormData } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [updateCandidateProfileDetails] = useUpdateCandidateProfileDetailsMutation();
  const [uploadCandidateProfileImage] = useUploadCandidateProfileImageMutation();
  const candidate = candidateInfo || {};
  const { data: profileImageData, refetch: refetchProfileImage } = useGetCandidateProfileImageQuery(undefined, {
    skip: !candidate,
  });
  const [uploadError, setUploadError] = useState(null);
  const [viewError, setViewError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const {
    data: candidateDetails,
    isLoading,
    refetch,
  } = useGetCandidateSpecificDetailsQuery();

  const getEmployment =
    candidate?.employment?.find((emp) => emp.is_current) ||
    candidate?.employment?.[0] ||
    {};
  console.log("candidateDetails", candidateDetails?.data.employment_id);
  const personal = candidate?.personal_details || {};
  const [basicInfo, setBasicInfo] = useState({
    full_name: candidateInfo?.full_name || "",
    employment_id: getEmployment?.id || "",
    notice_period_days: getEmployment?.notice_period_days || 0,
    company_name: getEmployment?.company_name || "",
    designation: getEmployment?.job_title || "",
    city: personal?.city || "",
    country: personal?.country || "",
    // qualification: getQualification,
    summary:
      candidate?.skill_info?.[0]?.summary || candidate?.profile_summary || "",
    email: candidateDetails?.data?.email_id || "",
    mobile: candidate?.phone_number || "",
    profile_picture: candidate?.profile_image_url || "",
    current_salary: getEmployment?.current_salary || "",
  });

  const MAX_LENGTH = 250;
  const isLongText = basicInfo.summary?.length > MAX_LENGTH;
  const displayText = expanded
    ? basicInfo.summary
    : basicInfo.summary?.slice(0, MAX_LENGTH);

  const lastUpdatedDate = candidate?.updated_at
    ? new Date(candidate.updated_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // const fetchProfileImage = async () => {
  //   try {
  //     if (profileImageData?.success) {
  //       setBasicInfo((prev) => ({
  //         ...prev,
  //         profile_picture: profileImageData.profile_image_url || "",
  //       }));
  //       setViewError(null);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching profile image:", error);
  //     setViewError("Failed to load profile image.");
  //   }
  // };
  useEffect(() => {
    if (profileImageData?.success && profileImageData?.profile_image_url) {
      setBasicInfo((prev) => ({
        ...prev,
        profile_picture: profileImageData.profile_image_url,
      }));
    }
  }, [profileImageData]);
  useEffect(() => {
    if (!candidateDetails?.data) return;

    const data = candidateDetails.data;

    setBasicInfo((prev) => ({
      ...prev,
      full_name: data.full_name,
      employment_id: data.employment_id,
      company_name: data.company_name,
      designation: data.designation,
      notice_period_days: data.notice_period_days,
      city: data.city,
      country: data.country,
      summary: data.summary,
      email: data.email_id,
      mobile: data.phone_number,
    }));
  }, [candidateDetails]);

  const handleChange = (e) => {
    setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        full_name: basicInfo.full_name,
        employment_id: candidateDetails?.data.employment_id,
        notice_period_days: Number(basicInfo.notice_period_days),
        company_name: basicInfo.company_name,
        designation: basicInfo.designation,
        city: basicInfo.city,
        country: basicInfo.country,
        summary: basicInfo.summary,
      };

      const formData = new URLSearchParams();
      Object.keys(payload).forEach((key) => {
        formData.append(key, payload[key] ?? "");
      });

      const response = await updateCandidateProfileDetails(formData).unwrap();

      if (response?.success || response?.status === 200) {
        refetch();
        setOpen(false);
      }
    } catch (error) {
      console.error("Error updating candidate:", error);
    }
  };

  const validateImageFile = (file) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
    const maxSize = 2 * 1024 * 1024;

    if (!file) {
      setUploadError("No file selected.");
      return false;
    }
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only PNG, JPG, JPEG, and GIF files are supported.");
      return false;
    }
    if (file.size > maxSize) {
      setUploadError("File size exceeds 2MB limit.");
      return false;
    }
    setUploadError(null);
    return true;
  };

  const handleImageUpload = async (file) => {
  try {
    const formData = new FormData();
    formData.append("profile_image", file);

    const response = await uploadCandidateProfileImage(formData).unwrap();

    if (response?.success || response?.status === 200) {
      // Fetch latest profile image from API
      const imageResponse = await refetchProfileImage();

      if (
        imageResponse?.data?.success &&
        imageResponse?.data?.profile_image_url
      ) {
        setBasicInfo((prev) => ({
          ...prev,
          profile_picture: imageResponse.data.profile_image_url,
        }));
      }

      setUploadError(null);
      setImageDialogOpen(false);
    }
  } catch (error) {
    console.error("Error uploading profile image:", error);
    setUploadError("Failed to upload profile image. Please try again.");
  }
};

  return (
    <Paper
      elevation={0}
      sx={{ border: `1px solid ${palette.line}`, borderRadius: "14px", overflow: "hidden", bgcolor: palette.paper }}
    >
      {/* signature accent strip */}
      <Box sx={{ height: 6, background: `linear-gradient(90deg, ${palette.teal}, ${palette.tealDeep})` }} />

      <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {/* ── Header row: Avatar | Name/Email/Company | Last Updated ── */}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={basicInfo.profile_picture || "path/to/default-image.png"}
              alt={basicInfo.full_name}
              onClick={() => setImageDialogOpen(true)}
              sx={{
                width: 92,
                height: 92,
                cursor: "pointer",
                bgcolor: palette.tealSoft,
                color: palette.teal,
                fontFamily: fonts.display,
                fontSize: 34,
                fontWeight: 600,
                border: `2px solid ${palette.teal}`,
              }}
            >
              {(basicInfo.full_name?.[0] || "?").toUpperCase()}
            </Avatar>
            <IconButton
              component="label"
              size="small"
              sx={{
                position: "absolute",
                bottom: -2,
                right: -2,
                bgcolor: palette.paper,
                border: `1px solid ${palette.line}`,
                width: 30,
                height: 30,
                "&:hover": { bgcolor: palette.canvas },
              }}
            >
              <AddAPhotoIcon sx={{ fontSize: 15, color: palette.teal }} />
              <input
                type="file"
                hidden
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file && validateImageFile(file)) {
                    const imageUrl = URL.createObjectURL(file);
                    setBasicInfo((prev) => ({
                      ...prev,
                      profile_picture: imageUrl,
                    }));
                    handleImageUpload(file);
                  }
                }}
              />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: { xs: 22, sm: 26 }, color: palette.ink }}
              >
                {basicInfo.full_name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setOpen(true)}
                sx={{ bgcolor: palette.tealDeep, width: 26, height: 26, "&:hover": { bgcolor: palette.teal } }}
              >
                <EditIcon sx={{ fontSize: 13, color: "#fff" }} />
              </IconButton>
            </Box>
            <Typography sx={{ fontSize: 14, color: palette.muted, mt: 0.5 }}>{basicInfo.email}</Typography>
            <Typography sx={{ fontSize: 14, color: palette.muted }}>
              {basicInfo.designation}
              {basicInfo.designation && basicInfo.company_name ? " at " : ""}
              {basicInfo.company_name}
            </Typography>
          </Box>

          <Box sx={{ textAlign: { xs: "left", sm: "right" }, flexShrink: 0 }}>
            <Typography sx={{ fontSize: 11, color: palette.muted, letterSpacing: 0.3 }}>LAST UPDATED</Typography>
            <Typography sx={{ fontFamily: fonts.mono, fontSize: 13, color: palette.ink, mt: 0.25 }}>
              {lastUpdatedDate}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2.5, borderColor: palette.line }} />

        {/* ── Two-column info grid ── */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />}>
              {basicInfo.city}
              {basicInfo.city && basicInfo.country ? ", " : ""}
              {basicInfo.country}
            </InfoRow>
            <InfoRow icon={<WorkOutlineIcon sx={{ fontSize: 18 }} />}>
              <strong>Total Exp:</strong>{" "}
              {candidateDetails?.data?.total_experience
                ?.replace(" years", "y")
                .replace(" months", "m") || "—"}
            </InfoRow>

            <InfoRow icon={<WorkOutlineIcon sx={{ fontSize: 18 }} />}>
              <strong>Relevant Exp:</strong>{" "}
              {candidateDetails?.data?.relevant_experience
                ? `${candidateDetails.data.relevant_experience.years}y ${candidateDetails.data.relevant_experience.months}m`
                : "—"}
            </InfoRow>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <InfoRow icon={<EmailOutlined sx={{ fontSize: 18 }} />} verified>
              {basicInfo.email || "—"}
            </InfoRow>
            <InfoRow icon={<PhoneOutlinedIcon sx={{ fontSize: 18 }} />} verified>
              {basicInfo.mobile || "—"}
            </InfoRow>
            <InfoRow icon={<HourglassEmptyIcon sx={{ fontSize: 18 }} />}>
              {basicInfo.notice_period_days === 0
                ? "Immediately available"
                : `${basicInfo.notice_period_days} Days or less notice period`}
            </InfoRow>
          </Grid>
        </Grid>

        {(uploadError || viewError) && (
          <Typography sx={{ color: palette.coral, fontSize: 13, mt: 1.5 }}>
            {uploadError || viewError}
          </Typography>
        )}

        {/* ── About ── */}
        <Divider sx={{ my: 2.5, borderColor: palette.line }} />
        <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 15, color: palette.ink, mb: 1 }}>
          About
        </Typography>
        <Typography sx={{ fontSize: 14, color: palette.ink, lineHeight: 1.6 }}>
          {displayText}
          {!expanded && isLongText && "..."}
        </Typography>
        {isLongText && (
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              mt: 0.5,
              p: 0,
              minWidth: "unset",
              textTransform: "none",
              fontWeight: 600,
              color: palette.teal,
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
            }}
          >
            {expanded ? "See Less" : "See More..."}
          </Button>
        )}
      </Box>

      {/* ── Edit Dialog — same design as the Personal Details dialog ── */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontFamily: fonts.display, fontWeight: 600, color: palette.ink }}>
          Edit Information
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: palette.teal }}
          >
            <GridCloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* ── Basic Info ─────────────────────────────────────────────── */}
          <GroupHeading icon={BadgeOutlinedIcon} title="Basic Info" />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Full Name"
                name="full_name"
                value={basicInfo.full_name || ""}
                onChange={handleChange}
                sx={dialogFieldSx}
              />
            </Grid>
          </Grid>

          {/* ── Current Role ───────────────────────────────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={WorkOutlineIcon} title="Current Role" />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Company Name"
                  name="company_name"
                  value={basicInfo.company_name || ""}
                  onChange={handleChange}
                  sx={dialogFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Designation"
                  name="designation"
                  value={basicInfo.designation || ""}
                  onChange={handleChange}
                  sx={dialogFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notice Period (Days)"
                  name="notice_period_days"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={basicInfo.notice_period_days ?? ""}
                  onChange={handleChange}
                  helperText="Enter 0 if you can join immediately"
                  sx={dialogFieldSx}
                />
              </Grid>
            </Grid>
          </Box>

          {/* ── Location ───────────────────────────────────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={LocationOnOutlinedIcon} title="Location" />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  name="city"
                  value={basicInfo.city || ""}
                  onChange={handleChange}
                  sx={dialogFieldSx}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Country"
                  name="country"
                  value={basicInfo.country || ""}
                  onChange={handleChange}
                  sx={dialogFieldSx}
                />
              </Grid>
            </Grid>
          </Box>

          {/* ── About ──────────────────────────────────────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={NotesOutlinedIcon} title="About" />
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={4}
              label="Professional Summary"
              name="summary"
              placeholder="A short summary of your experience and strengths"
              value={basicInfo.summary || ""}
              onChange={handleChange}
              sx={dialogFieldSx}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setOpen(false)}
            sx={{ borderColor: palette.line, color: palette.ink, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            sx={{
              bgcolor: palette.teal,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: palette.tealDeep },
            }}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Image Edit Dialog ── */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontFamily: fonts.display, fontWeight: 600, color: palette.ink }}>
          Profile Photo
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" mt={1} mb={2}>
            <Avatar
              sx={{ width: 120, height: 120, border: `2px solid ${palette.teal}` }}
              src={basicInfo.profile_picture || "path/to/default-image.png"}
              alt={basicInfo.full_name}
            />
          </Box>
          <Typography align="center" sx={{ color: palette.muted, fontSize: 13 }} gutterBottom>
            Last updated -{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            component="label"
            sx={{ bgcolor: palette.teal, textTransform: "none", mt: 1, "&:hover": { bgcolor: palette.tealDeep } }}
          >
            Replace Photo
            <input
              type="file"
              hidden
              accept="image/png,image/jpeg,image/jpg,image/gif"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && validateImageFile(file)) {
                  const imageUrl = URL.createObjectURL(file);
                  setBasicInfo((prev) => ({
                    ...prev,
                    profile_picture: imageUrl,
                  }));
                  handleImageUpload(file);
                }
              }}
            />
          </Button>
          <Typography variant="caption" align="center" display="block" sx={{ color: palette.muted, mt: 1 }}>
            Supported file format: png, jpg, jpeg, gif - up to 2MB
          </Typography>
          {uploadError && (
            <Typography sx={{ color: palette.coral, fontSize: 12, mt: 1 }} align="center">
              {uploadError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)} sx={{ color: palette.coral, textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default React.memo(BasicInformation);