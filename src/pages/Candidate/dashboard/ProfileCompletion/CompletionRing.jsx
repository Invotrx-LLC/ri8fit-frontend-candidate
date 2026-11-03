import React from "react";
import { Box, Typography } from "@mui/material";
import { palette, fonts } from "../../../../theme/candidateTokens";
import { fmt } from "./profileCompletionConfig";

/* Circular score ring — size / stroke are configurable for the card and the drawer */
function CompletionRing({ percent = 0, color = palette.teal, size = 96, stroke = 9, label = "complete" }) {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={palette.line} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms ease, stroke 300ms ease" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: size * 0.22, color: palette.ink, lineHeight: 1 }}
        >
          {fmt(clamped)}
          <Box component="span" sx={{ fontSize: size * 0.12, ml: 0.25 }}>
            %
          </Box>
        </Typography>
        {label && (
          <Typography sx={{ fontSize: Math.max(9.5, size * 0.1), color: palette.muted, mt: 0.4, letterSpacing: 0.3 }}>
            {label}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default React.memo(CompletionRing);