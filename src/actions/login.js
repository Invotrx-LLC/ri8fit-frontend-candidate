import { toast } from "react-toastify";
import api from "../api";
import candidateApi from "../services/candidateApi";
import {
  ID_TOKEN, PROFILE_VERSION, TIME_ZONE, USER_ROLE, ACCESS_TOKEN,
  REFRESH_TOKEN,
  EXPIRY_TIME,
  IS_AUTHENTICATED,
  USER_DATA,
  setItem,
  EMPLOYEE_NAME
} from "../utils/helper";

const LoginURL = "/auth/login";


// export const setLogin = async (payload) => {
//   // setLoading(true);

//   const formData = new URLSearchParams();
//   formData.append("username", payload.username);
//   formData.append("password", payload.password);

//   try {
//     const response = await api.post(LoginURL, formData, {
//       headers: {
//         accept: "application/json",
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     });

//     if (response?.data?.success === true) {
//       const { data, meta } = response.data;

//       const profileVersion = meta?.profile_version;
//       if (profileVersion) {
//         setItem(PROFILE_VERSION, String(profileVersion));
//       }

//       setItem(ACCESS_TOKEN, data.access_token);
//       setItem(REFRESH_TOKEN, data.refresh_token);
//       setItem(ID_TOKEN, data.id_token);

//       setItem(
//         EXPIRY_TIME,
//         data.expiry_time || new Date(Date.now() + 3600000).toISOString()
//       );
//       // setItem(employeeName, data.employee_name || "User");
//       setItem(USER_DATA, JSON.stringify(data.user));
//       setItem(IS_AUTHENTICATED, "true");
//       setItem(USER_ROLE, data.user_role || "user");
//       setItem(EMPLOYEE_NAME,data.employee_name || "User")
//       setItem(
//         TIME_ZONE,
//         data.employee_time_zone || data.organisation_time_zone || "UTC"
//       );

//       return { success: true, response };
//     }

//     return { success: false, message: response?.data?.message || "Login failed" };

//   } catch (error) {
//     console.error("Login API error:", error);
//     return { success: false, error: error.response?.data || error.message };
//   } finally {
//     // setLoading(false);
//   }
// };



export const googleLogin = async (setLoading) => {
  setLoading?.(true);
  try {
    // NOTE: axios ignores fetch's `credentials` option; nothing else is needed here.
    const response = await candidateApi.get("/auth/candidate/google/signup");
    const body = response?.data || {};
    // URL can come as data.google_oauth_url or at the top level
    const url = body?.data?.google_oauth_url || body?.google_oauth_url || body?.data?.url;
    if (body.success !== false && url) {
      return { ...(body.data || {}), google_oauth_url: url };
    }
    toast.error(body?.message || "Couldn't start Google sign-in. Please try again.");
    return null;
  } catch (error) {
    toast.error(
      error?.response?.data?.message || error?.message || "Couldn't start Google sign-in. Please try again."
    );
    return null;
  } finally {
    setLoading?.(false);
  }
};