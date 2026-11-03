// Shared config for the Profile Completion card + drawer.
// Source of truth: Profile Completion API Guide (API 1).

/* Status badge colours (guide: Excellent blue · Good green · Average orange · Needs attention red) */
export const STATUS_STYLES = {
  Excellent: { color: "#0369A1", bg: "#E0F2FE", ring: "#0EA5E9" },
  Good: { color: "#15803D", bg: "#E7F7EC", ring: "#16A34A" },
  Average: { color: "#B45309", bg: "#FDF3E2", ring: "#D97706" },
  "Needs attention": { color: "#B91C1C", bg: "#FDECEC", ring: "#DC2626" },
};

/* Used only if the API doesn't send `status` */
export const statusFor = (pct = 0) =>
  pct >= 90 ? "Excellent" : pct >= 70 ? "Good" : pct >= 40 ? "Average" : "Needs attention";

export const styleForStatus = (status, pct) => STATUS_STYLES[status] || STATUS_STYLES[statusFor(pct)];

/* Bar colour for a section / field percentage (same thresholds as the status) */
export const barColor = (pct = 0) => styleForStatus(statusFor(pct)).ring;

/* Which card on the profile page each missing `field_key` belongs to.
   Values are the section ids used by the profile page (sectionRefs). A key
   that isn't listed (e.g. a rule an admin adds later) falls back to "basic". */
export const FIELD_KEY_TO_SECTION = {
  // Contact details → top Basic Information card
  full_name: "basic",
  email: "basic",
  phone: "basic",
  linkedin_url: "personal",
  // Resume
  resume: "resume",
  // Work experience
  work_experience: "employment",
  job_titles: "employment",
  company_names: "employment",
  employment_dates: "employment",
  responsibilities: "employment",
  role_skills: "employment",
  total_experience: "employment",
  // Skills
  key_skills: "skills",
  professional_summary: "basic",
  therapeutic_areas: "skills",
  edc_tools: "skills",
  availability: "basic",
  // Location & work authorisation
  country: "personal",
  city: "personal",
  work_authorization: "personal",
  relocation: "personal",
  location_preference: "personal",
  // Education
  education: "education",
  education_course: "education",
  education_university: "education",
  education_year: "education",
  // Certifications
  certifications: "certifications",
  // Compensation
  expected_salary: "personal",
};

export const sectionForFieldKey = (fieldKey) => FIELD_KEY_TO_SECTION[fieldKey] || "basic";

export const fmt = (n, digits = 1) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return Number.isInteger(v) ? String(v) : v.toFixed(digits);
};