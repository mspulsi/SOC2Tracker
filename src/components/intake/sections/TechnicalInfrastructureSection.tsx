'use client';

import {
  TechnicalInfrastructure,
  CLOUD_PROVIDERS,
  DATABASE_TYPES,
  SOURCE_CODE_MANAGEMENT,
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
        SOC 2 controls vary based on your infrastructure. We&apos;ll automatically check your
        monitoring and logging setup when you connect your integrations.
      </InfoBox>

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
