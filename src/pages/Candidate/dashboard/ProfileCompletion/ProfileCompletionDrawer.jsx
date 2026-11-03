import React, { useState } from "react";
import { Box, Typography, Drawer, IconButton, Collapse, ButtonBase, Divider, LinearProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import { palette, fonts } from "../../../../theme/candidateTokens";
import CompletionRing from "./CompletionRing";
import { StatusChip, BoostItem } from "./ProfileCompletionCard";
import { styleForStatus, barColor, fmt } from "./profileCompletionConfig";

const SectionHeading = ({ children }) => (
  <Typography
    sx={{ fontSize: 11.5, fontWeight: 700, color: palette.muted, letterSpacing: 0.6, textTransform: "uppercase", mb: 1.25 }}
  >
    {children}
  </Typography>
);

/* One section row: name · "score of max_score" · bar. Click to see its details. */
function SectionRow({ section }) {
  const [open, setOpen] = useState(false);
  const pct = Number(section.percentage) || 0;
  const fields = Array.isArray(section.fields) ? section.fields : [];

  return (
    <Box sx={{ borderBottom: `1px solid ${palette.line}`, "&:last-of-type": { borderBottom: "none" } }}>
      <ButtonBase
        onClick={() => fields.length && setOpen((o) => !o)}
        disabled={!fields.length}
        sx={{ width: "100%", display: "block", textAlign: "left", py: 1.25 }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: palette.ink }}>
            {section.section}
          </Typography>
          <Typography sx={{ fontFamily: fonts.mono, fontSize: 12, color: palette.muted, whiteSpace: "nowrap" }}>
            {fmt(section.score)} of {fmt(section.max_score)}
          </Typography>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: palette.ink, width: 44, textAlign: "right" }}>
            {Math.round(pct)}%
          </Typography>
          {fields.length > 0 && (
            <ExpandMoreRoundedIcon
              sx={{
                fontSize: 18,
                color: palette.muted,
                transition: "transform .2s ease",
                transform: open ? "rotate(180deg)" : "none",
              }}
            />
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, pct)}
          sx={{
            mt: 0.75,
            height: 7,
            borderRadius: 999,
            bgcolor: "#EEF1F6",
            "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: barColor(pct), transition: "transform 600ms ease" },
          }}
        />
      </ButtonBase>

      {/* Details inside the section */}
      <Collapse in={open}>
        <Box sx={{ pb: 1.25, pl: 0.5, display: "flex", flexDirection: "column", gap: 0.6 }}>
          {fields.map((f) => (
            <Box key={f.field_key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {f.filled ? (
                <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#16A34A" }} />
              ) : (
                <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: palette.muted }} />
              )}
              <Typography sx={{ flex: 1, fontSize: 12.5, color: f.filled ? palette.ink : palette.muted }}>
                {f.label}
              </Typography>
              <Typography sx={{ fontFamily: fonts.mono, fontSize: 11.5, color: palette.muted }}>
                {fmt(f.score)} / {fmt(f.max_score)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Full Profile Completion breakdown in a right-side drawer:
 * score + status, all sections with bars (expandable), and every missing detail.
 */
function ProfileCompletionDrawer({ open, onClose, completion, onBoostClick }) {
  const percent = Number(completion?.completion_percentage) || 0;
  const status = completion?.status;
  const style = styleForStatus(status, percent);
  const sections = Array.isArray(completion?.sections) ? completion.sections : [];
  const missing = Array.isArray(completion?.missing_fields) ? completion.missing_fields : [];
  const totalGain = missing.reduce((sum, m) => sum + (Number(m.gain_percentage) || 0), 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 440 }, bgcolor: palette.paper } }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 1.5 }}>
        <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 19, color: palette.ink }}>
          Profile completion
        </Typography>
        <IconButton onClick={onClose} sx={{ color: palette.teal }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pb: 3, overflowY: "auto" }}>
        {/* Score */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            p: 2,
            borderRadius: "14px",
            border: `1px solid ${palette.line}`,
            bgcolor: palette.canvas,
          }}
        >
          <CompletionRing percent={percent} color={style.ring} size={112} stroke={10} label="Profile complete" />
          <Box sx={{ minWidth: 0 }}>
            <StatusChip status={status || "Needs attention"} percent={percent} />
            <Typography sx={{ fontSize: 13, color: palette.muted, mt: 1, lineHeight: 1.5 }}>
              {missing.length === 0
                ? "Everything recruiters look for is on your profile."
                : `Add the ${missing.length} missing detail${missing.length > 1 ? "s" : ""} below to gain up to +${fmt(
                    Math.min(totalGain, 100 - percent)
                  )}%.`}
            </Typography>
          </Box>
        </Box>

        {/* Boost list */}
        <Box sx={{ mt: 3 }}>
          <SectionHeading>Boost your profile</SectionHeading>
          {missing.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.5,
                borderRadius: "10px",
                bgcolor: palette.tealSoft,
                color: palette.teal,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <CelebrationOutlinedIcon sx={{ fontSize: 18 }} />
              Your profile is complete!
            </Box>
          ) : (
            <>
              <Typography sx={{ fontSize: 12, color: palette.muted, mt: -0.5, mb: 1.25 }}>
                Recruiters filter on these. Most valuable first.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {missing.map((item) => (
                  <BoostItem key={item.field_key} item={item} onClick={onBoostClick} />
                ))}
              </Box>
            </>
          )}
        </Box>

        <Divider sx={{ my: 3, borderColor: palette.line }} />

        {/* Sections */}
        <SectionHeading>Completion by section</SectionHeading>
        <Box>
          {sections.map((s) => (
            <SectionRow key={s.section} section={s} />
          ))}
        </Box>
      </Box>
    </Drawer>
  );
}

export default React.memo(ProfileCompletionDrawer);