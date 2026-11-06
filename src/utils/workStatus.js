// src/utils/workStatus.js
//
// Work status chosen on Profile registration ("experienced" | "fresher").
// Kept in localStorage so the onboarding stepper still knows it after a page
// refresh on /for-candidate/profile-details.

export const WORK_STATUS_KEY = "candidate_work_status";
export const WORK_STATUS = { EXPERIENCED: "experienced", FRESHER: "fresher" };

export const saveWorkStatus = (status) => {
  try {
    if (status) localStorage.setItem(WORK_STATUS_KEY, status);
    else localStorage.removeItem(WORK_STATUS_KEY);
  } catch {
    /* storage blocked — the stepper just starts at step 1 */
  }
};

export const getWorkStatus = () => {
  try {
    return localStorage.getItem(WORK_STATUS_KEY) || "";
  } catch {
    return "";
  }
};

export const isFresher = (status = getWorkStatus()) => status === WORK_STATUS.FRESHER;