import { canReviewApplicants } from 'Utils/staffHierarchy';

export function getProgramById(programs, programId) {
  return programs.find((program) => program.id === programId);
}

export function getManagedApplications(data, session) {
  if (!session || !canReviewApplicants(session)) {
    return [];
  }

  return data.applications.filter((application) => {
    const isManagedOffice = application.office === session.office;
    const normalizedStatus = String(application.status || '').trim().toLowerCase();
    const isDraft = normalizedStatus === 'draft';
    return isManagedOffice && !isDraft;
  });
}

export function getManagedPrograms(data, session) {
  const programIds = new Set(getManagedApplications(data, session).map((application) => application.programId));
  return data.programs.filter((program) => program.office === session.office || programIds.has(program.id));
}

export function getOfficePrograms(data, session) {
  return data.programs.filter((program) => program.office === session.office);
}

export function getOfficeApplications(data, session) {
  return data.applications.filter((application) => application.office === session.office);
}

export function getOfficeNotifications(data, session) {
  return data.notifications.filter(
    (notification) =>
      notification.recipientUserId === session.id ||
      notification.recipient === session.id ||
      notification.recipient === session.email
  );
}
