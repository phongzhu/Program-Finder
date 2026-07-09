type UnknownRecord = Record<string, unknown>;

export type ProgramAIContext = {
  profile: UnknownRecord | null;
  applicant_profiles: UnknownRecord | null;
  user_addresses: UnknownRecord | null;
  applicant_household_info: UnknownRecord | null;
  applicant_special_categories: UnknownRecord | null;
  applicant_student_info: UnknownRecord | null;
  applicant_family_members: UnknownRecord[];
  programs: UnknownRecord[];
  program_eligibility_rules: UnknownRecord[];
  program_requirements: UnknownRecord[];
  program_requirement_sources: UnknownRecord[];
};

export type ProgramAIContextInput = {
  profile?: unknown;
  applicant_profiles?: unknown;
  user_addresses?: unknown;
  applicant_household_info?: unknown;
  applicant_special_categories?: unknown;
  applicant_student_info?: unknown;
  applicant_family_members?: unknown;
  programs?: unknown;
  program_eligibility_rules?: unknown;
  program_requirements?: unknown;
  program_requirement_sources?: unknown;
};

function toRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  return [value];
}

function pickFirstRecord(value: unknown): UnknownRecord | null {
  const items = toArray(value);
  for (const item of items) {
    const record = toRecord(item);
    if (record) {
      return record;
    }
  }

  return null;
}

function toRecordArray(value: unknown): UnknownRecord[] {
  return toArray(value)
    .map((item) => toRecord(item))
    .filter((item): item is UnknownRecord => Boolean(item));
}

function collectProgramEligibility(programs: UnknownRecord[], explicitRules: UnknownRecord[]): UnknownRecord[] {
  const fromPrograms = programs
    .map((program) => pickFirstRecord(program.program_eligibility_rules))
    .filter((rule): rule is UnknownRecord => Boolean(rule));

  return [...explicitRules, ...fromPrograms];
}

function collectProgramRequirements(programs: UnknownRecord[], explicitRequirements: UnknownRecord[]): UnknownRecord[] {
  const nestedRequirements = programs.flatMap((program) => toRecordArray(program.program_requirements));
  return [...explicitRequirements, ...nestedRequirements];
}

function collectRequirementSources(
  requirements: UnknownRecord[],
  explicitSources: UnknownRecord[]
): UnknownRecord[] {
  const nestedSources = requirements.flatMap((requirement) =>
    toRecordArray(requirement.program_requirement_sources)
  );

  return [...explicitSources, ...nestedSources];
}

function normalizeApplicant(input: ProgramAIContextInput) {
  const profile = toRecord(input.profile);
  const applicantProfile =
    pickFirstRecord(input.applicant_profiles) ||
    pickFirstRecord(profile?.applicant_profiles);

  const address =
    pickFirstRecord(input.user_addresses) ||
    pickFirstRecord(profile?.user_addresses);

  // Important relationship note:
  // profiles -> applicant_profiles -> applicant_household_info
  // Do not join profiles directly to applicant_household_info.
  const householdInfo =
    pickFirstRecord(input.applicant_household_info) ||
    pickFirstRecord(applicantProfile?.applicant_household_info);

  const specialCategories =
    pickFirstRecord(input.applicant_special_categories) ||
    pickFirstRecord(applicantProfile?.applicant_special_categories);

  const studentInfo =
    pickFirstRecord(input.applicant_student_info) ||
    pickFirstRecord(applicantProfile?.applicant_student_info);

  const familyMembers = [
    ...toRecordArray(input.applicant_family_members),
    ...toRecordArray(applicantProfile?.applicant_family_members),
  ];

  return {
    profile,
    applicant_profiles: applicantProfile,
    user_addresses: address,
    applicant_household_info: householdInfo,
    applicant_special_categories: specialCategories,
    applicant_student_info: studentInfo,
    applicant_family_members: familyMembers,
  };
}

export function prepareProgramAIContext(input: ProgramAIContextInput): ProgramAIContext {
  const applicant = normalizeApplicant(input);
  const programs = toRecordArray(input.programs);
  const explicitEligibilityRules = toRecordArray(input.program_eligibility_rules);
  const eligibilityRules = collectProgramEligibility(programs, explicitEligibilityRules);
  const explicitRequirements = toRecordArray(input.program_requirements);
  const requirements = collectProgramRequirements(programs, explicitRequirements);
  const explicitSources = toRecordArray(input.program_requirement_sources);
  const requirementSources = collectRequirementSources(requirements, explicitSources);

  return {
    ...applicant,
    programs,
    program_eligibility_rules: eligibilityRules,
    program_requirements: requirements,
    program_requirement_sources: requirementSources,
  };
}

/*
  Supabase fetch guide (server-side):

  1) Fetch applicant with nested relations:
     - profiles
       -> user_addresses
       -> applicant_profiles
          -> applicant_household_info
          -> applicant_special_categories
          -> applicant_student_info
          -> applicant_family_members

  2) Fetch programs with nested relations:
     - programs
       -> program_eligibility_rules
       -> program_requirements
          -> program_requirement_sources

  3) Pass those records into prepareProgramAIContext(...) before prompting Groq.
*/
