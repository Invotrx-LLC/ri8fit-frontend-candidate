import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import { Grid } from "@mui/material";
import EmploymentDetailsPage from "../candidateStepper/employmentDetails/index.jsx";
import EducationalPage from "../candidateStepper/educationDetails/index.jsx";
import PersonalDetails from "../candidateStepper/personalDetails/index.jsx";
import { getWorkStatus, isFresher } from "../../../../../utils/workStatus.js";

const STEP = { WORK: 0, EDUCATION: 1, PERSONAL: 2 };

export default function CandidateProfileDetails() {
  const location = useLocation();

  // Work status comes from Profile registration (router state), or from
  // localStorage after a page refresh.
  const workStatus = location.state?.workStatus || getWorkStatus();
  const fresher = isFresher(workStatus);

  // A fresher has no work experience → start on Education
  const [activeStep, setActiveStep] = useState(fresher ? STEP.EDUCATION : STEP.WORK);

  const handleNext = () => setActiveStep((prev) => Math.min(prev + 1, STEP.PERSONAL));

  // Fresher: Back on Education stays on Education (Work Experience was skipped).
  // They can still open Work Experience from the step bar to add an internship.
  const firstStep = fresher ? STEP.EDUCATION : STEP.WORK;
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, firstStep));

  const handleStepClick = (index) => setActiveStep(index);

  const stepProps = { handleNext, handleBack, activeStep, handleStepClick };

  return (
    <Grid container justifyContent="center">
      <Grid sx={{ display: "flex" }} item xs={12} sm={10} md={8} lg={6}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 2,
          }}
        >
          {activeStep === STEP.WORK && <EmploymentDetailsPage {...stepProps} />}
          {activeStep === STEP.EDUCATION && <EducationalPage {...stepProps} />}
          {activeStep === STEP.PERSONAL && <PersonalDetails {...stepProps} />}
        </Box>
      </Grid>
    </Grid>
  );
}