'use client';

import { SecurityPosture, CURRENT_COMPLIANCES, SECURITY_TEAM_SIZES } from '@/types/intake';
import FormSection from '../FormSection';
import { Select, Toggle, CheckboxGroup, InfoBox } from '../FormFields';

interface SecurityPostureSectionProps {
  data: SecurityPosture;
  onChange: (data: SecurityPosture) => void;
}

export default function SecurityPostureSection({ data, onChange }: SecurityPostureSectionProps) {
  const updateField = <K extends keyof SecurityPosture>(
    field: K,
    value: SecurityPosture[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Current Security Posture"
      description="Understanding your existing security measures helps us identify gaps and build on your strengths."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Toggle
          label="Dedicated Security Team/Personnel"
          description="Do you have staff focused on security?"
          checked={data.hasSecurityTeam}
          onChange={(checked) => updateField('hasSecurityTeam', checked)}
        />

        {data.hasSecurityTeam && (
          <Select
            label="Security Team Size"
            options={SECURITY_TEAM_SIZES}
            value={data.securityTeamSize}
            onChange={(e) => updateField('securityTeamSize', e.target.value)}
          />
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Existing Security Measures</h3>

        <Toggle
          label="Security Policies"
          description="Do you have documented security policies (acceptable use, data handling, etc.)?"
          checked={data.hasSecurityPolicies}
          onChange={(checked) => updateField('hasSecurityPolicies', checked)}
        />

        <Toggle
          label="Incident Response Plan"
          description="Do you have a documented plan for responding to security incidents?"
          checked={data.hasIncidentResponsePlan}
          onChange={(checked) => updateField('hasIncidentResponsePlan', checked)}
        />

        <Toggle
          label="Vulnerability Management"
          description="Do you regularly scan for and remediate vulnerabilities?"
          checked={data.hasVulnerabilityManagement}
          onChange={(checked) => updateField('hasVulnerabilityManagement', checked)}
        />

        <Toggle
          label="Penetration Testing"
          description="Have you conducted penetration testing in the past year?"
          checked={data.hasPenetrationTesting}
          onChange={(checked) => updateField('hasPenetrationTesting', checked)}
        />

        <Toggle
          label="Security Awareness Training"
          description="Do employees receive regular security training?"
          checked={data.hasSecurityAwareness}
          onChange={(checked) => updateField('hasSecurityAwareness', checked)}
        />
      </div>

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

      {!data.hasSecurityPolicies && (
        <InfoBox type="info">
          Don&apos;t worry if you don&apos;t have formal policies yet. Creating these will be
          part of your compliance roadmap, and we&apos;ll provide templates to help.
        </InfoBox>
      )}
    </FormSection>
  );
}
