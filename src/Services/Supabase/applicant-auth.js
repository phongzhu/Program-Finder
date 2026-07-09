import { isSupabaseConfigured, supabase } from './client';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNullableText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function formatSupabaseError(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (error.message?.includes('profiles_email_key')) {
    return 'An account already exists for that email address.';
  }

  if (error.message?.includes('duplicate key')) {
    return 'An account already exists for that email address.';
  }

  return error.message || fallback;
}

function formatProfileName(profile) {
  return [profile.first_name, profile.middle_name, profile.last_name, profile.suffix]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(' ');
}

function mapApplicantProfile(profile) {
  const address = Array.isArray(profile.user_addresses) ? profile.user_addresses[0] : profile.user_addresses;
  const municipality = address?.ref_municipalities?.municipality_name || '';
  const barangay = address?.ref_barangays?.barangay_name || '';
  const addressParts = [
    address?.house_number,
    address?.street_name,
    address?.subdivision_area,
    barangay,
    municipality,
    address?.zip_code,
  ].map(normalizeText).filter(Boolean);

  return {
    id: profile.id,
    name: formatProfileName(profile),
    firstName: profile.first_name || '',
    middleName: profile.middle_name || '',
    lastName: profile.last_name || '',
    suffix: profile.suffix || '',
    email: profile.email,
    role: 'applicant',
    office: 'Resident Applicant Portal',
    municipality,
    municipalityId: address?.municipality_id || '',
    barangay,
    barangayId: address?.barangay_id || '',
    title: 'Applicant',
    username: normalizeText(profile.email).split('@')[0],
    status: profile.status === 'active' ? 'Active' : 'Inactive',
    mobileNumber: profile.mobile_number || '',
    alternateContactNumber: profile.alternate_contact_number || '',
    houseNumber: address?.house_number || '',
    streetName: address?.street_name || '',
    subdivisionArea: address?.subdivision_area || '',
    zipCode: address?.zip_code || '',
    address: addressParts.join(', '),
    lastActive: profile.last_login_at || '',
    createdAt: profile.created_at || '',
    updatedAt: profile.updated_at || '',
  };
}

function mapExtendedApplicantDetails(details = {}) {
  const applicantProfile = details.applicantProfile || null;
  const householdInfo = details.householdInfo || null;
  const specialCategories = details.specialCategories || null;
  const studentInfo = details.studentInfo || null;
  const familyMembers = Array.isArray(details.familyMembers) ? details.familyMembers : [];
  const sectorTags = Array.isArray(details.sectorTags) ? details.sectorTags : [];
  const specialCategory = specialCategories?.is_pwd
    ? 'Person with Disability'
    : specialCategories?.is_senior_citizen
      ? 'Senior Citizen'
      : specialCategories?.is_solo_parent
        ? 'Solo Parent'
        : specialCategories?.is_farmer
          ? 'Farmer'
          : specialCategories?.is_fisherfolk
            ? 'Fisherfolk'
            : specialCategories?.is_ofw_family
              ? 'OFW Family'
              : specialCategories?.is_indigenous_peoples
                ? 'Indigenous Peoples'
                : specialCategories?.is_unemployed
                  ? 'Unemployed Resident'
                  : studentInfo?.is_student
                    ? 'Student'
                    : '';

  return {
    birthDate: applicantProfile?.birthdate || '',
    sex: applicantProfile?.sex || '',
    civilStatus: applicantProfile?.civil_status || '',
    citizenship: applicantProfile?.citizenship || 'Filipino',
    employmentStatus: applicantProfile?.employment_status || '',
    occupation: applicantProfile?.occupation || '',
    employerName: applicantProfile?.employer_name || '',
    monthlyPersonalIncome: applicantProfile?.monthly_personal_income ?? '',
    educationStatus: applicantProfile?.educational_attainment || '',
    school: studentInfo?.school_name || '',
    course: studentInfo?.course_program || '',
    householdIncome: householdInfo?.total_household_monthly_income ?? '',
    householdMemberCount: householdInfo?.household_member_count ?? '',
    dependentCount: householdInfo?.dependent_count ?? '',
    housingStatus: householdInfo?.housing_status || '',
    specialCategory,
    specialCategories: {
      isSeniorCitizen: Boolean(specialCategories?.is_senior_citizen),
      isPwd: Boolean(specialCategories?.is_pwd),
      disabilityType: specialCategories?.disability_type || '',
      isSoloParent: Boolean(specialCategories?.is_solo_parent),
      isOutOfSchoolYouth: Boolean(specialCategories?.is_out_of_school_youth),
      isFarmer: Boolean(specialCategories?.is_farmer),
      isFisherfolk: Boolean(specialCategories?.is_fisherfolk),
      isIndigenousPeoples: Boolean(specialCategories?.is_indigenous_peoples),
      isOfwFamily: Boolean(specialCategories?.is_ofw_family),
      isUnemployed: Boolean(specialCategories?.is_unemployed),
    },
    studentInfo: {
      isStudent: Boolean(studentInfo?.is_student),
      schoolName: studentInfo?.school_name || '',
      schoolType: studentInfo?.school_type || '',
      educationalLevel: studentInfo?.educational_level || '',
      courseProgram: studentInfo?.course_program || '',
      yearOrGradeLevel: studentInfo?.year_or_grade_level || '',
    },
    familyMembers: familyMembers.map((member) => ({
      id: member.id,
      relationshipType: member.relationship_type || '',
      firstName: member.first_name || '',
      middleName: member.middle_name || '',
      lastName: member.last_name || '',
      suffix: member.suffix || '',
      relationshipLabel: member.relationship_label || '',
      occupation: member.occupation || '',
      employerName: member.employer_name || '',
      monthlyIncome: member.monthly_income ?? '',
    })),
    sectorTags: sectorTags.map((tag) => ({
      id: tag.id,
      sectorId: tag.sector_id || '',
      sectorName: tag.sectors?.sector_name || '',
    })),
  };
}

