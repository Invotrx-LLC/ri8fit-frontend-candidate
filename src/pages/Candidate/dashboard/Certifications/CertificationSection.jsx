import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Grid,
  Divider,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";

import { useDispatch } from "react-redux";
import { format, isValid, parse } from "date-fns";

import candidateApi from "../../../../services/candidateApi";
import { candidateUpdateFormData } from "../../../../store/slices/candidateSlice";
import { palette, fonts } from "../../../../theme/candidateTokens";

import {
  useGetCandidateCertificationsQuery,
} from "../../../../store/api/settings/CandidatePortalApis.js";


const dialogFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: palette.line,
    },
    "&:hover fieldset": {
      borderColor: palette.teal,
    },
    "&.Mui-focused fieldset": {
      borderColor: palette.teal,
    },
  },
};


/* Same group heading as the Personal Details dialog */
const GroupHeading = ({ icon: Icon, title }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
    <Icon sx={{ fontSize: 17, color: palette.teal }} />
    <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 14, color: palette.ink }}>
      {title}
    </Typography>
  </Box>
);

/* API dates may come as "dd/MM/yyyy" or "yyyy-MM-dd" — both become a Date for the picker */
const toPickerDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const ddmmyyyy = parse(value, "dd/MM/yyyy", new Date());
  if (isValid(ddmmyyyy)) return ddmmyyyy;
  const d = new Date(value);
  return isValid(d) ? d : null;
};

