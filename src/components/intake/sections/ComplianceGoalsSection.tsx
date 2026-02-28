'use client';

import { IntakeFormData, TRUST_SERVICE_CRITERIA } from '@/types/intake';
import FormSection from '../FormSection';
import { Input, RadioGroup, CheckboxGroup, InfoBox } from '../FormFields';

interface ComplianceGoalsSectionProps {
  data: Pick<IntakeFormData, 'targetCompletionDate' | 'soc2Type' | 'trustServiceCriteria'>;
  onChange: (data: Pick<IntakeFormData, 'targetCompletionDate' | 'soc2Type' | 'trustServiceCriteria'>) => void;
}

export default function ComplianceGoalsSection({ data, onChange }: ComplianceGoalsSectionProps) {
  const updateField = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
    onChange({ ...data, [field]: value });
  };

  const handleCriteriaChange = (values: string[]) => {
    if (!values.includes('security')) {
      values = ['security', ...values];
    }
    updateField('trustServiceCriteria', values);
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

      <CheckboxGroup
        label="Trust Service Criteria"
        options={TRUST_SERVICE_CRITERIA.map((tsc) => ({
          value: tsc.id,
          label: `${tsc.name}${tsc.required ? ' (Required)' : ''}`,
          description: tsc.description,
        }))}
        selectedValues={data.trustServiceCriteria}
        onChange={handleCriteriaChange}
        columns={1}
        helpText="Security is required. Select additional criteria based on your business needs."
      />

      <Input
        label="Target Completion Date"
        type="date"
        value={data.targetCompletionDate}
        onChange={(e) => updateField('targetCompletionDate', e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        helpText="When do you need to be audit-ready? We'll plan your sprints accordingly."
      />

      {data.trustServiceCriteria.length > 2 && (
        <InfoBox type="tip">
          You&apos;ve selected multiple Trust Service Criteria. This will increase the number
          of controls but provides more comprehensive coverage for your customers.
        </InfoBox>
      )}
    </FormSection>
  );
}
