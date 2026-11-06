// src/components/Stepper/index.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import Person2RoundedIcon from "@mui/icons-material/Person2Rounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";
import PropTypes from "prop-types";
import { isFresher } from "../../utils/workStatus.js";

const PRIMARY      = "#2B6F71";
const PRIMARY_DARK = "#1E4F50";
const PRIMARY_TINT = "#E3F0F0"; // light fill so "done" reads distinct from "pending"
const PENDING_FILL = "#F1F4F6"; // visible tint so upcoming steps aren't just blank white
const BORDER       = "#AEB6C4"; // stronger contrast so pending steps read clearly against white
const TEXT         = "#4B5563"; // darker than before so pending labels aren't washed out

// Icons say what each step is about; subtext is written to the person filling the form.
const STEPS = [
  {
    label: "Work Experience",
    sub: "A quick rundown of your roles and responsibilities",
    icon: WorkOutlineRoundedIcon,
  },
  {
    label: "Education",
    sub: "Your degrees, institutions, and years attended",
    icon: SchoolRoundedIcon,
  },
  {
    label: "Personal Details",
    sub: "Contact info to help employers reach you",
    icon: Person2RoundedIcon,
  },
];

const StepItem = ({ step, index, activeStep, onStepClick, total, skipped }) => {
  // A skipped step (Work Experience for a fresher) is not shown as "done"
  const isDone     = index < activeStep && !skipped;
  const isActive   = index === activeStep;
  const isPending  = index > activeStep;
  const isLast     = index === total - 1;
  // const clickable  = index <= activeStep; // can revisit done/active steps, not skip ahead
  const clickable = true;
  const Icon       = step.icon;

  return (
    <Box
      onClick={clickable ? () => onStepClick?.(index) : undefined}
      sx={{
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        px: "clamp(12px, 2vw, 32px)",
        py: "clamp(10px, 1.5vw, 15px)",
        position: "relative",
        background: isActive
          ? `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`
          : isDone
          ? PRIMARY_TINT
          : PENDING_FILL,
        clipPath: isLast
          ? "none"
          : "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)",
        ml: index !== 0 ? "-10px" : 0,
        zIndex: total - index,
        borderTop: isActive ? "none" : `1.5px solid ${isPending ? BORDER : "transparent"}`,
        borderBottom: isActive ? "none" : `1.5px solid ${isPending ? BORDER : "transparent"}`,
        borderLeft: isActive ? "none" : `1.5px solid ${isPending ? BORDER : "transparent"}`,
        borderRight: isActive || !isLast ? "none" : isPending ? `1.5px solid ${BORDER}` : "none",
        cursor: clickable ? "pointer" : "default",
        userSelect: "none",
        transition: "background 0.2s ease, box-shadow 0.2s ease",
        "&:hover": clickable
          ? {
              background: isActive
                ? `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`
                : isDone
                ? "#D8ECEC"
                : "#F9FAFB",
            }
          : {},
      }}
    >
      {/* Circle */}
      <Box
        sx={{
          width: "clamp(36px, 3.5vw, 60px)",
          height: "clamp(36px, 3.5vw, 60px)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mr: "clamp(8px, 1.2vw, 20px)",
          bgcolor: isDone ? "#fff" : isActive ? "rgba(255,255,255,0.2)" : "#fff",
          color: isDone ? PRIMARY : isActive ? "#fff" : TEXT,
          border: isActive
            ? "2px solid rgba(255,255,255,0.6)"
            : isDone
            ? `1.5px solid ${PRIMARY}`
            : `1.5px solid ${BORDER}`,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {skipped && !isActive ? (
          <SkipNextRoundedIcon sx={{ fontSize: "clamp(16px, 1.4vw, 24px)" }} />
        ) : isDone ? (
          <CheckIcon sx={{ fontSize: "clamp(16px, 1.4vw, 24px)" }} />
        ) : (
          <Icon sx={{ fontSize: "clamp(16px, 1.4vw, 24px)" }} />
        )}
      </Box>

      {/* Text */}
      <Box sx={{ minWidth: 0, overflow: "hidden" }}>
        <Typography
          noWrap
          sx={{
            fontSize: "clamp(12px, 1vw, 18px)",
            fontWeight: 700,
            color: isActive ? "#fff" : isDone ? PRIMARY : TEXT,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {step.label}
        </Typography>

        <Typography
          sx={{
            fontSize: "clamp(10px, 0.75vw, 14px)",
            color: isActive ? "rgba(255,255,255,0.8)" : isDone ? "rgba(43,111,113,0.65)" : "#9CA3AF",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {skipped && !isActive ? "Skipped as a fresher — add an internship anytime" : step.sub}
        </Typography>
      </Box>
    </Box>
  );
};

const StepperComponent = ({ activeStep, handleStepClick, maxWidth = 1200 }) => {
  const fresher = isFresher();
  return (
    <Box
  sx={{
    width: "100%",
    maxWidth: {
      xs: maxWidth,
      sm: maxWidth,
      md: maxWidth,
      lg: 1100,
      xl: 1000,
    },
    mx: "auto",

    // Only move down on large screens
    mt: {
      xs: 0,
      sm: 0,
      md: 0,
      lg: 2,
      xl: 4,
    },
  }}
>
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: TEXT,
          mb: 1,
        }}
      >
        Step {activeStep + 1} of {STEPS.length} · {STEPS[activeStep]?.label}
      </Typography>

      <Box
        sx={{
          width: "100%",
          mt: 0,
          display: "flex",
          flexWrap: "nowrap",
          borderRadius: 2,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 2px 12px rgba(43,111,113,0.10)",
        }}
      >
        {STEPS.map((step, index) => (
          <StepItem
            key={index}
            step={step}
            index={index}
            total={STEPS.length}
            activeStep={activeStep}
            onStepClick={handleStepClick}
            skipped={index === 0 && fresher}
          />
        ))}
      </Box>
    </Box>
  );
};

StepperComponent.propTypes = {
  activeStep: PropTypes.number,
  handleStepClick: PropTypes.func,
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

StepperComponent.defaultProps = {
  activeStep: 0,
  handleStepClick: () => {},
  maxWidth: 1200,
};

export default StepperComponent;