async function loadApplicantExtendedDetails(userId) {
  const [
    { data: applicantProfile, error: profileError },
    { data: householdInfo, error: householdError },
    { data: specialCategories, error: specialError },
    { data: studentInfo, error: studentError },
    { data: familyMembers, error: familyError },
    { data: sectorTags, error: sectorTagsError },
  ] = await Promise.all([
    supabase
      .from('applicant_profiles')
      .select('birthdate, sex, civil_status, citizenship, employment_status, occupation, employer_name, monthly_personal_income, educational_attainment')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('applicant_household_info')
      .select('total_household_monthly_income, household_member_count, dependent_count, housing_status')
      .eq('applicant_user_id', userId)
      .maybeSingle(),
    supabase
      .from('applicant_special_categories')
      .select('*')
      .eq('applicant_user_id', userId)
      .maybeSingle(),
    supabase
      .from('applicant_student_info')
      .select('*')
      .eq('applicant_user_id', userId)
      .maybeSingle(),
    supabase
      .from('applicant_family_members')
      .select('id, relationship_type, first_name, middle_name, last_name, suffix, relationship_label, occupation, employer_name, monthly_income')
      .eq('applicant_user_id', userId),
    supabase
      .from('applicant_sector_tags')
      .select('id, sector_id, sectors:sector_id (sector_name)')
      .eq('applicant_user_id', userId),
  ]);

  if (profileError) {
    throw new Error(formatSupabaseError(profileError, 'Unable to load applicant profile details.'));
  }

  if (householdError) {
    throw new Error(formatSupabaseError(householdError, 'Unable to load applicant household details.'));
  }

  if (specialError) {
    throw new Error(formatSupabaseError(specialError, 'Unable to load applicant category details.'));
  }

  if (studentError) {
    throw new Error(formatSupabaseError(studentError, 'Unable to load applicant student details.'));
  }

  if (familyError) {
    throw new Error(formatSupabaseError(familyError, 'Unable to load applicant family details.'));
  }

  if (sectorTagsError) {
    throw new Error(formatSupabaseError(sectorTagsError, 'Unable to load applicant sector tags.'));
  }

  return mapExtendedApplicantDetails({ applicantProfile, householdInfo, specialCategories, studentInfo, familyMembers, sectorTags });
}

const APPLICANT_PROFILE_SELECT = `
  id,
  role,
  email,
  first_name,
  middle_name,
  last_name,
  suffix,
  mobile_number,
  alternate_contact_number,
  status,
  last_login_at,
  created_at,
  updated_at,
  user_addresses (
    municipality_id,
    barangay_id,
    house_number,
    street_name,
    subdivision_area,
    zip_code,
    ref_municipalities:municipality_id (
      municipality_name
    ),
    ref_barangays:barangay_id (
      barangay_name
    )
  )
`;

async function findMunicipalityId(municipalityName) {
  const municipality = normalizeText(municipalityName);
  if (!municipality) {
    return null;
  }

  const { data, error } = await supabase
    .from('ref_municipalities')
    .select('id')
    .eq('province_name', 'Bulacan')
    .eq('municipality_name', municipality)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to validate the selected municipality.'));
  }

  return data?.id || null;
}

