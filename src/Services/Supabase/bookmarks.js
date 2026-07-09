import { isSupabaseConfigured, supabase } from './client';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function formatSupabaseError(error, fallback) {
  if (!error) {
    return fallback;
  }

  return error.message || fallback;
}

export async function listApplicantBookmarks(applicantUserId) {
  assertSupabaseReady();

  const normalizedApplicantUserId = normalizeText(applicantUserId);
  if (!normalizedApplicantUserId) {
    return [];
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('program_id, created_at')
    .eq('applicant_user_id', normalizedApplicantUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load bookmarked programs.'));
  }

  return (data || [])
    .map((row) => normalizeText(row?.program_id))
    .filter(Boolean);
}

export async function addApplicantBookmark(applicantUserId, programId) {
  assertSupabaseReady();

  const normalizedApplicantUserId = normalizeText(applicantUserId);
  const normalizedProgramId = normalizeText(programId);
  if (!normalizedApplicantUserId || !normalizedProgramId) {
    throw new Error('Bookmark requires a valid applicant user id and program id.');
  }

  const { error } = await supabase
    .from('bookmarks')
    .upsert(
      {
        applicant_user_id: normalizedApplicantUserId,
        program_id: normalizedProgramId,
      },
      { onConflict: 'applicant_user_id,program_id' }
    );

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to bookmark this program.'));
  }
}

export async function removeApplicantBookmark(applicantUserId, programId) {
  assertSupabaseReady();

  const normalizedApplicantUserId = normalizeText(applicantUserId);
  const normalizedProgramId = normalizeText(programId);
  if (!normalizedApplicantUserId || !normalizedProgramId) {
    throw new Error('Bookmark removal requires a valid applicant user id and program id.');
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('applicant_user_id', normalizedApplicantUserId)
    .eq('program_id', normalizedProgramId);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to remove this bookmark.'));
  }
}
