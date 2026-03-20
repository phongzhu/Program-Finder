import { useEffect, useState } from 'react';
import { createInitialState, PROTOTYPE_ACCOUNTS, ROLE_LABELS } from '../data/prototypeSeed';
import {
  getHashPath,
  getHomeRoute,
  getLoginRoleFromPath,
  getLoginRoute,
  getRoleFromPath,
  getSectionFromPath,
  isStaffLoginPath,
  normalizePath,
  STAFF_LOGIN_ROUTE,
} from './router';

const STORAGE_KEYS = {
  session: 'programfinder-prototype-session',
  state: 'programfinder-prototype-state',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function sanitizeTransientAsset(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return '';
  }

  return normalized;
}

function createPersistableState(state) {
  return {
    ...state,
    programs: (state.programs || []).map((program) => ({
      ...program,
      imageReference: sanitizeTransientAsset(program.imageReference),
      image: sanitizeTransientAsset(program.image),
    })),
    documents: (state.documents || []).map((document) => ({
      ...document,
      fileUrl: sanitizeTransientAsset(document.fileUrl),
    })),
    applications: (state.applications || []).map((application) => ({
      ...application,
      requirementFiles: (application.requirementFiles || []).map((file) => ({
        ...file,
        fileUrl: sanitizeTransientAsset(file.fileUrl),
      })),
    })),
  };
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error?.name === 'QuotaExceededError') {
      console.warn(`Unable to persist ${key}: storage quota exceeded.`, error);
      return false;
    }

    console.warn(`Unable to persist ${key}.`, error);
    return false;
  }

  return true;
}