async function findBarangayId(municipalityId, barangayName) {
  const barangay = normalizeText(barangayName);
  if (!municipalityId || !barangay) {
    return null;
  }

  const { data, error } = await supabase
    .from('ref_barangays')
    .select('id')
    .eq('municipality_id', municipalityId)
    .eq('barangay_name', barangay)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to validate the selected barangay.'));
  }

  return data?.id || null;
}

export async function registerApplicantAccount(payload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const email = normalizeText(payload.email).toLowerCase();
  const firstName = normalizeText(payload.firstName);
  const middleName = normalizeNullableText(payload.middleName);
  const lastName = normalizeText(payload.lastName);
  const suffix = normalizeNullableText(payload.suffix);
  const mobileNumber = normalizeNullableText(payload.phone);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: String(payload.password || ''),
    options: {
      data: {
        role: 'applicant',
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        suffix,
        mobile_number: mobileNumber,
      },
    },
  });

  if (authError) {
    throw new Error(formatSupabaseError(authError, 'Unable to create the authentication account.'));
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Supabase did not return a new user id for this signup.');
  }

  return {
    userId,
    email,
    session: authData?.session || null,
  };
}

export async function signInApplicantAccount(form) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const email = normalizeText(form.email).toLowerCase();
  const password = String(form.password || '');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new Error(formatSupabaseError(authError, 'Invalid applicant email or password.'));
  }

  const userId = authData?.user?.id;
  if (!userId) {
    throw new Error('Supabase did not return a signed-in applicant user.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(APPLICANT_PROFILE_SELECT)
    .eq('id', userId)
    .eq('role', 'applicant')
    .maybeSingle();

  if (profileError) {
    throw new Error(formatSupabaseError(profileError, 'Unable to load the applicant profile.'));
  }

  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('This Supabase user does not have an applicant profile.');
  }

  if (profile.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error(`This account is currently ${profile.status}.`);
  }

  await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId);

  const extendedDetails = await loadApplicantExtendedDetails(userId);
  return {
    ...mapApplicantProfile(profile),
    ...extendedDetails,
  };
}

export async function getSignedInApplicantAccount() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(APPLICANT_PROFILE_SELECT)
    .eq('id', user.id)
    .eq('role', 'applicant')
    .maybeSingle();

  if (profileError || !profile || profile.status !== 'active') {
    return null;
  }

  await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

  const extendedDetails = await loadApplicantExtendedDetails(user.id);
  return {
    ...mapApplicantProfile(profile),
    ...extendedDetails,
  };
}

export async function verifyApplicantSignupOtp(payload) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const email = normalizeText(payload.email).toLowerCase();
  const token = normalizeText(payload.otp).replace(/\s+/g, '');
  const firstName = normalizeText(payload.firstName);
  const middleName = normalizeNullableText(payload.middleName);
  const lastName = normalizeText(payload.lastName);
  const suffix = normalizeNullableText(payload.suffix);
  const mobileNumber = normalizeNullableText(payload.phone);
  const alternateContactNumber = normalizeNullableText(payload.alternateContactNumber);
  const municipalityId = await findMunicipalityId(payload.municipality);
  const barangayId = await findBarangayId(municipalityId, payload.barangay);

  if (!email || !token) {
    throw new Error('Enter the OTP sent to your email address.');
  }

  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });

  if (verifyError) {
    throw new Error(formatSupabaseError(verifyError, 'Unable to verify the applicant OTP.'));
  }

  const userId = verifyData?.user?.id;
  if (!userId) {
    throw new Error('Supabase did not return the verified applicant user.');
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'applicant',
    email,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    mobile_number: mobileNumber,
    alternate_contact_number: alternateContactNumber,
    status: 'active',
  }, {
    onConflict: 'id',
  });

  if (profileError) {
    throw new Error(formatSupabaseError(profileError, 'Unable to save the applicant profile.'));
  }

  const { error: addressError } = await supabase.from('user_addresses').upsert({
    user_id: userId,
    house_number: normalizeNullableText(payload.houseNumber),
    street_name: normalizeNullableText(payload.streetName),
    subdivision_area: normalizeNullableText(payload.subdivisionArea),
    municipality_id: municipalityId,
    barangay_id: barangayId,
    zip_code: normalizeNullableText(payload.zipCode),
  }, {
    onConflict: 'user_id',
  });

  if (addressError) {
    throw new Error(formatSupabaseError(addressError, 'Unable to save the applicant address.'));
  }

  return {
    userId,
    email,
    session: verifyData?.session || null,
  };
}

