import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  CANDIDATE_ACCESS_TOKEN,
  CANDIDATE_REFRESH_TOKEN,
  candidateClearLocalStorage,
  getItem,
  setItem,
} from "../../../utils/helper";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BASE_URL || import.meta.env.REACT_APP_BASE_URL || "",
  prepareHeaders: (headers) => {
    const token = getItem(CANDIDATE_ACCESS_TOKEN);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

let candidateRefreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status === 401 || result?.error?.status === 403) {
    const refreshToken = getItem(CANDIDATE_REFRESH_TOKEN);

    if (!refreshToken) {
      candidateClearLocalStorage();
      window.location.href = "/for-candidate/login";
      return result;
    }

    if (!candidateRefreshPromise) {
      const formData = new URLSearchParams();
      formData.append("refresh_token", refreshToken);

      candidateRefreshPromise = rawBaseQuery(
        {
          url: "/auth/candidate/refresh_token",
          method: "POST",
          body: formData,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        },
        api,
        extraOptions
      ).finally(() => {
        candidateRefreshPromise = null;
      });
    }

    const refreshResult = await candidateRefreshPromise;
    const newAccessToken =
      refreshResult?.data?.data?.access_token ||
      refreshResult?.data?.access_token ||
      refreshResult?.data?.token;

    if (newAccessToken) {
      setItem(CANDIDATE_ACCESS_TOKEN, newAccessToken);
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      candidateClearLocalStorage();
      window.location.href = "/for-candidate/login";
    }
  }

  return result;
};

