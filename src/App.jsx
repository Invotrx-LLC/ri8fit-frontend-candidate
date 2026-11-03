import React, { lazy, memo, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { ToastContainer } from "react-toastify";

import theme from "./styles/theme";
import Success from "./components/Utils/DemoSuccess";
import Unauthorized from "./routes/Unauthorized";
import CandidateLogin from "./pages/Candidate/login/Loginscreen/index";
import CandidateSignup from "./pages/Candidate/signup";
import CandidateProfile from "./pages/Candidate/register/profile";
import CandidateProfileDetails from "./pages/Candidate/register/candidateRegistration/profileDetails/ProfileDetails";
import ForgotPassword from "./pages/Candidate/login/forgotPassword";
import CandidateVerification from "./pages/Candidate/login/otpVerification";
import CandidateDashboard from "./pages/Candidate/dashboard/Index/index";
import Appbar from "./Layout/Appbar";
import Ri8FitLanding from "./pages/Candidate/Ri8FitLanding";
import CandidateRequisitions from "./pages/Candidate/requisitions";
import CandidateGapAnalysis from "./pages/Candidate/gap analysis";
import CandidateReqisitionJobDetails from "./pages/Candidate/requisitions/CandidateReqisitionJobDetails";
import { ACCESS_TOKEN, clearLocalStorage } from "./utils/helper";
import { refreshMeSilently } from "./services/meService";
import GoogleCallback from "./services/GoogleCallback";
import { useSelector } from "react-redux";

const CandidateLayout = lazy(() => import("./components/CandidateLayout"));

function App() {
  const loading = useSelector((state) => state?.auth?.loading || false);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) return;

      try {
        const newProfileVersion = await refreshMeSilently();
        const oldProfileVersion = localStorage.getItem("LAST_PROFILE_VERSION");

        if (
          oldProfileVersion &&
          oldProfileVersion !== String(newProfileVersion)
        ) {
          window.location.reload();
        }

        localStorage.setItem("LAST_PROFILE_VERSION", newProfileVersion);
      } catch (error) {
        clearLocalStorage();
        window.location.href = "/for-candidate/login";
      }
    };

    bootstrap();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {loading && (
          <Backdrop
            sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        )}

        <ToastContainer />

        {/* Finishes Google sign-in on whichever page the backend redirects to */}
        <GoogleCallback />

        <Routes>
          <Route index path="/" element={<Ri8FitLanding />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/success" element={<Success />} />

          <Route path="/for-candidate">
            <Route element={<Appbar />}>
              <Route path="login" element={<CandidateLogin />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route
                path="otp-verification"
                element={<CandidateVerification />}
              />
              <Route path="signup" element={<CandidateSignup />} />
              {/* Optional dedicated redirect target for Google — GoogleCallback
                  above reads the tokens and navigates away from here */}
              <Route path="google-callback" element={<CandidateLogin />} />
              <Route path="profile-register" element={<CandidateProfile />} />
              <Route
                path="profile-details"
                element={<CandidateProfileDetails />}
              />
            </Route>

            <Route element={<CandidateLayout />}>
              <Route path="profile" element={<CandidateDashboard />} />
              <Route path="requisitions" element={<CandidateRequisitions />} />
              <Route
                path="requisitions/:id"
                element={<CandidateReqisitionJobDetails />}
              />
              <Route path="analysis" element={<CandidateGapAnalysis />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default memo(App);