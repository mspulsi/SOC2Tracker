'use client';

import { IntakeFormData, TRUST_SERVICE_CRITERIA } from '@/types/intake';
import FormSection from '../FormSection';
import { RadioGroup, CheckboxGroup, InfoBox, Toggle } from '../FormFields';

interface ComplianceGoalsSectionProps {
  data: Pick<IntakeFormData, 'targetCompletionDate' | 'soc2Type' | 'trustServiceCriteria' | 'wantsSprintPlan' | 'soc2Stage' | 'targetDateRange'>;
  onChange: (data: Pick<IntakeFormData, 'targetCompletionDate' | 'soc2Type' | 'trustServiceCriteria' | 'wantsSprintPlan' | 'soc2Stage' | 'targetDateRange'>) => void;
}

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
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

  const handleDateRange = (range: '3-6-months' | '6-12-months') => {
    const isoDate = range === '3-6-months' ? addMonths(6) : addMonths(12);
    onChange({ ...data, targetDateRange: range, targetCompletionDate: isoDate });
  };

  return (
    <FormSection
      title="Compliance Goals"
      description="Let's define your SOC 2 objectives and timeline."
    >
      <RadioGroup
        label="Where are you in your SOC 2 journey?"
        name="soc2Stage"
        options={[
          {
            value: 'from-scratch',
            label: 'Starting from scratch',
            description: 'We have not started any SOC 2 preparation yet.',
          },
          {
            value: 'in-progress',
            label: 'Already in progress',
            description: 'We have begun implementing controls or working with a consultant.',
          },
          {
            value: 'renewal',
            label: 'Renewing an existing report',
            description: 'We have a current SOC 2 report and need to renew or expand scope.',
          },
        ]}
        selectedValue={data.soc2Stage ?? 'from-scratch'}
        onChange={(value) => updateField('soc2Stage', value as 'from-scratch' | 'in-progress' | 'renewal')}
      />

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
          label: `${tsc.name}${'required' in tsc && tsc.required ? ' (Required)' : ''}`,
          description: tsc.description,
        }))}
        selectedValues={data.trustServiceCriteria}
        onChange={handleCriteriaChange}
        columns={1}
        helpText="Security is required. Select additional criteria based on your business needs."
      />

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Target timeline to audit-ready</p>
        <div className="grid grid-cols-2 gap-3">
          {(['3-6-months', '6-12-months'] as const).map((range) => {
            const isSelected = data.targetDateRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => handleDateRange(range)}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                  {range === '3-6-months' ? '3–6 Months' : '6–12 Months'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {range === '3-6-months'
                    ? 'Faster track — Type 1 or tight deadline'
                    : 'Standard track — Type 2 or thorough prep'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Toggle
        label="Generate a week-by-week sprint plan"
        description="We'll break your roadmap into 2-week blocks with specific tasks scheduled by week. You can move tasks around after."
        checked={data.wantsSprintPlan ?? true}
        onChange={(checked) => updateField('wantsSprintPlan', checked)}
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
