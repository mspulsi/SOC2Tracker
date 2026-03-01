'use client';

import { IntakeFormData } from '@/types/intake';
import FormSection from '../FormSection';
import { RadioGroup, InfoBox, Input } from '../FormFields';

interface ComplianceGoalsSectionProps {
  data: Pick<IntakeFormData, 'targetCompletionDate' | 'soc2Type'>;
  onChange: (data: Pick<IntakeFormData, 'targetCompletionDate' | 'soc2Type'>) => void;
}

export default function ComplianceGoalsSection({ data, onChange }: ComplianceGoalsSectionProps) {
  const updateField = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Compliance Goals"
      description="Let's define your SOC 2 objectives and timeline."
    >
      <RadioGroup
        label="SOC 2 Report Type"
        name="soc2Type"
        options={[
          {
            value: 'type1',
            label: 'Type 1',
            description:
              'Point-in-time assessment. Faster to achieve, good for initial certification.',
          },
          {
            value: 'type2',
            label: 'Type 2',
            description:
              'Assessment over a period (usually 6-12 months). More comprehensive, often required by enterprise customers.',
          },
        ]}
        selectedValue={data.soc2Type}
        onChange={(value) => updateField('soc2Type', value as 'type1' | 'type2')}
      />

      <InfoBox type="info">
        <strong>Type 1</strong> verifies your controls are designed properly at a specific point in time.
        <br />
        <strong>Type 2</strong> verifies your controls are operating effectively over a period (typically 3-12 months).
        <br /><br />
        Most companies start with Type 1, then progress to Type 2.
      </InfoBox>

      <Input
        label="Target Completion Date"
        type="date"
        value={data.targetCompletionDate}
        onChange={(e) => updateField('targetCompletionDate', e.target.value)}
        helpText="When do you need to be audit-ready? Leave blank if unsure."
      />

      <InfoBox type="tip">
        We&apos;ll automatically determine which Trust Service Criteria (Security, Availability, 
        Confidentiality, Processing Integrity, Privacy) apply to your organization based on 
        your answers about data handling and business requirements.
      </InfoBox>
    </FormSection>
  );
}
