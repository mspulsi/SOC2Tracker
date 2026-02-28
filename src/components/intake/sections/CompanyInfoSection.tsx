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
      <Input
        label="Company Name"
        value={data.companyName}
        onChange={(e) => updateField('companyName', e.target.value)}
        placeholder="Acme Inc."
        required
      />

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
        label="Year Founded"
        type="number"
        min="1900"
        max={new Date().getFullYear()}
        value={data.yearFounded}
        onChange={(e) => updateField('yearFounded', e.target.value)}
        placeholder="2020"
      />
    </FormSection>
  );
}