function splitProfileName(payload = {}) {
  const firstName = normalizeText(payload.firstName);
  const lastName = normalizeText(payload.lastName);

  if (firstName && lastName) {
    return {
      firstName,
      middleName: normalizeNullableText(payload.middleName),
      lastName,
      suffix: normalizeNullableText(payload.suffix),
    };
  }

  const parts = normalizeText(payload.fullName || payload.name).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || firstName,
    middleName: normalizeNullableText(payload.middleName),
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : lastName || firstName || 'Applicant',
    suffix: normalizeNullableText(payload.suffix),
  };
}

function normalizeEnum(value, allowedValues) {
  const normalized = normalizeText(value).toLowerCase().replace(/[\s-]+/g, '_');
  return allowedValues.includes(normalized) ? normalized : null;
}

function normalizeNumber(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeInteger(value) {
  const parsed = normalizeNumber(value);
  return parsed === null ? null : Math.max(0, Math.floor(parsed));
}

function getApplicantTypeSet(payload = {}) {
  const values = new Set(
    Array.isArray(payload?.searchSurvey?.applicantTypes)
      ? payload.searchSurvey.applicantTypes.map((item) => normalizeText(item).toLowerCase())
      : []
  );
  const specialCategory = normalizeText(payload.specialCategory).toLowerCase();
  const employmentStatus = normalizeText(payload.employmentStatus).toLowerCase();

  if (specialCategory.includes('student') || employmentStatus === 'student') values.add('student');
  if (specialCategory.includes('senior')) values.add('senior_citizen');
  if (specialCategory.includes('disability') || specialCategory.includes('pwd')) values.add('pwd');
  if (specialCategory.includes('solo')) values.add('solo_parent');
  if (specialCategory.includes('farmer')) values.add('farmer');
  if (specialCategory.includes('fisher')) values.add('fisherfolk');
  if (specialCategory.includes('ofw')) values.add('ofw_family');
  if (specialCategory.includes('indigenous')) values.add('indigenous_peoples');
  if (specialCategory.includes('unemployed') || employmentStatus === 'unemployed') values.add('unemployed');

  return values;
}

export async function updateApplicantProfile(payload, session) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const userId = normalizeText(session?.id || payload?.id);
  const email = normalizeText(payload.email || session?.email).toLowerCase();
  if (!userId) {
    throw new Error('Unable to update the applicant profile without a user id.');
  }
  if (!email) {
    throw new Error('Unable to update the applicant profile without an email address.');
  }

  const names = splitProfileName(payload);
  if (!names.firstName || !names.lastName) {
    throw new Error('Enter the applicant first name and last name before saving.');
  }

  const municipalityId = await findMunicipalityId(payload.municipality);
  const barangayId = await findBarangayId(municipalityId, payload.barangay);
  const employmentStatus = normalizeEnum(payload.employmentStatus, ['employed', 'unemployed', 'self_employed', 'student', 'retired', 'contractual']);
  const isStudent = employmentStatus === 'student' || getApplicantTypeSet(payload).has('student');

  const { data: savedBaseProfile, error: profileError } = await supabase
    .from('profiles')
    .update({
      email,
      first_name: names.firstName,
      middle_name: names.middleName,
      last_name: names.lastName,
      suffix: names.suffix,
      mobile_number: normalizeNullableText(payload.phone || payload.mobileNumber),
      alternate_contact_number: normalizeNullableText(payload.alternateContactNumber),
    })
    .eq('id', userId)
    .eq('role', 'applicant')
    .select('id')
    .maybeSingle();

  if (profileError) {
    throw new Error(formatSupabaseError(profileError, 'Unable to update the applicant profile.'));
  }
  if (!savedBaseProfile?.id) {
    throw new Error('No applicant profile row was saved. Check the profiles table RLS policy for authenticated applicant updates.');
  }

  const { error: addressError } = await supabase.from('user_addresses').upsert({
    user_id: userId,
    house_number: normalizeNullableText(payload.houseNumber),
    street_name: normalizeNullableText(payload.streetName),
    subdivision_area: normalizeNullableText(payload.subdivisionArea),
    municipality_id: municipalityId,
    barangay_id: barangayId,
    zip_code: normalizeNullableText(payload.zipCode),
  }, {
    onConflict: 'user_id',
  });

  if (addressError) {
    throw new Error(formatSupabaseError(addressError, 'Unable to update the applicant address.'));
  }

  const { error: applicantProfileError } = await supabase.from('applicant_profiles').upsert({
    user_id: userId,
    birthdate: normalizeNullableText(payload.birthDate),
    sex: normalizeEnum(payload.sex, ['male', 'female', 'prefer_not_to_say']),
    civil_status: normalizeEnum(payload.civilStatus, ['single', 'married', 'widowed', 'separated', 'divorced']),
    citizenship: normalizeNullableText(payload.citizenship) || 'Filipino',
    employment_status: employmentStatus,
    occupation: isStudent ? null : normalizeNullableText(payload.occupation),
    employer_name: isStudent ? null : normalizeNullableText(payload.employerName),
    monthly_personal_income: normalizeNumber(payload.monthlyPersonalIncome),
    educational_attainment: normalizeNullableText(payload.educationStatus),
  }, {
    onConflict: 'user_id',
  });

  if (applicantProfileError) {
    throw new Error(formatSupabaseError(applicantProfileError, 'Unable to update applicant profile details.'));
  }

  const { error: householdError } = await supabase.from('applicant_household_info').upsert({
    applicant_user_id: userId,
    total_household_monthly_income: normalizeNumber(payload.householdIncome),
    household_member_count: normalizeInteger(payload.householdMemberCount),
    dependent_count: normalizeInteger(payload.dependentCount),
    housing_status: normalizeEnum(payload.housingStatus, ['owned', 'rented', 'shared', 'informal_settler', 'others']),
  }, {
    onConflict: 'applicant_user_id',
  });

  if (householdError) {
    throw new Error(formatSupabaseError(householdError, 'Unable to update applicant household details.'));
  }

  const applicantTypes = getApplicantTypeSet({
    ...payload,
    employmentStatus,
  });
  const { error: specialError } = await supabase.from('applicant_special_categories').upsert({
    applicant_user_id: userId,
    is_senior_citizen: applicantTypes.has('senior_citizen'),
    is_pwd: applicantTypes.has('pwd'),
    disability_type: normalizeNullableText(payload.disabilityType),
    is_solo_parent: applicantTypes.has('solo_parent'),
    is_out_of_school_youth: applicantTypes.has('out_of_school_youth'),
    is_farmer: applicantTypes.has('farmer'),
    is_fisherfolk: applicantTypes.has('fisherfolk'),
    is_indigenous_peoples: applicantTypes.has('indigenous_peoples'),
    is_ofw_family: applicantTypes.has('ofw_family'),
    is_unemployed: applicantTypes.has('unemployed'),
  }, {
    onConflict: 'applicant_user_id',
  });

  if (specialError) {
    throw new Error(formatSupabaseError(specialError, 'Unable to update applicant category details.'));
  }

  if (isStudent) {
    const { error: studentError } = await supabase.from('applicant_student_info').upsert({
      applicant_user_id: userId,
      is_student: true,
      school_name: normalizeNullableText(payload.school),
      school_type: normalizeEnum(payload.schoolType, ['public', 'private']),
      educational_level: normalizeNullableText(payload.educationalLevel || payload.educationStatus),
      course_program: normalizeNullableText(payload.course || payload.courseProgram),
      year_or_grade_level: normalizeNullableText(payload.yearOrGradeLevel),
    }, {
      onConflict: 'applicant_user_id',
    });

    if (studentError) {
      throw new Error(formatSupabaseError(studentError, 'Unable to update applicant student details.'));
    }
  } else {
    const { error: studentDeleteError } = await supabase
      .from('applicant_student_info')
      .delete()
      .eq('applicant_user_id', userId);

    if (studentDeleteError) {
      throw new Error(formatSupabaseError(studentDeleteError, 'Unable to clear student details.'));
    }
  }

  const { data: profile, error: reloadError } = await supabase
    .from('profiles')
    .select(APPLICANT_PROFILE_SELECT)
    .eq('id', userId)
    .eq('role', 'applicant')
    .maybeSingle();

  if (reloadError) {
    throw new Error(formatSupabaseError(reloadError, 'Profile was saved, but could not be reloaded.'));
  }

  if (!profile) {
    return null;
  }

  const extendedDetails = await loadApplicantExtendedDetails(userId);
  return {
    ...mapApplicantProfile(profile),
    ...extendedDetails,
  };
}

export async function resendApplicantSignupOtp(emailValue) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.');
  }

  const email = normalizeText(emailValue).toLowerCase();
  if (!email) {
    throw new Error('Enter the applicant email address first.');
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to resend the applicant OTP.'));
  }

  return { email };
}
