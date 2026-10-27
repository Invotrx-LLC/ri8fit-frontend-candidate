import React, {
  memo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Box, Grid, Paper, CircularProgress } from "@mui/material";
import { styled } from "@mui/system";
import BasicInformation from "../Basicinformation/BasicInformation";
import ResumeSection from "../Resume/ResumeSection";
import SkillsSection from "../Skills/SkillSection";
import EmploymentHistory from "../Employement/EmployeeHistory";
import EducationSection from "../Education/EductaionSection";
import CertificationSection from "../Certifications/CertificationSection";
import { useDispatch } from "react-redux";
import { candidateUpdateFormData } from "../../../../store/slices/candidateSlice";
import Sidebar from "../Sidebar/Sidebar"; // Adjust the path based on your file structure
import Personaldetails from "../Personaldetails/Personaldetails";

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  backgroundColor: "#fff",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

// NOTE: ids here now match the ref keys used on the actual rendered
// section divs below. Previously this list said "resume" while the
// div ref that was actually mounted used "profileimage" — that
// mismatch is what caused the sidebar to highlight the wrong tab.
const SECTION_CONFIG = [
  { id: "profileimage", label: "Resume", completed: false },
  { id: "skills", label: "Key Skills", completed: false },
  { id: "employment", label: "Employment History", completed: false },
  { id: "education", label: "Education", completed: false },
  { id: "certifications", label: "Certifications", completed: false },
  { id: "personal", label: "Personal Details", completed: false },
];

const ProfileSections = memo(function ProfileSections({
  sectionRefs,
  basicInfoResponse,
  handleSectionComplete,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ my: { xs: 0, sm: 1, md: 2 } }} />
      <div ref={(el) => (sectionRefs.current.profileimage = el)}>
        <ResumeSection
          resumeInfo={basicInfoResponse}
          onSectionComplete={handleSectionComplete}
          showProfileImageOnly={true}
        />
      </div>
      <Box sx={{ my: { xs: 0, sm: 1, md: 2 } }} />

      <div ref={(el) => (sectionRefs.current.skills = el)}>
        <SkillsSection
          keySkillInfo={basicInfoResponse}
          onSectionComplete={handleSectionComplete}
        />
      </div>
      <Box sx={{ my: { xs: 0, sm: 1, md: 2 } }} />

      <div ref={(el) => (sectionRefs.current.employment = el)}>
        <EmploymentHistory
          employmentHistroyInfo={basicInfoResponse}
          onSectionComplete={handleSectionComplete}
        />
      </div>
      <Box sx={{ my: { xs: 0, sm: 1, md: 2 } }} />

      <div ref={(el) => (sectionRefs.current.education = el)}>
        <EducationSection
          educationSelectionInfo={basicInfoResponse}
          onSectionComplete={handleSectionComplete}
        />
      </div>
      <Box sx={{ my: { xs: 0, sm: 1, md: 2 } }} />

      <div ref={(el) => (sectionRefs.current.certifications = el)}>
        <CertificationSection
          certificationSelectionInfo={basicInfoResponse}
          onSectionComplete={handleSectionComplete}
        />
      </div>
      <Box sx={{ my: { xs: 0, sm: 1, md: 2 } }} />

      <div ref={(el) => (sectionRefs.current.personal = el)}>
        <Personaldetails onSectionComplete={handleSectionComplete} />
      </div>
    </Box>
  );
});

const BasicInfoBlock = memo(function BasicInfoBlock({ basicInfoResponse }) {
  return <BasicInformation candidateInfo={basicInfoResponse} />;
});

