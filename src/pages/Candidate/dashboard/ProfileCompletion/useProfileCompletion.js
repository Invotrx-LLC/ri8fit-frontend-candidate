import { useCallback, useEffect, useRef } from "react";
import {
  useGetCandidateKeySkillsQuery,
  useGetProfileCompletionQuery,
} from "../../../../store/api/settings/CandidatePortalApis";

/**
 * Loads the logged-in candidate's profile completion (API 1).
 *
 * candidate_id comes from the key-skills response — the Skills card already
 * calls that query, so RTK Query serves it from cache (no extra request).
 *
 * `refresh()` re-fetches the score. It is debounced, so several sections
 * reporting a change at once still cause only ONE API call.
 */
export default function useProfileCompletion() {
  const { data: keySkillsResponse } = useGetCandidateKeySkillsQuery();
  const candidateId =
    keySkillsResponse?.data?.candidate_id ?? keySkillsResponse?.data?.skill_info?.candidate_id;

  const { data, isLoading, isFetching, isError, refetch } = useGetProfileCompletionQuery(candidateId, {
    skip: !candidateId,
  });

  // API may answer { data: {...} } or the object itself
  const completion = data?.data ?? data ?? null;

  const timer = useRef(null);
  const refresh = useCallback(() => {
    if (!candidateId) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => refetch(), 600);
  }, [candidateId, refetch]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return {
    completion,
    candidateId,
    isLoading: isLoading || (!candidateId && !keySkillsResponse),
    isFetching,
    isError,
    refresh,
  };
}