function getProgramById(programs, programId) {
  return programs.find((program) => program.id === programId);
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function computeProfileCompletion(profile) {
  const fields = [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.municipality,
    profile.barangay,
    profile.address,
    profile.birthDate,
    profile.civilStatus,
    profile.school,
    profile.course,
    profile.householdIncome,
    profile.specialCategory,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.max(40, Math.round((filled / fields.length) * 100));
}

function calculateApplicantAge(birthDateValue, referenceDate = new Date()) {
  if (!birthDateValue) {
    return null;
  }

  const birthDate = new Date(`${birthDateValue}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDelta = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function buildApplicantSnapshot(profile, session) {
  const age = calculateApplicantAge(profile?.birthDate);

  return {
    fullName: String(profile?.fullName || session?.name || '').trim(),
    email: String(profile?.email || session?.email || '').trim(),
    phone: String(profile?.phone || '').trim(),
    municipality: String(profile?.municipality || session?.municipality || '').trim(),
    barangay: String(profile?.barangay || '').trim(),
    address: String(profile?.address || '').trim(),
    birthDate: String(profile?.birthDate || '').trim(),
    age,
    civilStatus: String(profile?.civilStatus || '').trim(),
    school: String(profile?.school || '').trim(),
    course: String(profile?.course || '').trim(),
    householdIncome: String(profile?.householdIncome || '').trim(),
    specialCategory: String(profile?.specialCategory || '').trim(),
    profileCompleteness: Number(profile?.completeness) || computeProfileCompletion(profile || {}),
  };
}

function createSessionPayload(account) {
  return {
    role: account.role,
    email: account.email,
    name: account.name,
    title: account.title || ROLE_LABELS[account.role],
    office: account.office,
    municipality: account.municipality,
  };
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRoleTitle(role) {
  if (role === 'admin') {
    return 'Platform Administrator';
  }

  if (role === 'personnel') {
    return 'Government Personnel';
  }

  return 'Applicant';
}

function getManagedUserPassword(user) {
  if (!user) {
    return null;
  }

  if (user.password) {
    return user.password;
  }

  const seededAccount = PROTOTYPE_ACCOUNTS[user.role];
  if (
    seededAccount &&
    seededAccount.email.toLowerCase() === String(user.email).toLowerCase()
  ) {
    return seededAccount.password;
  }

  return null;
}

function matchesManagedUserPassword(user, password) {
  if (!user) {
    return false;
  }

  const attemptedPassword = String(password || '');
  const storedPassword = getManagedUserPassword(user);
  const seededAccount = PROTOTYPE_ACCOUNTS[user.role];
  const isSeededDemoAccount =
    seededAccount &&
    seededAccount.email.toLowerCase() === String(user.email).toLowerCase();

  if (storedPassword === attemptedPassword) {
    return true;
  }

  return isSeededDemoAccount && seededAccount.password === attemptedPassword;
}

function resolveManagedOffice(role, municipality, offices, preferredOffice) {
  if (role === 'applicant') {
    return 'Resident Applicant Portal';
  }

  if (role === 'admin') {
    return 'Provincial Program Management Office';
  }

  if (preferredOffice) {
    return preferredOffice;
  }

  const exactMatch = offices.find((office) => office.municipality === municipality);
  const provinceWide = offices.find((office) => office.municipality === 'Province-wide');

  return exactMatch?.name || provinceWide?.name || `${municipality} Municipal Office`;
}

function getAccessStatus(startDate, endDate) {
  const today = getTodayDateValue();

  if (endDate && endDate < today) {
    return 'Inactive';
  }

  if (startDate && startDate > today) {
    return 'Pending';
  }

  return 'Active';
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';

  for (let index = 0; index < 12; index += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return password;
}

function parseListInput(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRequirementDocument(documents, ownerEmail, requirementName) {
  return (documents || []).find(
    (document) =>
      document.ownerEmail === ownerEmail &&
      String(document.name || '').toLowerCase() === String(requirementName || '').toLowerCase()
  );
}

function buildRequirementFileSnapshot(documents, ownerEmail, requirementName) {
  const document = getRequirementDocument(documents, ownerEmail, requirementName);

  if (!document || (!document.fileUrl && !document.fileName)) {
    return null;
  }

  return {
    requirementName,
    fileName: document.fileName || document.name,
    fileUrl: document.fileUrl || '',
    fileType: document.fileType || document.category || 'File',
    uploadedAt: document.uploadedAt || '',
    status: document.status || 'Pending Review',
  };
}

function readNumericInput(value, fallback, defaultValue) {
  if (value === '' || value === null || value === undefined) {
    return Number(fallback) || defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number(fallback) || defaultValue;
}

function normalizeProgramPayload(payload, session, fallback = {}) {
  const summary = String(payload.summary ?? fallback.summary ?? '').trim();
  const slots = readNumericInput(payload.slots, fallback.slots, 30);
  const maxBeneficiaries = readNumericInput(payload.maxBeneficiaries, fallback.maxBeneficiaries, slots);

  return {
    title: String(payload.title ?? fallback.title ?? '').trim(),
    category: payload.category || fallback.category || '',
    sector: payload.sector || fallback.sector || '',
    programType: String(payload.programType ?? fallback.programType ?? 'Government Assistance Program').trim(),
    office: fallback.office || session?.office || '',
    municipality: payload.municipality || fallback.municipality || session?.municipality || '',
    applicationStartDate: payload.applicationStartDate ?? fallback.applicationStartDate ?? '',
    applicationEndDate: payload.applicationEndDate ?? fallback.applicationEndDate ?? '',
    deadline: payload.deadline ?? fallback.deadline ?? '',
    status: payload.status || fallback.status || 'Open',
    visibility: fallback.visibility || 'Public',
    applicants: Number(fallback.applicants) || 0,
    slots,
    maxBeneficiaries,
    fitScore: Number(fallback.fitScore) || 80,
    summary,
    description: summary || fallback.description || '',
    objective: String(payload.objective ?? fallback.objective ?? summary).trim(),
    benefits: String(payload.benefits ?? fallback.benefits ?? payload.additionalNotes ?? '').trim(),
    coverageNotes: String(payload.coverageNotes ?? fallback.coverageNotes ?? session?.municipality ?? '').trim(),
    submissionInstructions: String(payload.submissionInstructions ?? fallback.submissionInstructions ?? '').trim(),
    additionalNotes: String(payload.additionalNotes ?? fallback.additionalNotes ?? '').trim(),
    imageReference: payload.imageReference ?? fallback.imageReference ?? '',
    imageName: String(payload.imageName ?? fallback.imageName ?? '').trim(),
    requirements: parseListInput(payload.requirements ?? fallback.requirements),
    eligibility: parseListInput(payload.eligibility ?? fallback.eligibility),
    attachments: parseListInput(payload.attachments ?? fallback.attachments),
    archived: Boolean(fallback.archived),
  };
}

function hydrateState(storedState) {
  const defaults = createInitialState();

  if (!storedState) {
    return defaults;
  }

  const defaultProgramsById = new Map(defaults.programs.map((program) => [program.id, program]));
  const storedPrograms = storedState.programs?.length
    ? storedState.programs.map((program) => ({
        ...(defaultProgramsById.get(program.id) || {}),
        ...program,
      }))
    : defaults.programs;
  const missingPrograms = defaults.programs.filter(
    (program) => !storedPrograms.some((storedProgram) => storedProgram.id === program.id)
  );
  const defaultApplicationsById = new Map(defaults.applications.map((application) => [application.id, application]));
  const storedApplications = storedState.applications?.length
    ? storedState.applications.map((application) => ({
        ...(defaultApplicationsById.get(application.id) || {}),
        ...application,
      }))
    : defaults.applications;
  const missingApplications = defaults.applications.filter(
    (application) => !storedApplications.some((storedApplication) => storedApplication.id === application.id)
  );
  const defaultDocumentsById = new Map(defaults.documents.map((document) => [document.id, document]));
  const storedDocuments = storedState.documents?.length
    ? storedState.documents.map((document) => ({
        ...(defaultDocumentsById.get(document.id) || {}),
        ...document,
      }))
    : defaults.documents;
  const missingDocuments = defaults.documents.filter(
    (document) => !storedDocuments.some((storedDocument) => storedDocument.id === document.id)
  );

  return {
    ...defaults,
    ...storedState,
    programs: [...storedPrograms, ...missingPrograms],
    applications: [...storedApplications, ...missingApplications],
    documents: [...storedDocuments, ...missingDocuments],
    municipalities: storedState.municipalities?.length
      ? storedState.municipalities
      : defaults.municipalities,
  };
}

export function usePrototypeApp() {
  const [path, setPath] = useState(() => normalizePath(getHashPath()));
  const [session, setSession] = useState(() => readStorage(STORAGE_KEYS.session, null));
  const [data, setData] = useState(() => hydrateState(readStorage(STORAGE_KEYS.state, null)));
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
      setPath('/');
    }

    const handleHashChange = () => {
      setPath(normalizePath(getHashPath()));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.session, session);
  }, [session]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.state, createPersistableState(data));
  }, [data]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const navigate = (nextPath, options = {}) => {
    const normalized = normalizePath(nextPath);
    const target = `${window.location.pathname}${window.location.search}#${normalized}`;

    if (options.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.location.hash = normalized;
    }

    setPath(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loginRole = getLoginRoleFromPath(path);
    const roleFromPath = getRoleFromPath(path);
    const isStaffLogin = isStaffLoginPath(path);

    if (path === '/' && session) {
      navigate(getHomeRoute(session.role), { replace: true });
      return;
    }

    if (isStaffLogin && session) {
      navigate(getHomeRoute(session.role), { replace: true });
      return;
    }

    if (roleFromPath && roleFromPath !== 'login' && !session) {
      navigate(getLoginRoute(roleFromPath), { replace: true });
      return;
    }

    if (roleFromPath && roleFromPath !== 'login' && session && session.role !== roleFromPath) {
      navigate(getHomeRoute(session.role), { replace: true });
      return;
    }

    if (loginRole && session) {
      navigate(getHomeRoute(session.role), { replace: true });
    }
  }, [path, session]);

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone });
  };

  const authenticateManagedUser = (allowedRoles, form) => {
    const normalizedEmail = form.email.trim().toLowerCase();
    const managedUser = data.users.find(
      (user) =>
        allowedRoles.includes(user.role) &&
        user.email.toLowerCase() === normalizedEmail
    );

    if (managedUser) {
      if (managedUser.status !== 'Active') {
        return {
          ok: false,
          error: `This account is currently ${managedUser.status.toLowerCase()}.`,
        };
      }

      return matchesManagedUserPassword(managedUser, form.password)
        ? { ok: true, account: managedUser }
        : { ok: false };
    }

    const seededAccount = allowedRoles
      .map((role) => PROTOTYPE_ACCOUNTS[role])
      .find(
        (account) =>
          account.email.toLowerCase() === normalizedEmail &&
          account.password === form.password
      );

    return seededAccount ? { ok: true, account: seededAccount } : { ok: false };
  };

  const beginSession = (account) => {
    setSession(createSessionPayload(account));
    showToast(`${ROLE_LABELS[account.role]} dashboard loaded.`);
    navigate(getHomeRoute(account.role), { replace: true });
    return { ok: true };
  };

  const appendAuditLog = (draft, actor, role, action, module) => {
    draft.auditLogs.unshift({
      id: makeId('audit'),
      actor,
      role,
      action,
      module,
      time: new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date()),
    });
  };

  const addNotification = (draft, recipient, role, title, message, tone = 'neutral') => {
    draft.notifications.unshift({
      id: makeId('notification'),
      recipient,
      role,
      title,
      message,
      tone,
      unread: true,
      time: new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date()),
    });
  };

  const login = (role, form) => {
    const authentication = authenticateManagedUser([role], form);

    if (!authentication.ok) {
      return {
        ok: false,
        error: authentication.error || `Invalid credentials for the ${ROLE_LABELS[role]} portal.`,
      };
    }

    return beginSession(authentication.account);
  };

  const loginToStaffPortal = (form) => {
    const authentication = authenticateManagedUser(['admin', 'personnel'], form);

    if (!authentication.ok) {
      return {
        ok: false,
        error:
          authentication.error ||
          'Only admin and government personnel accounts can use this private login page.',
      };
    }

    return beginSession(authentication.account);
  };

  const logout = () => {
    const nextRoute = session
      ? ['admin', 'personnel'].includes(session.role)
        ? STAFF_LOGIN_ROUTE
        : getLoginRoute(session.role)
      : '/';
    setSession(null);
    navigate(nextRoute, { replace: true });
    showToast('Signed out of the prototype.', 'neutral');
  };

  const reset = () => {
    setData(createInitialState());
    setSession(null);
    navigate('/', { replace: true });
    showToast('Prototype reset to the default demo state.', 'neutral');
  };

  const selectProgram = (programId) => {
    setData((current) => {
      const draft = clone(current);
      draft.composer.programId = programId;
      return draft;
    });
  };

  const openProgramDetails = (programId) => {
    selectProgram(programId);
    navigate('/applicant/program-view');
  };

  const startApplication = (programId) => {
    setData((current) => {
      const draft = clone(current);
      draft.composer.programId = programId;
      draft.composer.attachedDocs = [];
      draft.composer.notes = '';
      return draft;
    });
    navigate('/applicant/program-apply');
    const program = getProgramById(data.programs, programId);
    showToast(`Application panel opened for ${program?.title || 'the selected program'}.`);
  };

  const toggleBookmark = (programId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const bookmarked = draft.bookmarks.includes(programId);
      draft.bookmarks = bookmarked
        ? draft.bookmarks.filter((item) => item !== programId)
        : [programId, ...draft.bookmarks];
      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        bookmarked ? 'Removed bookmarked program' : 'Bookmarked a program',
        'Bookmarks'
      );
      return draft;
    });
  };

  const updateComposerNotes = (notes) => {
    setData((current) => {
      const draft = clone(current);
      draft.composer.notes = notes;
      return draft;
    });
  };

  const clearComposer = () => {
    setData((current) => {
      const draft = clone(current);
      draft.composer = { programId: null, attachedDocs: [], notes: '' };
      return draft;
    });
  };

  const attachRequirement = (requirementName) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      if (!draft.composer.attachedDocs.includes(requirementName)) {
        draft.composer.attachedDocs.push(requirementName);
      }

      return draft;
    });
  };

  const uploadRequirementFile = (requirementName, payload) => {
    if (!session || !requirementName || !payload?.fileName || !payload?.fileUrl) {
      showToast('Select a file before attaching this requirement.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      const existingDocument = draft.documents.find(
        (document) =>
          document.ownerEmail === session.email &&
          document.name.toLowerCase() === String(requirementName).toLowerCase()
      );

      const nextDocument = {
        id: existingDocument?.id || makeId('document'),
        ownerEmail: session.email,
        name: requirementName,
        category: 'Application Requirement',
        status: 'Pending Review',
        uploadedAt: new Intl.DateTimeFormat('en-CA').format(new Date()),
        fileName: payload.fileName,
        fileType: payload.fileType || 'File',
        fileUrl: payload.fileUrl,
      };

      if (existingDocument) {
        if (
          existingDocument.fileUrl &&
          existingDocument.fileUrl.startsWith('blob:') &&
          existingDocument.fileUrl !== payload.fileUrl
        ) {
          URL.revokeObjectURL(existingDocument.fileUrl);
        }
        Object.assign(existingDocument, nextDocument);
      } else {
        draft.documents.unshift(nextDocument);
      }

      if (!draft.composer.attachedDocs.includes(requirementName)) {
        draft.composer.attachedDocs.push(requirementName);
      }

      return draft;
    });

    showToast(`${requirementName} attached to the application draft.`);
    return { ok: true };
  };

  const removeAttachedRequirement = (requirementName) => {
    setData((current) => {
      const draft = clone(current);
      draft.composer.attachedDocs = draft.composer.attachedDocs.filter((item) => item !== requirementName);
      return draft;
    });
  };

  const submitApplication = () => {
    if (!session) {
      return;
    }

    const selectedProgram = getProgramById(data.programs, data.composer.programId);
    if (!selectedProgram) {
      showToast('Select a program first.', 'warning');
      return;
    }

    const existingApplication = data.applications.find(
      (application) => application.applicantEmail === session.email && application.programId === selectedProgram.id
    );
    if (existingApplication) {
      showToast('You already have an application for this program.', 'warning');
      navigate('/applicant/manage-applications');
      return;
    }

    const missingRequirements = selectedProgram.requirements.filter(
      (requirement) =>
        !data.composer.attachedDocs.includes(requirement) ||
        !buildRequirementFileSnapshot(data.documents, session.email, requirement)
    );

    if (missingRequirements.length) {
      showToast('Attach all required documents before submitting.', 'warning');
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const applicantSnapshot = buildApplicantSnapshot(draft.applicantProfile, session);
      draft.applications.unshift({
        id: makeId('application'),
        applicantEmail: applicantSnapshot.email || session.email,
        applicantName: applicantSnapshot.fullName || session.name,
        programId: selectedProgram.id,
        office: selectedProgram.office,
        status: 'Submitted',
        submittedAt: new Intl.DateTimeFormat('en-CA').format(new Date()),
        completeness: 100,
        priority: 'Medium',
        notes: draft.composer.notes || 'Submitted through the applicant dashboard.',
        applicantSnapshot,
        documents: [...draft.composer.attachedDocs],
        requirementFiles: selectedProgram.requirements
          .map((requirement) => buildRequirementFileSnapshot(draft.documents, session.email, requirement))
          .filter(Boolean),
        history: [
          {
            time: new Intl.DateTimeFormat('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date()),
            status: 'Submitted',
            detail: 'Application submitted through the applicant dashboard.',
          },
        ],
      });

      addNotification(
        draft,
        session.email,
        'applicant',
        'Application submitted',
        `${selectedProgram.title} was submitted successfully.`,
        'success'
      );

      const assignedPersonnel = draft.users.find(
        (user) => user.role === 'personnel' && user.office === selectedProgram.office
      );

      if (assignedPersonnel) {
        addNotification(
          draft,
          assignedPersonnel.email,
          'personnel',
          'New applicant submission',
          `${session.name} submitted an application for ${selectedProgram.title}.`,
          'success'
        );
      }

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Submitted application for ${selectedProgram.title}`,
        'Applications'
      );

      draft.composer = { programId: selectedProgram.id, attachedDocs: [], notes: '' };
      return draft;
    });

    showToast(`${selectedProgram.title} submitted successfully.`);
    navigate('/applicant/manage-applications');
  };

  const uploadDocument = (name, category) => {
    if (!session || !name.trim()) {
      showToast('Enter a document name before uploading.', 'warning');
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.documents.unshift({
        id: makeId('document'),
        ownerEmail: session.email,
        name: name.trim(),
        category: category.trim() || 'General',
        status: 'Pending Review',
        uploadedAt: new Intl.DateTimeFormat('en-CA').format(new Date()),
      });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Uploaded document: ${name.trim()}`,
        'Documents'
      );

      return draft;
    });
  };

  const markNotificationsRead = () => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.notifications = draft.notifications.map((notification) =>
        notification.recipient === session.email ? { ...notification, unread: false } : notification
      );
      return draft;
    });
  };

  const saveApplicantProfile = (nextProfile) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.applicantProfile = {
        ...nextProfile,
        completeness: computeProfileCompletion(nextProfile),
      };

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        'Updated applicant profile information',
        'Profile'
      );

      return draft;
    });
  };

  const toggleProgramStatus = (programId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.programs.find((program) => program.id === programId);
      if (!target) {
        return draft;
      }

      if (target.archived) {
        return draft;
      }

      target.status = target.status === 'Open' ? 'Closed' : 'Open';
      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `${target.status === 'Open' ? 'Opened' : 'Closed'} program: ${target.title}`,
        'Program Listings'
      );
      return draft;
    });
  };

  const createProgram = (payload) => {
    const normalizedProgram = normalizeProgramPayload(payload, session);

    if (!session || !normalizedProgram.title) {
      showToast('Enter the program title before publishing.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      draft.programs.unshift({
        id: makeId('program'),
        ...normalizedProgram,
      });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Created program: ${normalizedProgram.title}`,
        'Program Listings'
      );

      return draft;
    });

    showToast(`${normalizedProgram.title} published.`);
    return { ok: true };
  };

  const updateProgram = (programId, payload) => {
    if (!session) {
      return { ok: false };
    }

    const existingProgram = data.programs.find((program) => program.id === programId);
    const normalizedProgram = normalizeProgramPayload(payload, session, existingProgram);

    if (!normalizedProgram.title) {
      showToast('Enter the program title before saving changes.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.programs.find((program) => program.id === programId);
      if (!target) {
        return draft;
      }

      Object.assign(target, normalizedProgram, { archived: Boolean(target.archived) });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Updated program: ${normalizedProgram.title}`,
        'Program Listings'
      );

      return draft;
    });

    showToast('Program details updated.', 'neutral');
    return { ok: true };
  };

  const archiveProgram = (programId) => {
    if (!session) {
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.programs.find((program) => program.id === programId);
      if (!target) {
        return draft;
      }

      target.archived = true;
      target.status = 'Closed';

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Archived program: ${target.title}`,
        'Program Listings'
      );

      return draft;
    });

    showToast('Program archived.', 'neutral');
    return { ok: true };
  };

  const deleteProgram = (programId) => {
    if (!session) {
      return { ok: false };
    }

    const target = data.programs.find((program) => program.id === programId);
    if (!target) {
      return { ok: false };
    }

    if (data.applications.some((application) => application.programId === programId)) {
      showToast('This program already has application records. Archive it instead of deleting.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      draft.programs = draft.programs.filter((program) => program.id !== programId);
      draft.bookmarks = draft.bookmarks.filter((bookmarkId) => bookmarkId !== programId);

      if (draft.composer.programId === programId) {
        draft.composer = { programId: null, attachedDocs: [], notes: '' };
      }

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Deleted program: ${target.title}`,
        'Program Listings'
      );

      return draft;
    });

    showToast('Program deleted.', 'neutral');
    return { ok: true };
  };

  const reviewApplication = (applicationId, nextStatus, detail) => {
    if (!session) {
      return;
    }

    const note = String(detail || '').trim();

    if (nextStatus === 'Rejected' && !note) {
      showToast('Add a rejection note before rejecting the application.', 'warning');
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.applications.find((application) => application.id === applicationId);
      if (!target) {
        return draft;
      }

      target.status = nextStatus;
      target.reviewedAt = new Intl.DateTimeFormat('en-CA').format(new Date());
      target.reviewerNote = note;
      target.rejectionReason = nextStatus === 'Rejected' ? note : '';
      target.followUpNote = nextStatus === 'Incomplete' ? note : '';
      target.history.unshift({
        time: new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date()),
        status: nextStatus,
        detail: note || `Application was marked as ${nextStatus.toLowerCase()}.`,
      });

      const program = draft.programs.find((item) => item.id === target.programId);
      addNotification(
        draft,
        target.applicantEmail,
        'applicant',
        `Application ${nextStatus.toLowerCase()}`,
        `${program?.title || 'Program'}: ${note || `Application was marked as ${nextStatus.toLowerCase()}.`}`,
        nextStatus === 'Approved' ? 'success' : nextStatus === 'Rejected' ? 'danger' : 'warning'
      );

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `${nextStatus} application for ${program?.title || 'a program'}`,
        'Application Decisions'
      );

      return draft;
    });

    showToast(`Application ${nextStatus.toLowerCase()} recorded.`, nextStatus === 'Rejected' ? 'neutral' : 'success');
  };

  const sendMessageToApplicants = (scope, title, message) => {
    if (!session) {
      return;
    }

    const recipients =
      scope === 'all'
        ? data.applications
            .filter((application) => application.office === session.office)
            .map((application) => application.applicantEmail)
        : [scope];

    setData((current) => {
      const draft = clone(current);
      [...new Set(recipients)].forEach((recipient) => {
        addNotification(draft, recipient, 'applicant', title, message, 'neutral');
      });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Sent notification: ${title}`,
        'Notifications'
      );

      return draft;
    });
  };

  const publishAnnouncement = (payload, audience) => {
    if (!session || !payload.title.trim()) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.announcements.unshift({
        id: makeId('announcement'),
        title: payload.title,
        message: payload.message,
        author: session.name,
        audience,
        office: session.office,
        date: new Intl.DateTimeFormat('en-CA').format(new Date()),
      });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Published announcement: ${payload.title}`,
        'Announcements'
      );

      return draft;
    });
  };

  const updateUserRole = (userId, nextRole) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId);
      if (!target) {
        return draft;
      }

      target.role = nextRole;
      target.title = getRoleTitle(nextRole);
      target.office = resolveManagedOffice(nextRole, target.municipality, draft.offices);
      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Changed ${target.name}'s role to ${ROLE_LABELS[nextRole]}`,
        'Account Management'
      );

      return draft;
    });
  };

  const toggleUserStatus = (userId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId);
      if (!target) {
        return draft;
      }

      const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';
      target.status = nextStatus;

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} ${target.name}'s account`,
        'Account Management'
      );

      return draft;
    });

    showToast('Account access updated.', 'neutral');
  };

  const createUserAccount = (payload) => {
    if (!session) {
      return { ok: false };
    }

    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const gmailPattern = /^[^\s@]+@gmail\.com$/i;

    if (!name || !email || !payload.role || !payload.municipality || !payload.accessStartDate || !payload.accessEndDate) {
      showToast('Complete the user invite form before sending access.', 'warning');
      return { ok: false };
    }

    if (!gmailPattern.test(email)) {
      showToast('Use a valid Gmail address for the invite.', 'warning');
      return { ok: false };
    }

    if (payload.accessEndDate < payload.accessStartDate) {
      showToast('The access end date must be after the start date.', 'warning');
      return { ok: false };
    }

    if (data.users.some((user) => user.email.toLowerCase() === email)) {
      showToast('That email address is already assigned to an account.', 'danger');
      return { ok: false };
    }

    const temporaryPassword = generateTemporaryPassword();
    const nextStatus = getAccessStatus(payload.accessStartDate, payload.accessEndDate);

    setData((current) => {
      const draft = clone(current);
      const office = resolveManagedOffice(payload.role, payload.municipality, draft.offices, payload.office);

      draft.users.unshift({
        id: makeId('user'),
        name,
        email,
        role: payload.role,
        title: getRoleTitle(payload.role),
        username: payload.username || email.split('@')[0],
        office,
        municipality: payload.municipality,
        status: nextStatus,
        lastActive: 'Never',
        dateAssigned: getTodayDateValue(),
        accessStartDate: payload.accessStartDate,
        accessEndDate: payload.accessEndDate,
        password: temporaryPassword,
        inviteStatus: 'Queued',
      });

      addNotification(
        draft,
        email,
        payload.role,
        'Account invite prepared',
        `Your ${ROLE_LABELS[payload.role]} access is scheduled from ${payload.accessStartDate} to ${payload.accessEndDate}. Temporary password delivery was queued to Gmail.`,
        'success'
      );

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Created ${ROLE_LABELS[payload.role]} account for ${name}`,
        'Account Management'
      );

      return draft;
    });

    showToast('User access created. A temporary password was queued for Gmail delivery.');
    return { ok: true };
  };

  const addMunicipality = (payload) => {
    if (!session || !payload.name.trim()) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.municipalities = draft.municipalities || [];
      draft.municipalities.unshift({
        id: makeId('municipality'),
        name: payload.name.trim(),
        province: payload.province?.trim() || 'Bulacan',
        description:
          payload.description?.trim() ||
          `${payload.name.trim()} municipality coordination record for offices and personnel assignments.`,
        status: 'Active',
        createdAt: getTodayDateValue(),
        updatedAt: getTodayDateValue(),
        contactNumber: payload.contactNumber?.trim() || 'Not provided',
        emailAddress: payload.emailAddress?.trim() || '',
      });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Added municipality: ${payload.name.trim()}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality record added.');
  };

  const updateMunicipality = (municipalityId, payload) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = (draft.municipalities || []).find((municipality) => municipality.id === municipalityId);
      if (!target) {
        return draft;
      }

      target.name = payload.name?.trim() || target.name;
      target.province = payload.province?.trim() || target.province;
      target.description = payload.description?.trim() || target.description;
      target.contactNumber = payload.contactNumber?.trim() || target.contactNumber;
      target.emailAddress = payload.emailAddress?.trim() || target.emailAddress;
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Updated municipality: ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality record updated.', 'neutral');
  };

  const toggleMunicipalityStatus = (municipalityId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = (draft.municipalities || []).find((municipality) => municipality.id === municipalityId);
      if (!target) {
        return draft;
      }

      target.status = target.status === 'Active' ? 'Inactive' : 'Active';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `${target.status === 'Active' ? 'Activated' : 'Deactivated'} municipality ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality status updated.', 'neutral');
  };

  const archiveMunicipality = (municipalityId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = (draft.municipalities || []).find((municipality) => municipality.id === municipalityId);
      if (!target) {
        return draft;
      }

      target.status = 'Archived';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Archived municipality ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Municipality archived.', 'neutral');
  };

  const addOffice = (payload) => {
    if (!session || !payload.name.trim()) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.offices.unshift({
        id: makeId('office'),
        name: payload.name.trim(),
        type: payload.type?.trim() || 'Municipal Office',
        municipality: payload.municipality?.trim() || 'Unassigned',
        province: payload.province?.trim() || 'Bulacan',
        address: payload.address?.trim() || '',
        contactNumber: payload.contactNumber?.trim() || 'Not provided',
        emailAddress: payload.emailAddress?.trim() || '',
        officeHours: payload.officeHours?.trim() || 'Mon-Fri, 8:00 AM - 5:00 PM',
        status: payload.status || 'Active',
        lead: payload.lead?.trim() || 'To be assigned',
        createdAt: getTodayDateValue(),
        updatedAt: getTodayDateValue(),
        description: payload.description?.trim() || `${payload.name.trim()} office record`,
      });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Registered office: ${payload.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office record added.');
  };

  const updateOffice = (officeId, payload) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.offices.find((office) => office.id === officeId);
      if (!target) {
        return draft;
      }

      target.name = payload.name?.trim() || target.name;
      target.type = payload.type?.trim() || target.type;
      target.municipality = payload.municipality?.trim() || target.municipality;
      target.province = payload.province?.trim() || target.province;
      target.address = payload.address?.trim() || target.address;
      target.contactNumber = payload.contactNumber?.trim() || target.contactNumber;
      target.emailAddress = payload.emailAddress?.trim() || target.emailAddress;
      target.officeHours = payload.officeHours?.trim() || target.officeHours;
      target.description = payload.description?.trim() || target.description;
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Updated office: ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office record updated.', 'neutral');
  };

  const toggleOfficeStatus = (officeId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.offices.find((office) => office.id === officeId);
      if (!target) {
        return draft;
      }

      target.status = target.status === 'Active' ? 'Inactive' : 'Active';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `${target.status === 'Active' ? 'Activated' : 'Deactivated'} office ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office status updated.', 'neutral');
  };

  const archiveOffice = (officeId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.offices.find((office) => office.id === officeId);
      if (!target) {
        return draft;
      }

      target.status = 'Archived';
      target.updatedAt = getTodayDateValue();

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Archived office ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Office archived.', 'neutral');
  };

  const updatePersonnelAssignment = (userId, payload) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId && user.role === 'personnel');
      if (!target) {
        return draft;
      }

      target.municipality = payload.municipality?.trim() || '';
      target.office = payload.office?.trim() || '';
      target.title = payload.role?.trim() || target.title || 'Government Personnel';
      target.dateAssigned = payload.dateAssigned || getTodayDateValue();
      target.accessStartDate = payload.accessStartDate || target.accessStartDate;
      target.accessEndDate = payload.accessEndDate || target.accessEndDate;
      target.status =
        payload.status ||
        getAccessStatus(target.accessStartDate || getTodayDateValue(), target.accessEndDate);

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Updated personnel assignment for ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Personnel assignment updated.', 'neutral');
  };

  const resetUserCredentials = (userId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId);
      if (!target) {
        return draft;
      }

      target.password = generateTemporaryPassword();
      target.inviteStatus = 'Credentials Reset';

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Reset access credentials for ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Temporary credentials regenerated.', 'neutral');
  };

  const removePersonnelAssignment = (userId) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      const target = draft.users.find((user) => user.id === userId && user.role === 'personnel');
      if (!target) {
        return draft;
      }

      target.municipality = '';
      target.office = '';
      target.status = 'Inactive';
      target.inviteStatus = 'Assignment Removed';

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Removed municipality assignment for ${target.name}`,
        'Offices & Municipalities'
      );

      return draft;
    });

    showToast('Personnel assignment removed.', 'neutral');
  };

  const addTaxonomyItem = (type, name) => {
    if (!session || !name.trim()) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      if (type === 'category') {
        draft.categories.unshift({ id: makeId('category'), name: name.trim(), programCount: 0 });
      } else {
        draft.sectors.unshift({ id: makeId('sector'), name: name.trim() });
      }

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Added ${type}: ${name.trim()}`,
        'Categories & Sectors'
      );

      return draft;
    });
  };

  const toggleSetting = (key) => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.settings[key] = !draft.settings[key];
      appendAuditLog(draft, session.name, ROLE_LABELS[session.role], `Toggled setting: ${key}`, 'System Settings');
      return draft;
    });
  };

  const updateRetentionDays = (days) => {
    setData((current) => {
      const draft = clone(current);
      draft.settings.auditRetentionDays = days;
      return draft;
    });
  };

  const createBackup = () => {
    if (!session) {
      return;
    }

    setData((current) => {
      const draft = clone(current);
      draft.backupHistory.unshift({
        id: makeId('backup'),
        date: new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date()),
        type: 'Manual Snapshot',
        status: 'Completed',
        size: '85 MB',
      });

      appendAuditLog(draft, session.name, ROLE_LABELS[session.role], 'Created manual backup snapshot', 'Backup & Restore');
      return draft;
    });
  };

  const restoreBackup = (payload) => {
    if (!session) {
      return { ok: false };
    }

    const fileName = payload?.fileName?.trim();

    if (!fileName) {
      showToast('Select a restore file before starting the database restore.', 'warning');
      return { ok: false };
    }

    setData((current) => {
      const draft = clone(current);
      draft.restoreHistory = draft.restoreHistory || [];
      draft.restoreHistory.unshift({
        id: makeId('restore'),
        date: new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date()),
        source: payload.source || 'Uploaded Backup File',
        fileName,
        size: payload.size || 'Uploaded file',
        status: 'Completed',
        initiatedBy: session.name,
      });

      appendAuditLog(
        draft,
        session.name,
        ROLE_LABELS[session.role],
        `Restored database from ${fileName}`,
        'Backup & Restore'
      );

      return draft;
    });

    showToast('Database restore completed from the uploaded file.');
    return { ok: true };
  };

  return {
    path,
    session,
    data,
    toast,
    navigate,
    login,
    loginToStaffPortal,
    logout,
    reset,
    roleFromPath: getRoleFromPath(path),
    sectionFromPath: getSectionFromPath(path),
    loginRoleFromPath: getLoginRoleFromPath(path),
    isStaffLoginRoute: isStaffLoginPath(path),
    actions: {
      openProgramDetails,
      startApplication,
      toggleBookmark,
      updateComposerNotes,
      clearComposer,
      attachRequirement,
      uploadRequirementFile,
      removeAttachedRequirement,
      submitApplication,
      uploadDocument,
      markNotificationsRead,
      saveApplicantProfile,
      createProgram,
      updateProgram,
      archiveProgram,
      deleteProgram,
      toggleProgramStatus,
      reviewApplication,
      sendMessageToApplicants,
      publishAnnouncement,
      updateUserRole,
      toggleUserStatus,
      createUserAccount,
      addMunicipality,
      updateMunicipality,
      toggleMunicipalityStatus,
      archiveMunicipality,
      addOffice,
      updateOffice,
      toggleOfficeStatus,
      archiveOffice,
      updatePersonnelAssignment,
      resetUserCredentials,
      removePersonnelAssignment,
      addTaxonomyItem,
      toggleSetting,
      updateRetentionDays,
      createBackup,
      restoreBackup,
    },
  };
}
