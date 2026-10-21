import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Skeleton,
  Autocomplete,
  TextField,
} from "@mui/material";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { toast } from "react-toastify";
import { useGetMatchedJobsByCountryQuery } from "../../../services/candidateJobsApi.js"; // adjust path to wherever you place the api slice
import JobDetails from "./JobDetails.jsx";
import ThankYou from "./ThankYou.jsx";

/* ── Design tokens — same system used across the other candidate pages ── */
const INK = "#1F2937";
const TEXT_MUTED = "#6B7280";
const PRIMARY = "#2B6F71";
const PRIMARY_DARK = "#1E4F50";
const PRIMARY_TINT = "#EAF5F4";
const SURFACE = "#F8FAF9";
const BORDER = "#E1E5E7";
const WARN = "#B7791F";
const WARN_TINT = "#FBF3E4";

const FONT_DISPLAY = "'Georgia', 'Times New Roman', serif";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    background: "#fff",
    fontSize: "14px",
    "& fieldset": { borderColor: BORDER },
    "&:hover fieldset": { borderColor: PRIMARY },
    "&.Mui-focused fieldset": { borderColor: PRIMARY, borderWidth: "1.5px" },
  },
  "& .MuiInputLabel-root": { fontSize: "13.5px", color: TEXT_MUTED },
  "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY },
};

// Global country filter options. Values sent to the API are lowercased by
// the api slice itself, so display labels here can stay properly cased.
const COUNTRY_OPTIONS = [
  "India",
  "US",
  // "UK",
  // "Canada",
  // "Australia",
  // "Germany",
  // "France",
  // "Singapore",
];

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

// const scoreTier = (score) => {
//   if (score >= 30) return { label: "SkillIntel Score", color: PRIMARY_DARK, bg: PRIMARY_TINT, border: PRIMARY };
//   if (score > 0) return { label: "Possible Match", color: WARN, bg: WARN_TINT, border: "#E4C588" };
//   return { label: "Low Match", color: TEXT_MUTED, bg: "#F3F4F6", border: BORDER };
// };

