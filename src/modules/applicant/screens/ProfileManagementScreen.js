import { useEffect, useState } from 'react';
import { FormField, SectionHeading } from '../../../shared/components/ui';

export default function ProfileManagementScreen({ data, actions }) {
  const [form, setForm] = useState(data.applicantProfile);

  useEffect(() => {
    setForm(data.applicantProfile);
  }, [data.applicantProfile]);

  return (
    <div className="content-grid">
      <div className="section-card section-card-wide">
        <SectionHeading eyebrow="Applicant information" title="Profile management" text="Complete and maintain your personal details before applying to government assistance programs." />
        <div className="profile-grid">
          <FormField label="Full name" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} />
          <FormField label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <FormField label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <FormField label="Municipality" value={form.municipality} onChange={(value) => setForm({ ...form, municipality: value })} />
          <FormField label="Barangay" value={form.barangay} onChange={(value) => setForm({ ...form, barangay: value })} />
          <FormField label="Birth date" value={form.birthDate} onChange={(value) => setForm({ ...form, birthDate: value })} />
          <FormField label="Civil status" value={form.civilStatus} onChange={(value) => setForm({ ...form, civilStatus: value })} />
          <FormField label="School" value={form.school} onChange={(value) => setForm({ ...form, school: value })} />
          <FormField label="Course" value={form.course} onChange={(value) => setForm({ ...form, course: value })} />
          <FormField label="Household income" value={form.householdIncome} onChange={(value) => setForm({ ...form, householdIncome: value })} />
          <FormField label="Special category" value={form.specialCategory} onChange={(value) => setForm({ ...form, specialCategory: value })} />
          <FormField label="Address" type="textarea" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        </div>
        <div className="card-actions">
          <button className="primary-button" onClick={() => actions.saveApplicantProfile(form)}>
            Save profile
          </button>
        </div>
      </div>

      <div className="section-card">
        <SectionHeading eyebrow="Completion" title="Readiness score" />
        <div className="score-panel">
          <strong>{data.applicantProfile.completeness}%</strong>
          <small>Current profile completion</small>
        </div>
      </div>
    </div>
  );
}
