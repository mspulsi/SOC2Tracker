'use client';

import {
  BusinessContinuity,
  BACKUP_FREQUENCIES,
  RTO_RPO_OPTIONS,
} from '@/types/intake';
import FormSection from '../FormSection';
import { Select, Toggle, InfoBox } from '../FormFields';

interface BusinessContinuitySectionProps {
  data: BusinessContinuity;
  onChange: (data: BusinessContinuity) => void;
}

export default function BusinessContinuitySection({
  data,
  onChange,
}: BusinessContinuitySectionProps) {
  const updateField = <K extends keyof BusinessContinuity>(
    field: K,
    value: BusinessContinuity[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Business Continuity"
      description="SOC 2 requires you to demonstrate resilience and recovery capabilities."
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Backup Strategy</h3>

        <Toggle
          label="Regular Backups"
          description="Do you have automated backups for critical data and systems?"
          checked={data.hasBackupStrategy}
          onChange={(checked) => updateField('hasBackupStrategy', checked)}
        />

        {data.hasBackupStrategy && (
          <Select
            label="Backup Frequency"
            options={BACKUP_FREQUENCIES.map((opt) => ({ value: opt, label: opt }))}
            value={data.backupFrequency}
            onChange={(e) => updateField('backupFrequency', e.target.value)}
          />
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Disaster Recovery</h3>

        <Toggle
          label="Disaster Recovery Plan"
          description="Do you have a documented plan for recovering from major incidents?"
          checked={data.hasDisasterRecoveryPlan}
          onChange={(checked) => updateField('hasDisasterRecoveryPlan', checked)}
        />

        <Toggle
          label="BCP/DR Testing"
          description="Do you regularly test your backup and recovery procedures?"
          checked={data.hasBCPTesting}
          onChange={(checked) => updateField('hasBCPTesting', checked)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Recovery Time Objective (RTO)"
          options={RTO_RPO_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
          value={data.rtoRequirement}
          onChange={(e) => updateField('rtoRequirement', e.target.value)}
          helpText="Maximum acceptable downtime"
        />

        <Select
          label="Recovery Point Objective (RPO)"
          options={RTO_RPO_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
          value={data.rpoRequirement}
          onChange={(e) => updateField('rpoRequirement', e.target.value)}
          helpText="Maximum acceptable data loss"
        />
      </div>

      <InfoBox type="info">
        <strong>RTO</strong> = How quickly you need to recover (downtime tolerance)
        <br />
        <strong>RPO</strong> = How much data you can afford to lose (backup frequency)
      </InfoBox>

      {!data.hasDisasterRecoveryPlan && (
        <InfoBox type="tip">
          A disaster recovery plan is essential for SOC 2. We&apos;ll guide you through
          creating one tailored to your infrastructure.
        </InfoBox>
      )}
    </FormSection>
  );
}
