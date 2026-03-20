export function getProgramById(programs, programId) {
  return programs.find((program) => program.id === programId);
}

export function getOfficePrograms(data, session) {
  return data.programs.filter((program) => program.office === session.office);
}

export function getOfficeApplications(data, session) {
  return data.applications.filter((application) => application.office === session.office);
}

export function getOfficeNotifications(data, session) {
  return data.notifications.filter((notification) => notification.recipient === session.email);
}