const DetailRow = ({ icon, label, value }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      mb: 1.4,
    }}
  >
    <Box
      sx={{
        color: palette.teal,
        display: "flex",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>

    <Typography
      sx={{
        fontSize: 12,
        color: palette.muted,
        width: 140,
        flexShrink: 0,
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        fontSize: 13.5,
        color: palette.ink,
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);


function CertificationSection({
  certificationSelectionInfo,
  onSectionComplete,
}) {
  const dispatch = useDispatch();

  const [certifications, setCertifications] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [certData, setCertData] = useState({
    id: null,
    name: "",
    organization: "",
    issueDate: null,
    expiryDate: null,
    file: null,
  });

  const [errors, setErrors] = useState({});


  // =========================================================
  // GET CERTIFICATIONS
  // =========================================================

  const {
    data: certificationsResponse,
    isLoading: certificationsLoading,
    isError: certificationsIsError,
    error: certificationsApiError,
    refetch: refetchCertifications,
  } = useGetCandidateCertificationsQuery();


  // =========================================================
  // MAP API DATA
  // =========================================================

  useEffect(() => {
    const certificationsData = certificationsResponse?.data || [];

    const mappedCertifications = certificationsData.map((cert) => ({
      id: cert.id,

      name: cert.certifications || "",

      organization: cert.certification_issued_by || "",

      issueDate: cert.certificate_issue_date || "",

      expiryDate: cert.certificate_expire_date || "",

      file: cert.certificate_url
        ? {
            name: cert.certificate_url.split("/").pop(),
            url: cert.certificate_url,
          }
        : null,
    }));

    setCertifications(mappedCertifications);

    dispatch(
      candidateUpdateFormData({
        section: "certifications",
        updates: mappedCertifications,
      })
    );

    if (onSectionComplete) {
      onSectionComplete(
        "certifications",
        mappedCertifications.length > 0
      );
    }
  }, [
    certificationsResponse,
    dispatch,
    onSectionComplete,
  ]);


  // =========================================================
  // API ERROR
  // =========================================================

  useEffect(() => {
    if (certificationsIsError) {
      const message =
        certificationsApiError?.data?.message ||
        certificationsApiError?.error ||
        "Failed to load certifications.";

      setError(message);
    } else {
      setError(null);
    }
  }, [
    certificationsIsError,
    certificationsApiError,
  ]);


  // =========================================================
  // OPEN ADD / EDIT DIALOG
  // =========================================================

  const handleOpen = (cert = null, index = null) => {
    setErrors({});
    setError(null);

    if (cert) {
      setCertData({
        id: cert.id || null,
        name: cert.name || "",
        organization: cert.organization || "",
        issueDate: toPickerDate(cert.issueDate),
        expiryDate: toPickerDate(cert.expiryDate),
        file: cert.file || null,
      });

      setEditingIndex(index);
    } else {
      setCertData({
        id: null,
        name: "",
        organization: "",
        issueDate: null,
        expiryDate: null,
        file: null,
      });

      setEditingIndex(null);
    }

    setOpen(true);
  };


  // =========================================================
  // CLOSE DIALOG
  // =========================================================

  const handleClose = () => {
    if (loading) return;

    setOpen(false);

    setCertData({
      id: null,
      name: "",
      organization: "",
      issueDate: null,
      expiryDate: null,
      file: null,
    });

    setErrors({});
    setEditingIndex(null);
  };


  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const {
      name,
      value,
      files,
    } = e.target;

    if (name === "file") {
      setCertData((prev) => ({
        ...prev,
        file: files?.[0] || null,
      }));
    } else {
      setCertData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear field error while typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };


  // Date pickers hand back a Date (or null when cleared)
  const handleDateChange = (key) => (date) => {
    setCertData((prev) => ({ ...prev, [key]: date }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleRemoveFile = () => {
    setCertData((prev) => ({ ...prev, file: null }));
  };


  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const tempErrors = {};

    if (!certData.name.trim()) {
      tempErrors.name = "Certification Name is required";
    }

    if (!certData.organization.trim()) {
      tempErrors.organization =
        "Issuing Organization is required";
    }

    if (!toPickerDate(certData.issueDate)) {
      tempErrors.issueDate = "Issue Date is required";
    }

    // Optional expiry date validation
    if (
      certData.expiryDate &&
      certData.issueDate &&
      toPickerDate(certData.expiryDate) <
        toPickerDate(certData.issueDate)
    ) {
      tempErrors.expiryDate =
        "Expiry Date cannot be before Issue Date";
    }

    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;
  };


  // =========================================================
  // FORMAT DATE FOR API
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "";

    try {
      const parsedDate = toPickerDate(date);

      if (!parsedDate) {
        return "";
      }

      return format(parsedDate, "dd/MM/yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };


  // =========================================================
  // SAVE / UPDATE CERTIFICATION
  // =========================================================

  const handleSubmit = async () => {
    setErrors({});

    if (!validate()) {
      return;
    }

    const formData = new FormData();

    formData.append(
      "certification_name",
      certData.name.trim()
    );

    formData.append(
      "certification_issued_by",
      certData.organization.trim()
    );

    formData.append(
      "certificate_issue_date",
      formatDate(certData.issueDate)
    );

    // Send expiry date only if selected
    if (certData.expiryDate) {
      formData.append(
        "certificate_expire_date",
        formatDate(certData.expiryDate)
      );
    }

    // Only append a real File object
    if (certData.file instanceof File) {
      formData.append(
        "certificate_file",
        certData.file
      );
    }

    try {
      setLoading(true);

      let response;

      // =====================================================
      // UPDATE
      // =====================================================

      if (
        editingIndex !== null &&
        certData.id
      ) {
        response = await candidateApi.put(
          `/candidates/update-certification/${certData.id}`,
          formData
        );
      }

      // =====================================================
      // ADD
      // =====================================================

      else {
        response = await candidateApi.post(
          "/candidates/add-certification",
          formData
        );
      }

      console.log(
        "Certification API response:",
        response?.data
      );

      // =====================================================
      // REFRESH GET API
      // =====================================================

      await refetchCertifications();

      handleClose();

    } catch (apiError) {
      console.error(
        "Error saving certification:",
        apiError
      );

      const message =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.detail ||
        "Failed to save certification. Please try again.";

      setErrors({
        submit: message,
      });
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // DELETE CERTIFICATION
  // =========================================================

  const handleDelete = async (index) => {
    const certId = certifications[index]?.id;

    if (!certId) {
      setError(
        "Cannot delete certification: Invalid ID."
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await candidateApi.delete(
        `/certifications/${certId}`
      );

      // Refresh data from backend
      await refetchCertifications();

    } catch (apiError) {
      console.error(
        "Error deleting certification:",
        apiError
      );

      const message =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.detail ||
        "Failed to delete certification. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // DISPLAY DATE
  // =========================================================

  const displayDate = (date) => {
    if (!date) return "";

    try {
      const parsedDate = toPickerDate(date);

      if (!parsedDate) {
        return date;
      }

      return format(
        parsedDate,
        "MMM dd, yyyy"
      );
    } catch {
      return date;
    }
  };


  // =========================================================
  // LOADING STATE
  // =========================================================

  const isLoading =
    loading || certificationsLoading;


  // =========================================================
  // UI
  // =========================================================

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: palette.paper,
        border: `1px solid ${palette.line}`,
        borderRadius: "14px",
        p: {
          xs: 2.5,
          sm: 3,
        },
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1.5}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
          }}
        >
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
            <WorkspacePremiumOutlinedIcon
              sx={{ fontSize: 18 }}
            />
          </Box>

          <Typography
            sx={{
              fontFamily: fonts.display,
              fontWeight: 600,
              fontSize: 17,
              color: palette.ink,
            }}
          >
            Certifications
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: palette.teal,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              bgcolor: palette.tealDeep,
            },
          }}
          onClick={() => handleOpen()}
          disabled={isLoading}
        >
          {certifications.length > 0
            ? "Add Another Certification"
            : "+ Add Certification"}
        </Button>
      </Box>


      {/* =====================================================
          LOADING
      ====================================================== */}

      {isLoading && (
        <Typography
          sx={{
            color: palette.muted,
            fontSize: 13.5,
            mt: 2,
          }}
        >
          Loading...
        </Typography>
      )}


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <Typography
          sx={{
            color: palette.coral,
            fontSize: 13.5,
            mt: 2,
          }}
        >
          {error}
        </Typography>
      )}


      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {certifications.length === 0 &&
      !isLoading ? (
        <Box
          textAlign="center"
          sx={{
            mt: 3,
            mb: 1,
          }}
        >
          <Typography
            sx={{
              color: palette.muted,
              fontSize: 13.5,
            }}
          >
            No certifications added yet.
          </Typography>

          <Button
            variant="text"
            sx={{
              color: palette.teal,
              textTransform: "none",
              fontWeight: 600,
              mt: 0.5,
            }}
            onClick={() => handleOpen()}
          >
            Add your first certification
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2.5 }}>
          {certifications.map(
            (cert, index) => (
              <Box
                key={
                  cert.id ||
                  `certification-${index}`
                }
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  py: 1.75,
                  borderBottom:
                    index <
                    certifications.length - 1
                      ? `1px solid ${palette.line}`
                      : "none",
                }}
              >
                {/* =========================================
                    CERTIFICATION DETAILS
                ========================================== */}

                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily:
                        fonts.display,
                      fontWeight: 600,
                      fontSize: 14.5,
                      color: palette.ink,
                      mb: 1,
                    }}
                  >
                    {cert.name || "—"}
                  </Typography>

                  <DetailRow
                    icon={
                      <ApartmentOutlinedIcon
                        sx={{ fontSize: 18 }}
                      />
                    }
                    label="Issued By"
                    value={
                      cert.organization
                    }
                  />

                  <DetailRow
                    icon={
                      <EventOutlinedIcon
                        sx={{ fontSize: 18 }}
                      />
                    }
                    label="Issue Date"
                    value={displayDate(
                      cert.issueDate
                    )}
                  />

                  {cert.expiryDate && (
                    <DetailRow
                      icon={
                        <EventOutlinedIcon
                          sx={{ fontSize: 18 }}
                        />
                      }
                      label="Expiry Date"
                      value={displayDate(
                        cert.expiryDate
                      )}
                    />
                  )}

                  {cert.file && (
                    <DetailRow
                      icon={
                        <InsertDriveFileOutlinedIcon
                          sx={{ fontSize: 18 }}
                        />
                      }
                      label="File"
                      value={
                        cert.file.name
                      }
                    />
                  )}
                </Box>


                {/* =========================================
                    ACTION BUTTONS
                ========================================== */}

                <Box
                  sx={{
                    display: "flex",
                    flexShrink: 0,
                  }}
                >
                  <IconButton
                    onClick={() =>
                      handleOpen(
                        cert,
                        index
                      )
                    }
                    aria-label="Edit certification"
                    disabled={isLoading}
                    sx={{
                      color: palette.teal,
                    }}
                  >
                    <EditIcon
                      sx={{
                        fontSize: 19,
                      }}
                    />
                  </IconButton>

                  <IconButton
                    onClick={() =>
                      handleDelete(index)
                    }
                    aria-label="Delete certification"
                    disabled={isLoading}
                    sx={{
                      color: palette.coral,
                    }}
                  >
                    <DeleteOutlineIcon
                      sx={{
                        fontSize: 19,
                      }}
                    />
                  </IconButton>
                </Box>
              </Box>
            )
          )}
        </Box>
      )}


      {/* =====================================================
          ADD / EDIT DIALOG
      ====================================================== */}

      <Dialog
        open={open}
        onClose={
          loading
            ? undefined
            : handleClose
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: fonts.display,
            fontWeight: 600,
            color: palette.ink,
          }}
        >
          {editingIndex !== null
            ? "Edit Certification"
            : "Add Certification"}

          <IconButton
            onClick={handleClose}
            disabled={loading}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: palette.teal,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>


        <DialogContent dividers>
          {/* SUBMIT ERROR */}
          {errors.submit && (
            <Typography sx={{ color: palette.coral, mb: 2 }} variant="body2">
              {errors.submit}
            </Typography>
          )}

          {/* ── Certificate Details ─────────────────────────────────────── */}
          <GroupHeading icon={WorkspacePremiumOutlinedIcon} title="Certificate Details" />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Certification Name"
                name="name"
                value={certData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
                sx={dialogFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Issuing Organization"
                name="organization"
                value={certData.organization}
                onChange={handleChange}
                error={!!errors.organization}
                helperText={errors.organization}
                required
                sx={dialogFieldSx}
              />
            </Grid>
          </Grid>

          {/* ── Validity ─────────────────────────────────────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={EventOutlinedIcon} title="Validity" />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Issue Date *"
                    value={certData.issueDate}
                    onChange={handleDateChange("issueDate")}
                    format="dd/MM/yyyy"
                    disableFuture
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        error: !!errors.issueDate,
                        helperText: errors.issueDate,
                        sx: dialogFieldSx,
                      },
                      popper: { sx: { zIndex: 1300 } },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Expiry Date"
                    value={certData.expiryDate}
                    onChange={handleDateChange("expiryDate")}
                    format="dd/MM/yyyy"
                    minDate={certData.issueDate || undefined}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        error: !!errors.expiryDate,
                        helperText: errors.expiryDate || "Leave empty if it doesn't expire",
                        sx: dialogFieldSx,
                      },
                      field: { clearable: true },
                      popper: { sx: { zIndex: 1300 } },
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Box>

          {/* ── Certificate File ─────────────────────────────────────────── */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: palette.line }} />
            <GroupHeading icon={InsertDriveFileOutlinedIcon} title="Certificate File" />

            {certData.file ? (
              /* Selected / existing file */
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  border: `1px solid ${palette.line}`,
                  borderRadius: "10px",
                  px: 1.5,
                  py: 1.1,
                  bgcolor: palette.tealSoft,
                }}
              >
                <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: palette.teal }} />
                <Typography
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13.5,
                    color: palette.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={certData.file.name}
                >
                  {certData.file.name}
                </Typography>
                <Button
                  component="label"
                  size="small"
                  disabled={loading}
                  sx={{ textTransform: "none", fontWeight: 600, color: palette.teal, minWidth: 0 }}
                >
                  Replace
                  <input type="file" name="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={handleChange} />
                </Button>
                <IconButton
                  size="small"
                  onClick={handleRemoveFile}
                  disabled={loading}
                  aria-label="Remove file"
                  sx={{ color: palette.muted }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ) : (
              /* Upload area */
              <Box
                component="label"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                  border: `1.5px dashed ${palette.line}`,
                  borderRadius: "10px",
                  py: 2.5,
                  px: 2,
                  cursor: loading ? "default" : "pointer",
                  transition: "all .15s ease",
                  "&:hover": loading
                    ? {}
                    : { borderColor: palette.teal, bgcolor: palette.tealSoft },
                }}
              >
                <UploadFileOutlinedIcon sx={{ fontSize: 26, color: palette.teal }} />
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: palette.ink }}>
                  Click to upload certificate
                </Typography>
                <Typography sx={{ fontSize: 12, color: palette.muted }}>
                  PDF, PNG or JPG
                </Typography>
                <input
                  type="file"
                  name="file"
                  hidden
                  disabled={loading}
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleChange}
                />
              </Box>
            )}
          </Box>
        </DialogContent>


        {/* ===================================================
            DIALOG ACTIONS
        ==================================================== */}

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderColor:
                palette.line,
              color: palette.ink,
              textTransform:
                "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{
              bgcolor: palette.teal,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                bgcolor:
                  palette.tealDeep,
              },
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editingIndex !== null
              ? "Update"
              : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}


export default React.memo(
  CertificationSection
);