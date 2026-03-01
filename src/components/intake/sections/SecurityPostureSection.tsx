'use client';

import { SecurityAndOrg, CURRENT_COMPLIANCES, SECURITY_RESPONSIBLE_OPTIONS } from '@/types/intake';
import FormSection from '../FormSection';
import { Select, Toggle, CheckboxGroup, InfoBox, Input } from '../FormFields';

interface SecurityAndOrgSectionProps {
  data: SecurityAndOrg;
  onChange: (data: SecurityAndOrg) => void;
}

export default function SecurityAndOrgSection({ data, onChange }: SecurityAndOrgSectionProps) {
  const updateField = <K extends keyof SecurityAndOrg>(
    field: K,
    value: SecurityAndOrg[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Security & Organizational Structure"
      description="Understanding your team structure helps us tailor recommendations for your organization."
    >
      <Select
        label="Who is responsible for security at your company?"
        options={SECURITY_RESPONSIBLE_OPTIONS}
        value={data.securityResponsible}
        onChange={(e) => updateField('securityResponsible', e.target.value)}
        required
      />

      {data.securityResponsible === 'No one assigned yet' && (
        <InfoBox type="info">
          No problem! One of the first steps in your compliance roadmap will be designating
          a security owner. This doesn&apos;t need to be a full-time role.
        </InfoBox>
      )}

      <Toggle
        label="Contractors or External Developers"
        description="Do you use contractors or external developers who have access to your systems or code?"
        checked={data.usesContractors}
        onChange={(checked) => updateField('usesContractors', checked)}
      />

      {data.usesContractors && (
        <Input
          label="Describe your contractor/external developer usage"
          value={data.contractorDescription}
          onChange={(e) => updateField('contractorDescription', e.target.value)}
          placeholder="e.g., 2 offshore developers with code access, freelance designer with limited access"
          helpText="This helps us understand access control requirements"
        />
      )}

      <CheckboxGroup
        label="Current Compliance Certifications"
        options={[...CURRENT_COMPLIANCES]}
        selectedValues={data.currentCompliances}
        onChange={(values) => updateField('currentCompliances', values)}
        helpText="Select any certifications you currently hold"
        columns={2}
      />

      {data.currentCompliances.length > 0 && !data.currentCompliances.includes('None') && (
        <InfoBox type="tip">
          Great! Your existing compliance work will accelerate your SOC 2 journey.
          Many controls overlap between frameworks.
        </InfoBox>
      )}
    </FormSection>
  );
}