/* ── Single job card ─────────────────────────────────────────────────── */
const JobCard = ({ job, applied, onApply, onViewJob }) => {
  // const tier = scoreTier(job.skillintel_score);
  const location = [job.city, job.country].filter(Boolean).join(", ");

  return (
    <Box
      sx={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        p: 2.25,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        transition: "border-color .15s ease, box-shadow .15s ease",
        "&:hover": { borderColor: PRIMARY, boxShadow: "0 6px 18px rgba(31,41,55,0.07)" },
      }}
    >
      {/* Top row: title + match badge */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography
            onClick={() => onViewJob(job)}
            sx={{
              fontFamily: "sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.3,
              cursor: "pointer",
              "&:hover": { color: PRIMARY_DARK, textDecoration: "underline" },
            }}
          >
            {job.job_title}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED, mt: 0.25 }}>
            {job.job_position_id}
          </Typography>
        </Box>
        {/* <Chip
          label={`${tier.label} · ${Math.round(job.skillintel_score)}%`}
          size="small"
          sx={{
            height: 24,
            fontSize: 11,
            fontWeight: 700,
            color: tier.color,
            bgcolor: tier.bg,
            border: `1px solid ${tier.border}`,
            flexShrink: 0,
          }}
        /> */}
      </Box>

      {/* Organisation */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <BusinessRoundedIcon sx={{ fontSize: 16, color: PRIMARY }} />
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: PRIMARY_DARK }}>
          {job.organisation?.organisation_name || "—"}
        </Typography>
        {job.organisation?.industry && (
          <Typography sx={{ fontSize: 12, color: TEXT_MUTED }}>· {job.organisation.industry}</Typography>
        )}
      </Box>

      {/* Location */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <PlaceRoundedIcon sx={{ fontSize: 16, color: TEXT_MUTED }} />
        <Typography sx={{ fontSize: 12.5, color: TEXT_MUTED }}>
          {location || "Location not specified"}
        </Typography>
      </Box>

      {/* Meta chips: type, mode, experience, priority */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.25 }}>
        {job.job_type && (
          <Chip label={job.job_type} size="small" sx={{ height: 22, fontSize: 11, bgcolor: SURFACE, border: `1px solid ${BORDER}`, color: INK }} />
        )}
        {job.mode_of_work && (
          <Chip label={job.mode_of_work} size="small" sx={{ height: 22, fontSize: 11, bgcolor: SURFACE, border: `1px solid ${BORDER}`, color: INK }} />
        )}
        {(job.min_years || job.max_years) && (
          <Chip
            label={`${job.min_years ?? 0}–${job.max_years ?? "?"} yrs`}
            size="small"
            sx={{ height: 22, fontSize: 11, bgcolor: SURFACE, border: `1px solid ${BORDER}`, color: INK }}
          />
        )}
        {job.priority && (
          <Chip
            label={job.priority}
            size="small"
            sx={{ height: 22, fontSize: 11, bgcolor: "#FDEDEC", border: "1px solid #F3C9C4", color: "#B0433C", fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Footer: closing date + view job + apply */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.75, pt: 1.25, borderTop: `1px solid ${BORDER}`, gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <EventRoundedIcon sx={{ fontSize: 15, color: TEXT_MUTED }} />
          <Typography sx={{ fontSize: 11.5, color: TEXT_MUTED }}>
            Closes {formatDate(job.closing_date)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            onClick={() => onViewJob(job)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              borderRadius: "9px",
              px: 1.75,
              py: 0.6,
              color: applied ? PRIMARY_DARK : "#fff",
              bgcolor: applied ? PRIMARY_TINT : PRIMARY,
              border: applied ? `1px solid ${PRIMARY}` : "none",
              "&:hover": { bgcolor: applied ? PRIMARY_TINT : PRIMARY_DARK },
              "&.Mui-disabled": { color: PRIMARY_DARK, bgcolor: PRIMARY_TINT },
            }}
          >
            View Job
          </Button>

          {/* <Button
            onClick={() => onApply(job)}
            disabled={applied}
            startIcon={applied ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : null}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: 12.5,
              borderRadius: "9px",
              px: 2,
              py: 0.6,
              minWidth: 96,
              color: applied ? PRIMARY_DARK : "#fff",
              bgcolor: applied ? PRIMARY_TINT : PRIMARY,
              border: applied ? `1px solid ${PRIMARY}` : "none",
              "&:hover": { bgcolor: applied ? PRIMARY_TINT : PRIMARY_DARK },
              "&.Mui-disabled": { color: PRIMARY_DARK, bgcolor: PRIMARY_TINT },
            }}
          >
            {applied ? "Applied" : "Apply"}
          </Button> */}
        </Box>
      </Box>
    </Box>
  );
};

const CandidateRequisitions = () => {
  const [country, setCountry] = useState("India");
  // Local, in-session record of which job_ids the candidate has clicked
  // Apply on — swap for a real "apply" mutation + appliedJobIds from the
  // API response once that endpoint exists.
  const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());

  // view: "list" | "details" | "thankyou"
  const [view, setView] = useState("list");
  const [selectedJob, setSelectedJob] = useState(null);

  // const { data, isLoading, isFetching, isError, error, refetch } =
  //   useGetMatchedJobsByCountryQuery({ country, minScore: 0 });
  const { data, isLoading, isFetching, isError, error, refetch } =
  useGetMatchedJobsByCountryQuery({ country });

  const jobs = useMemo(() => data?.data?.jobs || [], [data]);

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setView("details");
  };

  const handleApply = (job) => {
    setAppliedJobIds((prev) => new Set(prev).add(job.job_id));
    toast.success(`Applied — status changed for "${job.job_title}"`);
    setSelectedJob(job);
    setView("thankyou");
  };

  const handleBackToList = () => {
    setSelectedJob(null);
    setView("list");
  };

  // ── Job details view ────────────────────────────────────────────────
  if (view === "details" && selectedJob) {
    return (
      <JobDetails
        job={selectedJob}
        applied={appliedJobIds.has(selectedJob.job_id)}
        onBack={handleBackToList}
        onApply={handleApply}
      />
    );
  }

  // ── Thank you view ──────────────────────────────────────────────────
  if (view === "thankyou" && selectedJob) {
    return <ThankYou job={selectedJob} onBackToList={handleBackToList} />;
  }

  // ── Job list view ───────────────────────────────────────────────────
  return (
    <Box
      sx={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        p: { xs: 2.5, sm: 3 },
      }}
    >
      {/* ── Header + country filter ───────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          mb: 2.5,
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
              bgcolor: PRIMARY_TINT,
              color: PRIMARY_DARK,
            }}
          >
            <PublicRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: INK, lineHeight: 1.2 }}>
              Jobs to apply
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: TEXT_MUTED, mt: 0.25 }}>
              {isFetching ? "Refreshing…" : `${jobs.length} open role${jobs.length === 1 ? "" : "s"} in ${country}`}
            </Typography>
          </Box>
        </Box>

        {/* Global country filter — changing this re-queries the API with the new country */}
        <Autocomplete
          disableClearable
          options={COUNTRY_OPTIONS}
          value={country}
          onChange={(_e, value) => value && setCountry(value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 220 } }}
          renderInput={(params) => (
            <TextField {...params} label="Country" sx={fieldSx} />
          )}
        />
      </Box>

      {/* ── Loading state ──────────────────────────────────────────────── */}
      {isLoading && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 1.5 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={190} sx={{ borderRadius: "14px" }} />
          ))}
        </Box>
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {isError && !isLoading && (
        <Box sx={{ border: `1px solid ${WARN_TINT}`, background: WARN_TINT, borderRadius: "10px", p: 2 }}>
          <Typography sx={{ fontSize: 13.5, color: WARN, fontWeight: 600 }}>
            Couldn't load matched requisitions.
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: TEXT_MUTED, mt: 0.5 }}>
            {error?.data?.message || error?.error || "Please try again."}
          </Typography>
          <Button onClick={() => refetch()} size="small" sx={{ mt: 1, textTransform: "none", fontWeight: 600, color: PRIMARY_DARK }}>
            Retry
          </Button>
        </Box>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {!isLoading && !isError && jobs.length === 0 && (
        <Typography sx={{ fontSize: 13.5, color: TEXT_MUTED }}>
          No open requisitions found for {country} right now.
        </Typography>
      )}

      {/* ── Job cards ──────────────────────────────────────────────────── */}
      {!isLoading && !isError && jobs.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 1.5 }}>
          {jobs.map((job) => (
            <JobCard
              key={job.job_id}
              job={job}
              applied={appliedJobIds.has(job.job_id)}
              onApply={handleApply}
              onViewJob={handleViewJob}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CandidateRequisitions;