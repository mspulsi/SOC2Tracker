'use client';

import { DataHandling, DATA_RESIDENCY_OPTIONS } from '@/types/intake';
import FormSection from '../FormSection';
import { Toggle, CheckboxGroup, InfoBox } from '../FormFields';

interface DataHandlingSectionProps {
  data: DataHandling;
  onChange: (data: DataHandling) => void;
}

export default function DataHandlingSection({ data, onChange }: DataHandlingSectionProps) {
  const updateField = <K extends keyof DataHandling>(field: K, value: DataHandling[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Data Handling"
      description="The type of data you handle significantly impacts your compliance requirements."
    >
      <InfoBox type="warning">
        Handling sensitive data types like PHI or payment data may require additional
        compliance frameworks beyond SOC 2 (e.g., HIPAA, PCI DSS).
      </InfoBox>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Types of Data Handled</h3>

        <Toggle
          label="Customer PII (Personally Identifiable Information)"
          description="Names, emails, addresses, phone numbers, etc."
          checked={data.handlesCustomerPII}
          onChange={(checked) => updateField('handlesCustomerPII', checked)}
        />

        <Toggle
          label="Protected Health Information (PHI)"
          description="Medical records, health data, insurance information"
          checked={data.handlesPHI}
          onChange={(checked) => updateField('handlesPHI', checked)}
        />

        <Toggle
          label="Payment Card Data"
          description="Credit card numbers, CVVs, billing information"
          checked={data.handlesPaymentData}
          onChange={(checked) => updateField('handlesPaymentData', checked)}
        />
      </div>

      <CheckboxGroup
        label="Data Residency Requirements"
        options={[...DATA_RESIDENCY_OPTIONS]}
        selectedValues={data.dataResidencyRequirements}
        onChange={(values) => updateField('dataResidencyRequirements', values)}
        helpText="Select regions where your data must reside"
        columns={2}
      />

      {(data.handlesPHI || data.handlesPaymentData) && (
        <InfoBox type="tip">
          Based on your data types, you may benefit from pursuing additional certifications
          alongside SOC 2. We&apos;ll include relevant recommendations in your roadmap.
        </InfoBox>
      )}
    </FormSection>
  );
}
