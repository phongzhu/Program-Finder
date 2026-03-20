export function getProgramById(programs, programId) {
  return programs.find((program) => program.id === programId);
}

export function getApplicantApplications(data, session) {
  return data.applications.filter((application) => application.applicantEmail === session.email);
}

export function getApplicantNotifications(data, session) {
  return data.notifications.filter((notification) => notification.recipient === session.email);
}

export function getApplicantDocuments(data, session) {
  return data.documents.filter((document) => document.ownerEmail === session.email);
}
