// src/utils/authStorage.js
// Single source of truth for candidate auth state in localStorage.

export const CANDIDATE_AUTH_KEYS = {
  ACCESS_TOKEN: "candidate_access_token",
  REFRESH_TOKEN: "candidate_refresh_token",
  TOKEN_EXPIRY: "CANDIDATE_TOKEN_EXPIRY",
  USER: "candidate_user",
  IS_AUTHENTICATED: "isAuthenticated",
  IS_NEW_USER: "is_new_user",
};

/** Remove every candidate auth key. Call on logout, on failed refresh, and before saving a fresh login. */
export const clearCandidateAuth = () => {
  Object.values(CANDIDATE_AUTH_KEYS).forEach((key) =>
    localStorage.removeItem(key)
  );
};

/** Token exists AND has not expired. */
export const isCandidateTokenValid = () => {
  const token = localStorage.getItem(CANDIDATE_AUTH_KEYS.ACCESS_TOKEN);
  const expiry = localStorage.getItem(CANDIDATE_AUTH_KEYS.TOKEN_EXPIRY);
  if (!token || !expiry) return false;

  const expiryMs = new Date(expiry).getTime();
  if (Number.isNaN(expiryMs)) return false;

  return expiryMs > Date.now();
};

/**
 * Real auth check — never trust the isAuthenticated flag alone.
 * If the token is missing/expired, stale keys are wiped so they can't cause redirects.
 */
export const isCandidateAuthenticated = () => {
  const flag = localStorage.getItem(CANDIDATE_AUTH_KEYS.IS_AUTHENTICATED) === "true";
  if (flag && isCandidateTokenValid()) return true;

  clearCandidateAuth();
  return false;
};

export const isCandidateNewUser = () => {
  try {
    return JSON.parse(localStorage.getItem(CANDIDATE_AUTH_KEYS.IS_NEW_USER) || "false") === true;
  } catch {
    return false;
  }
};

/** Save a fresh login. Always clears old state first so nothing stale survives. */
export const saveCandidateAuth = ({
  accessToken,
  refreshToken,
  expiry,
  user,
  isNewUser,
}) => {
  clearCandidateAuth();
  localStorage.setItem(CANDIDATE_AUTH_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(CANDIDATE_AUTH_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem(CANDIDATE_AUTH_KEYS.TOKEN_EXPIRY, expiry);
  localStorage.setItem(CANDIDATE_AUTH_KEYS.USER, JSON.stringify(user ?? null));
  localStorage.setItem(CANDIDATE_AUTH_KEYS.IS_AUTHENTICATED, "true");
  // Written on EVERY login (true or false) so an old "true" never lingers
  localStorage.setItem(CANDIDATE_AUTH_KEYS.IS_NEW_USER, JSON.stringify(!!isNewUser));
};