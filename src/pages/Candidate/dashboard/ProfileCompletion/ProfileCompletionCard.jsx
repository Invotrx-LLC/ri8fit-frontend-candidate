import React from "react";
import { Box, Typography, ButtonBase, Skeleton } from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import { palette, fonts } from "../../../../theme/candidateTokens";
import CompletionRing from "./CompletionRing";
import { styleForStatus, fmt } from "./profileCompletionConfig";

/* Small status pill: Excellent / Good / Average / Needs attention */
export const StatusChip = ({ status, percent }) => {
  const s = styleForStatus(status, percent);
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11.5,
        fontWeight: 700,
        color: s.color,
        bgcolor: s.bg,
        borderRadius: "999px",
        px: 1.1,
        py: 0.35,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </Box>
  );
};

/* One "boost" row — label, hint and the +gain */
export const BoostItem = ({ item, onClick, dense = false }) => (
  <ButtonBase
    onClick={() => onClick?.(item)}
    sx={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 1,
      textAlign: "left",
      border: `1px solid ${palette.line}`,
      borderRadius: "10px",
      px: 1.25,
      py: dense ? 0.9 : 1.2,
      bgcolor: palette.paper,
      transition: "border-color .15s ease, background-color .15s ease",
      "&:hover": { borderColor: palette.teal, bgcolor: palette.tealSoft },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: palette.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.label}
      </Typography>
      {!dense && item.hint && (
        <Typography sx={{ fontSize: 11.5, color: palette.muted, mt: 0.25, lineHeight: 1.35 }}>{item.hint}</Typography>
      )}
    </Box>
    <Box
      sx={{
        fontSize: 11.5,
        fontWeight: 800,
        color: "#15803D",
        bgcolor: "#E7F7EC",
        borderRadius: "999px",
        px: 0.9,
        py: 0.3,
        flexShrink: 0,
      }}
    >
      +{fmt(item.gain_percentage)}%
    </Box>
  </ButtonBase>
);

/**
 * Compact Profile Completion card for the sidebar.
 * Ring + status, the top 3 missing details, and a link to the full breakdown.
 */
function ProfileCompletionCard({ completion, isLoading, onOpenBreakdown, onBoostClick }) {
  if (isLoading && !completion) {
    return (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Skeleton variant="circular" width={88} height={88} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="70%" />
            <Skeleton width="40%" />
          </Box>
        </Box>
        <Skeleton variant="rounded" height={40} sx={{ mt: 2, borderRadius: "10px" }} />
        <Skeleton variant="rounded" height={40} sx={{ mt: 1, borderRadius: "10px" }} />
      </Box>
    );
  }
  if (!completion) return null;

  const percent = Number(completion.completion_percentage) || 0;
  const status = completion.status;
  const style = styleForStatus(status, percent);
  const missing = Array.isArray(completion.missing_fields) ? completion.missing_fields : [];
  const top = missing.slice(0, 3);

  return (
    <Box>
      {/* Ring + status */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <CompletionRing percent={percent} color={style.ring} size={88} stroke={8} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 16, color: palette.ink, lineHeight: 1.25 }}>
            Profile completion
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <StatusChip status={status || "Needs attention"} percent={percent} />
          </Box>
        </Box>
      </Box>

      {/* Top missing details */}
      {missing.length === 0 ? (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.25,
            borderRadius: "10px",
            bgcolor: palette.tealSoft,
            color: palette.teal,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CelebrationOutlinedIcon sx={{ fontSize: 18 }} />
          Your profile is complete!
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography
            sx={{ fontSize: 11, fontWeight: 700, color: palette.muted, letterSpacing: 0.6, textTransform: "uppercase", mb: 1 }}
          >
            Boost your profile
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {top.map((item) => (
              <BoostItem key={item.field_key} item={item} onClick={onBoostClick} dense />
            ))}
          </Box>
        </Box>
      )}

      {/* Full breakdown */}
      <ButtonBase
        onClick={onOpenBreakdown}
        sx={{
          mt: 1.5,
          width: "100%",
          justifyContent: "space-between",
          borderRadius: "8px",
          px: 1,
          py: 0.75,
          fontSize: 13,
          fontWeight: 700,
          color: palette.teal,
          "&:hover": { bgcolor: palette.tealSoft },
        }}
      >
        View full breakdown
        <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
      </ButtonBase>
    </Box>
  );
}

export default React.memo(ProfileCompletionCard);