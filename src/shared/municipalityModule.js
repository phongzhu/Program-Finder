import { BULACAN_MUNICIPALITIES } from '../data/prototypeSeed';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseDateLike(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i);
  if (!match) {
    return new Date(NaN);
  }

  const [, datePart, hourPart, minutePart, meridiem] = match;
  if (!hourPart || !minutePart) {
    return new Date(`${datePart}T12:00:00`);
  }

  let hours = Number(hourPart);
  if (meridiem.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (meridiem.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day, hours, Number(minutePart));
}

function formatDisplayDate(value) {
  const parsed = parseDateLike(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || 'Not set';
  }

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function formatRelativeTime(value) {
  const parsed = parseDateLike(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || 'Not set';
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - parsed.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)} min ago`;
  }

  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(diffMinutes / 1440);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function buildApplicationSummary(applications) {
  return ['Submitted', 'For Review', 'Incomplete', 'Approved', 'Rejected'].map((status) => ({
    status,
    count: applications.filter((application) => application.status === status).length,
  }));
}

function getUsername(user) {
  if (user.username) {
    return user.username;
  }

  const [localPart] = String(user.email || '').split('@');
  return localPart || slugify(user.name || user.id || 'user');
}

function getMunicipalitySource(data) {
  return data.municipalities?.length ? data.municipalities : BULACAN_MUNICIPALITIES;
}

function buildOfficeActivity(data, office) {
  const auditItems = (data.auditLogs || [])
    .filter(
      (log) =>
        log.action?.includes(office.name) ||
        log.action?.includes(office.municipality) ||
        log.module?.includes('Program') ||
        log.module?.includes('Applications')
    )
    .map((log) => ({
      id: `audit-${log.id}`,
      actor: log.actor,
      detail: log.action,
      scope: log.module,
      time: log.time,
      timestamp: parseDateLike(log.time).getTime(),
    }));

  const programItems = (data.programs || [])
    .filter((program) => program.office === office.name)
    .map((program) => ({
      id: `program-${program.id}`,
      actor: program.office,
      detail: `${program.title} is ${program.visibility?.toLowerCase() || 'visible'} for applicants`,
      scope: 'Programs',
      time: office.updatedAt,
      timestamp: parseDateLike(office.updatedAt).getTime(),
    }));

  const applicationItems = (data.applications || [])
    .filter((application) => application.office === office.name)
    .map((application) => ({
      id: `application-${application.id}`,
      actor: application.applicantName,
      detail: `Application ${application.id} is currently ${application.status}`,
      scope: 'Applications',
      time: application.submittedAt,
      timestamp: parseDateLike(application.submittedAt).getTime(),
    }));

  return [...auditItems, ...programItems, ...applicationItems]
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5);
}

function buildMunicipalityActivity(data, municipalityName, officeNames) {
  const auditItems = (data.auditLogs || [])
    .filter(
      (log) =>
        log.action?.includes(municipalityName) ||
        officeNames.some((officeName) => log.action?.includes(officeName))
    )
    .map((log) => ({
      id: `audit-${log.id}`,
      actor: log.actor,
      detail: log.action,
      scope: log.module,
      time: log.time,
      timestamp: parseDateLike(log.time).getTime(),
    }));

  const announcementItems = (data.announcements || [])
    .filter(
      (announcement) =>
        officeNames.includes(announcement.office) ||
        announcement.office === municipalityName
    )
    .map((announcement) => ({
      id: `announcement-${announcement.id}`,
      actor: announcement.author,
      detail: announcement.title,
      scope: 'Announcements',
      time: announcement.date,
      timestamp: parseDateLike(announcement.date).getTime(),
    }));

  const applicationItems = (data.applications || [])
    .filter((application) => officeNames.includes(application.office))
    .map((application) => ({
      id: `application-${application.id}`,
      actor: application.applicantName,
      detail: `${application.id} is ${application.status}`,
      scope: 'Applications',
      time: application.submittedAt,
      timestamp: parseDateLike(application.submittedAt).getTime(),
    }));

  return [...auditItems, ...announcementItems, ...applicationItems]
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 6);
}

export function buildMunicipalityModuleData(data) {
  const municipalitySource = getMunicipalitySource(data);
  const users = data.users || [];

  const officeRecords = (data.offices || []).map((office, index) => {
    const assignedPersonnel = users.filter(
      (user) => user.role === 'personnel' && user.office === office.name
    );
    const programsHandled = (data.programs || []).filter((program) => program.office === office.name);
    const applicationsReceived = (data.applications || []).filter(
      (application) => application.office === office.name
    );

    const fallbackMunicipality = municipalitySource.find((municipality) => municipality.name === office.municipality);

    return {
      id: office.id || `office-generated-${index + 1}`,
      officeId: office.id || `office-generated-${index + 1}`,
      name: office.name,
      type: office.type || 'Municipal Office',
      municipality: office.municipality || 'Unassigned',
      province: office.province || fallbackMunicipality?.province || 'Bulacan',
      address:
        office.address ||
        `${office.municipality || 'Bulacan'} Government Center, ${fallbackMunicipality?.province || 'Bulacan'}`,
      contactNumber: office.contactNumber || 'Not provided',
      emailAddress:
        office.emailAddress ||
        office.email ||
        `${slugify(office.name)}@bulacan.gov.ph`,
      officeHours: office.officeHours || 'Mon-Fri, 8:00 AM - 5:00 PM',
      status: office.status || 'Active',
      lead: office.lead || assignedPersonnel[0]?.name || 'To be assigned',
      description:
        office.description ||
        `${office.name} manages municipality-facing service coordination, program visibility, and application monitoring.`,
      createdAt: office.createdAt || '2026-01-15',
      updatedAt: office.updatedAt || '2026-03-18',
      programsAssigned: programsHandled.length,
      programsHandled,
      personnelAssigned: assignedPersonnel.length,
      assignedPersonnel,
      applicationsReceived: applicationsReceived.length,
      applicationSummary: buildApplicationSummary(applicationsReceived),
      recentActivity: buildOfficeActivity(data, {
        ...office,
        name: office.name,
        municipality: office.municipality || 'Unassigned',
        updatedAt: office.updatedAt || '2026-03-18',
      }),
    };
  });

  const personnelAssignments = users
    .filter((user) => user.role === 'personnel')
    .map((user, index) => ({
      id: user.id,
      personnelId: user.personnelId || `PER-${String(index + 1).padStart(3, '0')}`,
      fullName: user.name,
      email: user.email,
      username: getUsername(user),
      assignedMunicipality: user.municipality || 'Unassigned',
      assignedOffice: user.office || 'Unassigned',
      role: user.title || 'Government Personnel',
      status: user.status || 'Inactive',
      dateAssigned: user.dateAssigned || user.accessStartDate || '2026-03-20',
      accessStartDate: user.accessStartDate || '',
      accessEndDate: user.accessEndDate || '',
      inviteStatus: user.inviteStatus || 'Delivered',
    }));

  const municipalityRecords = municipalitySource.map((municipality, index) => {
    const offices = officeRecords.filter((office) => office.municipality === municipality.name);
    const personnel = personnelAssignments.filter(
      (assignment) => assignment.assignedMunicipality === municipality.name
    );
    const officeNames = offices.map((office) => office.name);
    const linkedPrograms = (data.programs || []).filter(
      (program) => officeNames.includes(program.office) || program.municipality === municipality.name
    );
    const linkedApplications = (data.applications || []).filter((application) =>
      officeNames.includes(application.office)
    );

    return {
      id: municipality.id || `municipality-generated-${index + 1}`,
      municipalityId: municipality.id || `municipality-generated-${index + 1}`,
      name: municipality.name,
      province: municipality.province || 'Bulacan',
      description:
        municipality.description ||
        `${municipality.name} local government coordination record for offices, personnel assignments, and program monitoring.`,
      status: municipality.status || 'Active',
      createdAt: municipality.createdAt || '2026-01-10',
      updatedAt: municipality.updatedAt || '2026-03-18',
      contactNumber: municipality.contactNumber || 'Not provided',
      emailAddress:
        municipality.emailAddress ||
        municipality.email ||
        `${slugify(municipality.name)}@bulacan.gov.ph`,
      officesCount: offices.length,
      offices,
      assignedPersonnelCount: personnel.length,
      assignedPersonnel: personnel,
      linkedPrograms,
      totalApplications: linkedApplications.length,
      recentActivity: buildMunicipalityActivity(data, municipality.name, officeNames),
    };
  });

  const assignedPersonnel = personnelAssignments.filter(
    (assignment) => assignment.assignedMunicipality !== 'Unassigned'
  );
  const unassignedPersonnel = personnelAssignments.filter(
    (assignment) => assignment.assignedMunicipality === 'Unassigned'
  );
  const activeMunicipalities = municipalityRecords.filter(
    (municipality) => municipality.status === 'Active'
  );
  const activeOffices = officeRecords.filter((office) => office.status === 'Active');
  const municipalityWithMostOffices = municipalityRecords.reduce(
    (leader, municipality) =>
      municipality.officesCount > (leader?.officesCount || 0) ? municipality : leader,
    null
  );
  const recentlyUpdatedOffices = [...officeRecords]
    .sort((left, right) => parseDateLike(right.updatedAt) - parseDateLike(left.updatedAt))
    .slice(0, 3);

  return {
    municipalities: municipalityRecords,
    offices: officeRecords,
    personnelAssignments,
    summary: {
      totalMunicipalities: municipalityRecords.length,
      totalOffices: officeRecords.length,
      activeMunicipalities: activeMunicipalities.length,
      activeOffices: activeOffices.length,
      totalPersonnelAssigned: assignedPersonnel.length,
      unassignedPersonnel: unassignedPersonnel.length,
      municipalityWithMostOffices,
      recentlyUpdatedOffices,
    },
  };
}

export function getPersonnelScope(moduleData, session) {
  const municipality = moduleData.municipalities.find(
    (item) => item.name === session.municipality
  );
  const assignedOffice =
    moduleData.offices.find((office) => office.name === session.office) || null;
  const officesInMunicipality = moduleData.offices.filter(
    (office) => office.municipality === session.municipality
  );
  const assignment =
    moduleData.personnelAssignments.find((item) => item.email === session.email) || null;

  return {
    municipality,
    assignedOffice,
    officesInMunicipality,
    assignment,
    programsInMunicipality: (municipality?.linkedPrograms || []).length,
  };
}

export function formatModuleDate(value) {
  return formatDisplayDate(value);
}

export function formatModuleRelativeTime(value) {
  return formatRelativeTime(value);
}
