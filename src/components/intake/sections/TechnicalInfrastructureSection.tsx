'use client';

import {
  TechnicalInfrastructure,
  CLOUD_PROVIDERS,
  DATABASE_TYPES,
  SOURCE_CODE_MANAGEMENT,
  HOSTING_TYPES,
} from '@/types/intake';
import FormSection from '../FormSection';
import { Select, CheckboxGroup, Toggle, InfoBox } from '../FormFields';

interface TechnicalInfrastructureSectionProps {
  data: TechnicalInfrastructure;
  onChange: (data: TechnicalInfrastructure) => void;
}

export default function TechnicalInfrastructureSection({
  data,
  onChange,
}: TechnicalInfrastructureSectionProps) {
  const updateField = <K extends keyof TechnicalInfrastructure>(
    field: K,
    value: TechnicalInfrastructure[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Technical Infrastructure"
      description="Understanding your tech stack helps us identify which controls are relevant to your environment."
    >
      <InfoBox type="info">
        SOC 2 controls vary based on your infrastructure. Cloud-hosted applications have
        different requirements than on-premise systems.
      </InfoBox>

      <Select
        label="Hosting Type"
        options={HOSTING_TYPES}
        value={data.hostingType}
        onChange={(e) => updateField('hostingType', e.target.value)}
        required
      />

      {(data.hostingType === 'Hybrid (cloud + on-premise)' || data.hostingType === 'Fully on-premise') && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700">On-premise infrastructure not supported</p>
            <p className="text-sm text-red-600 mt-0.5">
              This tool is designed for cloud-hosted services. On-premise systems require a significantly different control set and scoping process that is outside the current scope of this tool.
            </p>
          </div>
        </div>
      )}

      <CheckboxGroup
        label="Cloud Providers"
        options={[...CLOUD_PROVIDERS]}
        selectedValues={data.cloudProviders}
        onChange={(values) => updateField('cloudProviders', values)}
        helpText="Select all that apply"
      />

      <Toggle
        label="Production Database"
        description="Do you have databases storing production/customer data?"
        checked={data.hasProductionDatabase}
        onChange={(checked) => updateField('hasProductionDatabase', checked)}
      />

      {data.hasProductionDatabase && (
        <CheckboxGroup
          label="Database Types"
          options={[...DATABASE_TYPES]}
          selectedValues={data.databaseTypes}
          onChange={(values) => updateField('databaseTypes', values)}
          helpText="Select all database systems you use"
        />
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Development Practices</h3>
        
        <Toggle
          label="Containerization"
          description="Do you use Docker, Kubernetes, or similar container technologies?"
          checked={data.usesContainers}
          onChange={(checked) => updateField('usesContainers', checked)}
        />

        <Toggle
          label="CI/CD Pipeline"
          description="Do you have automated build and deployment pipelines?"
          checked={data.hasCI_CD}
          onChange={(checked) => updateField('hasCI_CD', checked)}
        />

        <Toggle
          label="Monitoring & Logging"
          description="Do you have centralized logging and monitoring in place?"
          checked={data.hasMonitoring}
          onChange={(checked) => updateField('hasMonitoring', checked)}
        />
      </div>

      <Select
        label="Source Code Management"
        options={SOURCE_CODE_MANAGEMENT}
        value={data.sourceCodeManagement}
        onChange={(e) => updateField('sourceCodeManagement', e.target.value)}
        required
      />
    </FormSection>
  );
}
