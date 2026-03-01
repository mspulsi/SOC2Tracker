'use client';

import { CompanyInfo, INDUSTRIES, EMPLOYEE_COUNTS } from '@/types/intake';
import FormSection from '../FormSection';
import { Input, Select } from '../FormFields';

interface CompanyInfoSectionProps {
  data: CompanyInfo;
  onChange: (data: CompanyInfo) => void;
}

export default function CompanyInfoSection({ data, onChange }: CompanyInfoSectionProps) {
  const updateField = <K extends keyof CompanyInfo>(field: K, value: CompanyInfo[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Company Information"
      description="Tell us about your company so we can tailor your compliance roadmap."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Industry"
          options={INDUSTRIES}
          value={data.industry}
          onChange={(e) => updateField('industry', e.target.value)}
          required
        />
        <Select
          label="Number of Employees"
          options={EMPLOYEE_COUNTS}
          value={data.employeeCount}
          onChange={(e) => updateField('employeeCount', e.target.value)}
          required
        />
      </div>

      <Input
        label="Website"
        type="url"
        value={data.website}
        onChange={(e) => updateField('website', e.target.value)}
        placeholder="https://example.com"
        helpText="We'll use this to verify your website security configuration"
      />
    </FormSection>
  );
}