const CandidateProfilePage = () => {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [basicInfoResponse, setBasicInfoResponse] = useState(null);
  const [sections, setSections] = useState(SECTION_CONFIG);

  // Keys here must stay identical to: SECTION_CONFIG ids above, and the
  // ref callbacks on the JSX below. One string, three places, always in sync.
  const sectionRefs = useRef({
    profileimage: null,
    skills: null,
    employment: null,
    education: null,
    certifications: null,
    personal: null,
  });

  const scrollToSection = useCallback((id) => {
    const ref = sectionRefs.current[id];
    if (ref) {
      window.scrollTo({
        top: ref.offsetTop - 80,
        behavior: "smooth",
      });
    }
  }, []);

  const handleSectionComplete = useCallback((sectionId, isCompleted) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId
          ? { ...section, completed: isCompleted }
          : section
      )
    );
    dispatch(
      candidateUpdateFormData({
        section: sectionId,
        updates: isCompleted
          ? { ...basicInfoResponse?.[sectionId], completed: true }
          : null,
      })
    );
  }, [basicInfoResponse, dispatch]);

  // Add this state (if not already added)
  const [apiPercentage, setApiPercentage] = useState(0);

  // Replace your fetchApi with this:
  // const fetchApi = useCallback(async () => {
  //   console.log("fetchApi called");
  //   try {
  //     setFetchLoading(true);
  //     const res = await getCandidateProfile().unwrap();
  //     const apiResponse = res?.data || res;

  //     // 1. Exact % from backend
  //     const backendPercent =
  //       apiResponse?.profile_completion?.completion_percent ?? 0;
  //     setApiPercentage(backendPercent);

  //     // 2. Section completion from missing_fields
  //     const missing = apiResponse?.profile_completion?.missing_fields || {};
  //     const isSectionComplete = (fieldList) =>
  //       !(fieldList && fieldList.length > 0);

  //     const resumeComplete = isSectionComplete(missing.resume);
  //     const profileImageComplete = isSectionComplete(missing.profile_image);
  //     const personalComplete = isSectionComplete(missing.personal_details);
  //     const employmentComplete = isSectionComplete(missing.employment);
  //     const educationComplete = isSectionComplete(missing.education);
  //     const skillsComplete = isSectionComplete(missing.skills);
  //     const certificationsComplete = isSectionComplete(missing.certifications);

  //     setSections([
  //       { id: "resume", label: "Resume", completed: resumeComplete },
  //       {
  //         id: "profileimage",
  //         label: "Profile Image",
  //         completed: profileImageComplete,
  //       },
  //       { id: "skills", label: "Key Skills", completed: skillsComplete },
  //       {
  //         id: "employment",
  //         label: "Employment History",
  //         completed: employmentComplete,
  //       },
  //       { id: "education", label: "Education", completed: educationComplete },
  //       {
  //         id: "certifications",
  //         label: "Certifications",
  //         completed: certificationsComplete,
  //       },
  //       {
  //         id: "personal",
  //         label: "Personal Details",
  //         completed: personalComplete,
  //       },
  //     ]);

  //     setBasicInfoResponse(apiResponse);
  //     dispatch(
  //       candidateUpdateFormData({
  //         section: "candidateCompleateDetails",
  //         updates: apiResponse,
  //       })
  //     );
  //   } catch (error) {
  //     console.log("fetchApi error", error);
  //   } finally {
  //     setFetchLoading(false);
  //   }
  // }, [dispatch]);
  // useEffect(() => {
  //   fetchApi();
  // }, [fetchApi]);

  // --- Active-tab tracking ---------------------------------------------
  // Replaces the old scroll + offsetTop + lodash-throttle approach.
  // That approach recreated the throttled handler on every render (since
  // it wasn't memoized), which tore down and re-attached the scroll
  // listener on every activeSection update and relied on stale offsetTop
  // math relative to whatever the nearest positioned ancestor happened to
  // be. IntersectionObserver tracks real viewport intersection instead,
  // so it stays accurate regardless of layout/breakpoint changes and
  // doesn't need manual throttling.
  useEffect(() => {
    const reachedBottom = () =>
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 5;

    const observer = new IntersectionObserver(
      (entries) => {
        if (reachedBottom()) {
          setActiveSection((prev) =>
            prev === "personal" ? prev : "personal"
          );
          return;
        }

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const nextSectionId = visible[0].target.dataset.sectionId;
          setActiveSection((prev) =>
            prev === nextSectionId ? prev : nextSectionId
          );
        }
      },
      {
        root: null,
        // Fires when a section's top crosses ~120px from the viewport
        // top (matching the old scroll offset), and stops counting a
        // section "current" once it's past the bottom 60% of the screen.
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    const observedEls = [];
    sections.forEach((section) => {
      const ref = sectionRefs.current[section.id];
      if (ref) {
        ref.dataset.sectionId = section.id;
        observer.observe(ref);
        observedEls.push(ref);
      }
    });

    const handleBottomCheck = () => {
      if (reachedBottom()) {
        setActiveSection((prev) => (prev === "personal" ? prev : "personal"));
      }
    };
    window.addEventListener("scroll", handleBottomCheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleBottomCheck);
    };
  }, [sections]);

  if (fetchLoading) {
    return (
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{ minHeight: "60vh" }}
      >
        <CircularProgress color="primary" />
      </Grid>
    );
  }

  return (
    <Box sx={{ bgcolor: "#f5f7fa", minHeight: "100vh", p: { xs: "0px 16px 16px 16px", sm: "0px 16px 16px 16px", md: 2 } }}>
      <Grid container sx={{ maxWidth: "100%", mx: "auto", mt: 0 }}>
        <Grid item size={{ xs: 12, sm: 12, lg: 12, xl: 12 }}>
          <div ref={(el) => (sectionRefs.current.basic = el)}>
            <BasicInfoBlock basicInfoResponse={basicInfoResponse} />
          </div>
        </Grid>
        {/* Sidebar and Sections Side by Side */}
        <Grid item size={{ xs: 12, sm: 12, lg: 12, xl: 12 }}>
          <StyledPaper>
            <Grid container spacing={3}>
              {/* Sidebar */}
              <Grid item size={{ xs: 12, sm: 4, lg: 3 }}>
                <Sidebar
                  sections={sections}
                  scrollToSection={scrollToSection}
                  activeSection={activeSection}
                  apiPercentage={apiPercentage}
                />
              </Grid>
              {/* Sections */}
              <Grid item size={{ xs: 12, sm: 8, lg: 9 }}>
                <ProfileSections
                  sectionRefs={sectionRefs}
                  basicInfoResponse={basicInfoResponse}
                  handleSectionComplete={handleSectionComplete}
                />
              </Grid>
            </Grid>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CandidateProfilePage;