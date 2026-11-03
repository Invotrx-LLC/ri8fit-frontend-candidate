import React, { useState } from "react";
import { Box, Typography, IconButton, Tooltip, Collapse, ButtonBase, LinearProgress } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CelebrationIcon from "@mui/icons-material/Celebration";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { styled } from "@mui/system";
import { palette, fonts } from "../../../../theme/candidateTokens";

const StyledSidebar = styled(Box)(({ theme }) => ({
  backgroundColor: palette.paper,
  borderRadius: 14,
  border: `1px solid ${palette.line}`,
  padding: theme.spacing(2.5),
  position: "sticky",
  top: 80,
  maxWidth: 320,
  [theme.breakpoints.down("sm")]: {
    position: "static",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    maxWidth: "100%",
  },
}));

const SECTION_ICONS = {
  resume: DescriptionOutlinedIcon,
  skills: BoltOutlinedIcon,
  employment: WorkOutlineOutlinedIcon,
  education: SchoolOutlinedIcon,
  certifications: WorkspacePremiumOutlinedIcon,
  personal: BadgeOutlinedIcon,
};

const SECTION_TOOLTIPS = {
  resume: "Upload your resume to make your profile complete.",
  personal: "Add your personal and contact details.",
  employment: "List your work history to showcase your expertise.",
  education: "Include your academic background.",
  skills: "Add relevant skills to stand out to recruiters.",
  certifications: "Add certifications to boost credibility.",
};

// Section ids that should never appear in the list, regardless of what the parent passes in
const EXCLUDED_SECTION_IDS = ["profileimage", "profile_image", "profile-image"];

const norm = (s = "") => String(s).toLowerCase().replace(/\s+/g, "");
const displayLabel = (id, label) =>
  norm(id).includes("employ") || norm(label).includes("employ") || norm(id).includes("experien")
    ? "Employment History"
    : label;

function Sidebar({ sections, scrollToSection, activeSection, apiPercentage, completionCard }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const visibleSections = (sections || []).filter(
    (section) => !EXCLUDED_SECTION_IDS.includes(norm(section.id))
  );
  const doneCount = visibleSections.filter((s) => s.completed).length;
  const total = visibleSections.length;

  // API percentage when the backend sends it, otherwise worked out from the sections
  const percent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Number.isFinite(Number(apiPercentage)) && apiPercentage !== null
          ? Number(apiPercentage)
          : total
            ? (doneCount / total) * 100
            : 0
      )
    )
  );
  const isComplete = percent >= 100;

  return (
    <StyledSidebar>
      {/* ── Top: Profile Completion card from the API (falls back to the
             simple % + bar when the card isn't passed in) ─────────────── */}
      {completionCard ? (
        <Box sx={{ pb: 2, mb: 0.5, borderBottom: `1px solid ${palette.line}` }}>{completionCard}</Box>
      ) : (
        <>
        {/* ── Header ─────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Box>
            <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: { xs: 16, sm: 17 }, color: palette.ink }}>
              Profile Completion
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: palette.muted, mt: 0.25 }}>
              {isComplete ? "Great job! Your profile is complete." : "Complete your profile to get noticed by recruiters."}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setIsCollapsed((c) => !c)}
            sx={{ display: { xs: "inline-flex", sm: "none" }, color: palette.teal }}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>

        {/* ── Progress ───────────────────────────────────────────── */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 24, color: isComplete ? palette.teal : palette.ink, lineHeight: 1 }}>
              {percent}%
            </Typography>
            <Typography sx={{ fontSize: 12, color: palette.muted }}>
              {doneCount} of {total} sections done
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: palette.line,
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: isComplete ? palette.teal : palette.amber,
                transition: "transform 600ms ease",
              },
            }}
          />
          {isComplete && (
            <Box
              sx={{
                mt: 1.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                bgcolor: palette.tealSoft,
                color: palette.teal,
                borderRadius: "999px",
                px: 1.5,
                py: 0.5,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <CelebrationIcon sx={{ fontSize: 16 }} />
              Profile Complete!
            </Box>
          )}
        </Box>
        </>
      )}

      {/* Section nav title + mobile collapse */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: palette.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>
          Profile sections
        </Typography>
        {completionCard && (
          <IconButton
            size="small"
            onClick={() => setIsCollapsed((c) => !c)}
            sx={{ display: { xs: "inline-flex", sm: "none" }, color: palette.teal }}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        )}
      </Box>

      {/* ── Sections ───────────────────────────────────────────── */}
      <Collapse in={!isCollapsed}>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {visibleSections.map((section, index) => {
            const label = displayLabel(section.id, section.label);
            const Icon = SECTION_ICONS[section.id] || BadgeOutlinedIcon;
            const isActive = activeSection === section.id;
            const done = !!section.completed;
            const missing = Array.isArray(section.missing) ? section.missing : [];
            const tooltip = done
              ? `${label} added`
              : missing.length
                ? (
                    <Box>
                      <Box sx={{ fontWeight: 700, mb: 0.5 }}>Still to fill:</Box>
                      {missing.map((m) => (
                        <Box key={m} sx={{ fontSize: 12, lineHeight: 1.6 }}>• {m}</Box>
                      ))}
                    </Box>
                  )
                : SECTION_TOOLTIPS[section.id] || `Complete the ${label} section`;

            return (
              <Tooltip
                key={section.id || index}
                title={tooltip}
                placement="right"
                arrow
              >
                <ButtonBase
                  onClick={() => scrollToSection(section.id)}
                  aria-label={`Go to ${label}`}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    textAlign: "left",
                    borderRadius: "10px",
                    px: 1.25,
                    py: 1,
                    border: `1px solid ${isActive ? palette.teal : "transparent"}`,
                    bgcolor: isActive ? palette.tealSoft : "transparent",
                    transition: "background-color .15s ease, border-color .15s ease",
                    "&:hover": { bgcolor: isActive ? palette.tealSoft : palette.canvas },
                  }}
                >
                  {/* Icon — teal when done */}
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      bgcolor: done ? palette.teal : palette.canvas,
                      color: done ? "#fff" : palette.muted,
                      border: done ? "none" : `1px solid ${palette.line}`,
                    }}
                  >
                    {done ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : <Icon sx={{ fontSize: 17 }} />}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? palette.teal : palette.ink,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {label}
                    </Typography>
                    {/* Partly filled section: how many required fields are left */}
                    {!done && missing.length > 0 && (
                      <Typography sx={{ fontSize: 11.5, color: palette.amber, fontWeight: 600, lineHeight: 1.3 }}>
                        {missing.length} field{missing.length > 1 ? "s" : ""} left
                      </Typography>
                    )}
                  </Box>

                  {/* Status pill */}
                  {done ? (
                    <Box
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: palette.teal,
                        bgcolor: palette.tealSoft,
                        borderRadius: "999px",
                        px: 1,
                        py: 0.25,
                        flexShrink: 0,
                      }}
                    >
                      Done
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: palette.amber,
                        flexShrink: 0,
                      }}
                    >
                      Add
                      <ChevronRightRoundedIcon sx={{ fontSize: 16 }} />
                    </Box>
                  )}
                </ButtonBase>
              </Tooltip>
            );
          })}
        </Box>
      </Collapse>
    </StyledSidebar>
  );
}

export default React.memo(Sidebar); 