export const candidatePortalService = createApi({
  reducerPath: "candidatePortalService",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "CandidateProfile",
    "CandidatePersonalDetails",
    "CandidateEducation",
    "CandidateEmployment",
    "CandidateSkills",
    "CandidateResume",
    "CandidateCertifications",
    "ProfileCompletion",
  ],

  endpoints: (builder) => ({
    candidateLogin: builder.mutation({
      query: ({ email, password }) => {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);
        return {
          url: "/auth/candidate/login",
          method: "POST",
          body: formData,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        };
      },
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const payload = data?.data ?? data;
          if (payload?.access_token) {
            setItem(CANDIDATE_ACCESS_TOKEN, payload.access_token);
          }
          if (payload?.refresh_token) {
            setItem(CANDIDATE_REFRESH_TOKEN, payload.refresh_token);
          }
        } catch (error) {
          // handled by caller
        }
      },
    }),

    candidateSignup: builder.mutation({
      query: (payload) => {
        const params = new URLSearchParams(payload).toString();
        return {
          url: `/auth/candidate/signup?${params}`,
          method: "POST",
          body: {},
        };
      },
    }),

    verifyCandidateOtp: builder.mutation({
      query: ({ otp }) => ({
        url: `/auth/candidate/verify-otp?otp=${otp}`,
        method: "POST",
        body: {},
      }),
    }),

    resendCandidateOtp: builder.mutation({
      query: (params) => ({
        url: `/auth/candidate/resend-otp?${params}`,
        method: "POST",
        body: {},
      }),
    }),

    forgotCandidatePassword: builder.mutation({
      query: (email) => ({
        url: `/auth/candidate/forgot_password?email=${email}`,
        method: "POST",
        body: {},
      }),
    }),

    validateCandidateOtp: builder.mutation({
      query: ({ otp }) => ({
        url: `/auth/candidate/validate_otp?otp=${otp}`,
        method: "POST",
        body: {},
      }),
    }),

    resetCandidatePassword: builder.mutation({
      query: ({ newPassword, confirmPassword }) => ({
        url: `/auth/candidate/set_new_password?new_password=${encodeURIComponent(newPassword)}&confirm_password=${encodeURIComponent(confirmPassword)}`,
        method: "POST",
        body: {},
      }),
    }),

    getCandidateDetailsByToken: builder.query({
      query: (token) => ({
        url: "/auth/candidate/get-candidate-details",
        method: "GET",
        params: { token },
      }),
    }),

    getCandidateCountries: builder.query({
      query: () => ({
        url: "/dropdown/countries",
        method: "GET",
      }),
    }),

    getCandidateLocations: builder.query({
      query: (country) => ({
        url: "/dropdown/locations",
        method: "GET",
        params: { country },
      }),
    }),

    getWorkAuthorizations: builder.query({
      query: (country) => ({
        url: "/work-authorizations",
        method: "GET",
        params: { country },
      }),
    }),

    getCandidateProfile: builder.query({
      query: () => ({
        url: "/candidate/get-candidates-complete-details",
        method: "GET",
      }),
      providesTags: ["CandidateProfile"],
    }),

    getPersonalDetails: builder.query({
      query: () => ({
        url: "/candidates/get-personal-details",
        method: "GET",
      }),
      providesTags: ["CandidatePersonalDetails"],
    }),

    updatePersonalDetails: builder.mutation({
      query: (body) => ({
        url: "candidates/update-personal-details",
        method: "PUT",
        body,
      }),
      // invalidatesTags: ["CandidateProfile"],
    }),

    getCandidateEducation: builder.query({
      query: () => ({
        url: "/candidates/get-education",
        method: "GET",
      }),
      providesTags: ["CandidateEducation"],
    }),

    addCandidateEducation: builder.mutation({
      query: (body) => ({
        url: "/candidates/add-education",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CandidateEducation"],
    }),

    updateCandidateEducation: builder.mutation({
      query: ({ id, body }) => ({
        url: `/candidates/update-education/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["CandidateEducation"],
    }),

    deleteCandidateEducation: builder.mutation({
      query: (id) => ({
        url: `/candidates/delete-education/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CandidateEducation"],
    }),

    getCandidateEmployment: builder.query({
      query: () => ({
        url: "/candidates/get-employment",
        method: "GET",
      }),
      providesTags: ["CandidateEmployment"],
    }),

    addCandidateEmployment: builder.mutation({
      query: (body) => ({
        url: "/candidates/add-employment",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CandidateEmployment"],
    }),

    updateCandidateEmployment: builder.mutation({
      query: ({ id, body }) => ({
        url: `/candidates/update-employment/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["CandidateEmployment"],
    }),

    deleteCandidateEmployment: builder.mutation({
      query: (id) => ({
        url: `/candidates/delete-employment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CandidateEmployment"],
    }),

    getCandidateSkills: builder.query({
      query: () => ({
        url: "/candidates/skills",
        method: "GET",
      }),
      providesTags: ["CandidateSkills"],
    }),

    updateCandidateSkill: builder.mutation({
      query: ({ id, body }) => ({
        url: `/candidates/update-skill-info/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["CandidateSkills"],
    }),

    deleteCandidateSkill: builder.mutation({
      query: (id) => ({
        url: `/candidates/delete-skill/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CandidateSkills"],
    }),

    getFunctionalRoles: builder.query({
      query: () => ({
        url: "/functional-roles/functions",
        method: "GET",
      }),
    }),

    getSubFunctions: builder.query({
      query: (key) => ({
        url: `/functional-roles/sub-functions/${key}`,
        method: "GET",
      }),
    }),

    getCandidateResume: builder.query({
      query: () => ({
        url: "/candidate/resume_view/",
        method: "GET",
      }),
      providesTags: ["CandidateResume"],
    }),

    uploadCandidateResume: builder.mutation({
      query: (formData) => ({
        url: "/candidate/upload-resume-additional-details/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["CandidateResume"],
    }),
    replaceCandidateResume: builder.mutation({
      query: (formData) => ({
        url: "/candidate/resume_upload/",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["CandidateResume", "ProfileCompletion"],
    }),
    uploadCandidateAdditionalDetails: builder.mutation({
      query: (formData) => ({
        url: "/candidate/upload-resume-additional-details-candidate/",
        method: "POST",
        body: formData,
      }),
    }),
    getCandidateResumeStatus: builder.query({
      query: (taskId) => ({
        url: `/candidate/upload-resume-candidate-status/${taskId}`,
        method: "GET",
      }),
    }),
    getCandidateProfileImage: builder.query({
      query: () => ({
        url: "/candidate/view-profile-image/",
        method: "GET",
      }),
    }),

    uploadCandidateProfileImage: builder.mutation({
      query: (formData) => ({
        url: "/candidate/upload-profile-image/",
        method: "POST",
        body: formData,
      }),
    }),

    updateCandidateProfileDetails: builder.mutation({
      query: (body) => ({
        url: "/candidate/update-specific-details",
        method: "POST",
        body,
      }),
    }),
    getCandidateSpecificDetails: builder.query({
      query: () => ({
        url: "/candidate/profile/specific-details",
        method: "GET",
      }),
      providesTags: ["CandidateSpecificDetails"],
    }),
    getCandidateKeySkills: builder.query({
      query: () => ({
        url: "/candidates/get-key-skills",
        method: "GET",
      }),
      providesTags: ["CandidateKeySkills"],
    }),
    getCandidateCertifications: builder.query({
      query: () => ({
        url: "/certifications",
        method: "GET",
      }),
      providesTags: ["CandidateCertifications"],
    }),
    // Profile Completion — logged-in candidate's score, sections, missing details
    // (candidate comes from the token, so no id in the URL)
    getProfileCompletion: builder.query({
      query: () => ({
        url: "/candidate/profile-completion",
        method: "GET",
      }),
      providesTags: ["ProfileCompletion"],
    }),
    // Profile Completion — the list of fields that count toward the score
    getProfileCompletionFields: builder.query({
      query: () => ({
        url: "/candidate/profile-completion/fields",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useCandidateLoginMutation,
  useCandidateSignupMutation,
  useVerifyCandidateOtpMutation,
  useResendCandidateOtpMutation,
  useForgotCandidatePasswordMutation,
  useValidateCandidateOtpMutation,
  useResetCandidatePasswordMutation,
  useGetCandidateDetailsByTokenQuery,
  useGetCandidateCountriesQuery,
  useLazyGetCandidateLocationsQuery,
  useGetWorkAuthorizationsQuery,
  useGetCandidateProfileQuery,
  useLazyGetCandidateProfileQuery,
  useGetPersonalDetailsQuery,
  useLazyGetPersonalDetailsQuery,
  useUpdatePersonalDetailsMutation,
  useGetCandidateEducationQuery,
  useAddCandidateEducationMutation,
  useUpdateCandidateEducationMutation,
  useDeleteCandidateEducationMutation,
  useGetCandidateEmploymentQuery,
  useAddCandidateEmploymentMutation,
  useUpdateCandidateEmploymentMutation,
  useDeleteCandidateEmploymentMutation,
  useGetCandidateSkillsQuery,
  useUpdateCandidateSkillMutation,
  useDeleteCandidateSkillMutation,
  useGetFunctionalRolesQuery,
  useLazyGetSubFunctionsQuery,
  useGetCandidateResumeQuery,
  useUploadCandidateResumeMutation,
  useReplaceCandidateResumeMutation,
  useGetCandidateProfileImageQuery,
  useUploadCandidateProfileImageMutation,
  useUpdateCandidateProfileDetailsMutation,
  useLazyGetCandidateEducationQuery,
  useLazyGetCandidateEmploymentQuery,
  useGetCandidateSpecificDetailsQuery,
  useGetCandidateKeySkillsQuery,
  useUploadCandidateAdditionalDetailsMutation,   // add this
  useGetCandidateResumeStatusQuery,
  useLazyGetWorkAuthorizationsQuery,            // add this
  useGetCandidateCertificationsQuery,
  useGetProfileCompletionQuery,
  useGetProfileCompletionFieldsQuery,
} = candidatePortalService;