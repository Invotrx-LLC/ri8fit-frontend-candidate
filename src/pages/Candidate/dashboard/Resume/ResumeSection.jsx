import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useDispatch } from "react-redux";
import { format, isValid } from "date-fns";
import { toast } from "react-toastify";
import {
  useGetCandidateResumeQuery,
  useReplaceCandidateResumeMutation,
} from "../../../../store/api/settings/CandidatePortalApis";
import { candidateUpdateFormData } from "../../../../store/slices/candidateSlice";

const ACCENT = "#2B6F71";
const ACCENT_HOVER = "#1F5557";
const ACCENT_TINT = "#EAF5F4";
const LINE = "#E5E7EB";
const MUTED = "#6B7280";
const INK = "#1F2937";

const ACCEPTED = ".pdf,.png,.jpg,.jpeg";

/* Small square icon button used for download / delete */
const ActionButton = ({ title, onClick, disabled, color, hoverBg, children }) => (
  <Tooltip title={title} arrow>
    <span>
      <IconButton
        size="small"
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: 34,
          height: 34,
          borderRadius: "9px",
          border: `1px solid ${LINE}`,
          bgcolor: "#fff",
          color,
          "&:hover": { bgcolor: hoverBg, borderColor: color },
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

function ResumeSection({ resumeInfo, onSectionComplete }) {
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [pendingFile, setPendingFile] = useState(null); // file waiting for "Replace" confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);
  const { data: resumeData } = useGetCandidateResumeQuery();
  const [uploadResume, { isLoading: isUploading }] = useReplaceCandidateResumeMutation();
  const isBusy = isUploading;

  // Extract resume info
  const resumeUrl = resumeData?.resume_url || resumeData?.data?.resume_url;
  const resumeFileName = resumeUrl
    ? decodeURIComponent(resumeUrl.split("?")[0].split("/").pop())
    : "";
  const hasResume = !!resumeFileName;
  const fileExt = resumeFileName.split(".").pop()?.toUpperCase() || "";

  const uploadedRaw = resumeInfo?.uploaded_at || null;
  const uploadedDate = uploadedRaw && isValid(new Date(uploadedRaw)) ? new Date(uploadedRaw) : null;

  // Tell the Profile Completion sidebar whether a resume is uploaded
  useEffect(() => {
    if (resumeData === undefined) return; // still loading
    onSectionComplete?.("resume", hasResume);
  }, [hasResume, resumeData, onSectionComplete]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  /* Uploads the picked file — the resume query refetches via invalidatesTags */
  const saveResume = useCallback(
    async (file) => {
      setError("");
      try {
        const fd = new FormData();
        fd.append("file", file);
        const response = await uploadResume(fd).unwrap();

        if (response?.success !== false) {
          toast.success(response?.message || "Resume updated successfully");
          dispatch(
            candidateUpdateFormData({
              section: "resume",
              updates: { fileName: file.name, uploadedDate: new Date().toISOString() },
            }),
          );
        } else {
          toast.error(response?.message || "Resume upload failed");
        }
      } catch (err) {
        console.error("Resume upload error:", err);
        toast.error(err?.data?.detail?.[0]?.msg || "Something went wrong. Please try again.");
      }
    },
    [dispatch, uploadResume],
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      // reset so selecting the same file again still fires onChange
      e.target.value = "";
      if (!file) return;

      if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
        setError("Please select a PDF or image file");
        return;
      }
      // A resume already exists → ask before overwriting it
      if (hasResume) setPendingFile(file);
      else saveResume(file);
    },
    [hasResume, saveResume],
  );

  const handleConfirmReplace = () => {
    if (pendingFile) saveResume(pendingFile);
    setPendingFile(null);
  };

  const handleDelete = useCallback(() => {
    dispatch(candidateUpdateFormData({ section: "resume", updates: null }));
    setConfirmDelete(false);
  }, [dispatch]);

  const handleDownload = useCallback(() => {
    if (!resumeUrl) {
      setError("Resume link not found. Please refresh and try again.");
      return;
    }
    window.open(resumeUrl, "_blank", "noopener");
  }, [resumeUrl]);

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        borderRadius: 2,
        p: 2,
        mb: 2,
        boxShadow: 1,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} fontSize={18} sx={{ mb: 1.75 }}>
        Resume
      </Typography>

      {hasResume ? (
        /* ── Resume already uploaded: file card + small Replace ─────────────── */
        <Box sx={{ border: `1px solid ${LINE}`, borderRadius: "12px", overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: { xs: 1.5, sm: 2 } }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "10px",
                bgcolor: ACCENT_TINT,
                color: ACCENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DescriptionOutlinedIcon />
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Tooltip title={resumeFileName} arrow placement="top-start">
                <Typography
                  onClick={handleDownload}
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: INK,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    "&:hover": { color: ACCENT, textDecoration: "underline" },
                  }}
                >
                  {resumeFileName}
                </Typography>
              </Tooltip>
              <Typography sx={{ fontSize: 12, color: MUTED, mt: 0.25 }}>
                {[fileExt, uploadedDate && `Uploaded on ${format(uploadedDate, "dd MMM yyyy")}`]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <ActionButton title="Download" onClick={handleDownload} color={ACCENT} hoverBg={ACCENT_TINT}>
                <FileDownloadOutlinedIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                title="Delete"
                onClick={() => setConfirmDelete(true)}
                color="#DC2626"
                hoverBg="#FEF2F2"
              >
                <DeleteOutlineIcon fontSize="small" />
              </ActionButton>
            </Box>
          </Box>

          {/* Replace strip with overwrite warning */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
              px: { xs: 1.5, sm: 2 },
              py: 1,
              bgcolor: "#FFFBEB",
              borderTop: "1px solid #FDE68A",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: "#B45309", flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12.5, color: "#92400E" }}>
                Uploading a new resume will replace the current one.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={
                isBusy ? (
                  <CircularProgress size={14} sx={{ color: ACCENT }} />
                ) : (
                  <AutorenewRoundedIcon sx={{ fontSize: 16 }} />
                )
              }
              onClick={openPicker}
              disabled={isBusy}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                borderRadius: "8px",
                color: ACCENT,
                borderColor: ACCENT,
                bgcolor: "#fff",
                px: 1.5,
                "&:hover": { bgcolor: ACCENT_TINT, borderColor: ACCENT_HOVER },
              }}
            >
              {isUploading ? "Uploading..." : "Replace"}
            </Button>
          </Box>
        </Box>
      ) : (
        /* ── No resume yet: dashed upload area ──────────────────────────────── */
        <Box
          onClick={isBusy ? undefined : openPicker}
          sx={{
            opacity: isBusy ? 0.6 : 1,
            pointerEvents: isBusy ? "none" : "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            py: { xs: 3, sm: 3.5 },
            px: 2,
            border: "1.5px dashed #D1D5DB",
            borderRadius: "12px",
            bgcolor: "#FAFAFA",
            cursor: "pointer",
            transition: "all .2s ease",
            "&:hover": { borderColor: ACCENT, bgcolor: "#F4FBFB" },
          }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 34, color: ACCENT }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: INK }}>
            Upload your resume
          </Typography>
          <Button
            size="small"
            variant="contained"
            disableElevation
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "999px",
              bgcolor: ACCENT,
              px: 2.5,
              "&:hover": { bgcolor: ACCENT_HOVER },
            }}
          >
            {isUploading ? "Uploading..." : "Browse file"}
          </Button>
          <Typography sx={{ fontSize: 11.5, color: MUTED }}>PDF, PNG, JPG</Typography>
        </Box>
      )}

      <input ref={inputRef} type="file" hidden accept={ACCEPTED} onChange={handleFileChange} />

      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
          {error}
        </Typography>
      )}

      {/* Confirm replace */}
      <Dialog
        open={!!pendingFile}
        onClose={() => setPendingFile(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: INK, pb: 1 }}>Replace resume?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: MUTED }}>
            <Box component="span" sx={{ color: INK, fontWeight: 600 }}>
              {resumeFileName}
            </Box>{" "}
            will be replaced with{" "}
            <Box component="span" sx={{ color: INK, fontWeight: 600 }}>
              {pendingFile?.name}
            </Box>
            . The current resume will be overwritten.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPendingFile(null)}
            variant="outlined"
            sx={{ textTransform: "none", borderColor: LINE, color: INK }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReplace}
            variant="contained"
            disableElevation
            sx={{ textTransform: "none", fontWeight: 600, bgcolor: ACCENT, "&:hover": { bgcolor: ACCENT_HOVER } }}
          >
            Replace
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: INK, pb: 1 }}>Delete resume?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: MUTED }}>
            <Box component="span" sx={{ color: INK, fontWeight: 600 }}>
              {resumeFileName}
            </Box>{" "}
            will be removed from your profile.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDelete(false)}
            variant="outlined"
            sx={{ textTransform: "none", borderColor: LINE, color: INK }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disableElevation
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default React.memo(ResumeSection);