// src/services/GoogleCallback.jsx
//
// Finishes "Sign up / Sign in with Google".
//
// After Google, the backend redirects the browser back to the frontend with the
// tokens in the URL, e.g.
//   /?access_token=…&refresh_token=…&is_new_user=true
//   /for-candidate/login?access_token=…
//   /for-candidate/google-callback?access_token=…
//
// This component is mounted ONCE in App.jsx (inside <Router>), so it catches
// the tokens on WHICHEVER page the backend sends the user to. Previously only
// the Sign-up page read them — landing on "/" or "/for-candidate/login" did
// nothing, which is why Google login looked broken.
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import {
  CANDIDATE_ACCESS_TOKEN,
  CANDIDATE_REFRESH_TOKEN,
  IS_AUTHENTICATED,
  setItem,
} from "../utils/helper";
import { candidateUpdateFormData } from "../store/slices/candidateSlice";

const TOKEN_EXPIRY_KEY = "CANDIDATE_TOKEN_EXPIRY"; // same key the email login uses

/* Backends send booleans as "true", "True", "1" … */
const isTrue = (v) => ["true", "1", "yes"].includes(String(v ?? "").trim().toLowerCase());

/* Tokens may come in the query (?a=b) or in the hash (#a=b) */
const readParams = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (key) => query.get(key) ?? hash.get(key);
};

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const get = readParams();

    const accessToken = get("access_token");
    const refreshToken = get("refresh_token");
    const errorMessage = get("error_description") || get("error") || get("message");

    // ── Google / backend reported an error ─────────────────────────────
    if (!accessToken && get("error")) {
      handled.current = true;
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.error(errorMessage || "Google sign-in failed. Please try again.");
      navigate("/for-candidate/login", { replace: true });
      return;
    }

    if (!accessToken) return; // normal page load — nothing to do
    handled.current = true;

    const isNewUser = isTrue(get("is_new_user"));
    const expiry = get("expiry_time") || get("expires_at");
    const email = get("email");

    // ── Save the session — same keys the email/password login writes ───
    setItem(CANDIDATE_ACCESS_TOKEN, accessToken);
    if (refreshToken) setItem(CANDIDATE_REFRESH_TOKEN, refreshToken);
    if (expiry) setItem(TOKEN_EXPIRY_KEY, expiry);
    setItem(IS_AUTHENTICATED, "true"); // the login page checks === "true"
    setItem("is_new_user", JSON.stringify(isNewUser));
    if (email) setItem("candidate_user", JSON.stringify({ email }));

    dispatch(
      candidateUpdateFormData({
        section: "loginDetails",
        updates: {
          accessToken,
          refreshToken,
          expiry,
          user: email ? { email } : undefined,
          isNewUser,
        },
      })
    );

    // Remove the tokens from the address bar / browser history
    window.history.replaceState({}, document.title, window.location.pathname);

    toast.success("Signed in with Google");
    navigate(isNewUser ? "/for-candidate/profile-register" : "/for-candidate/profile", {
      replace: true,
    });
    // Runs on every route change, so it also works for client-side redirects
  }, [location.key, navigate, dispatch]);

  return null;
};

export default GoogleCallback;