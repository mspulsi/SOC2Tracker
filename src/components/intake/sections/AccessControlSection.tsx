'use client';

import {
  AccessControl,
  SSO_PROVIDERS,
  MFA_COVERAGE_OPTIONS,
  ACCESS_REVIEW_FREQUENCIES,
} from '@/types/intake';
import FormSection from '../FormSection';
import { Select, Toggle, InfoBox } from '../FormFields';

interface AccessControlSectionProps {
  data: AccessControl;
  onChange: (data: AccessControl) => void;
}

export default function AccessControlSection({ data, onChange }: AccessControlSectionProps) {
  const updateField = <K extends keyof AccessControl>(field: K, value: AccessControl[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Access Control"
      description="Access management is a critical component of SOC 2. Let's understand your current practices."
    >
      <InfoBox type="info">
        Strong access controls are foundational to SOC 2 compliance. This includes
        authentication, authorization, and regular access reviews.
      </InfoBox>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Single Sign-On (SSO)</h3>

        <Toggle
          label="SSO Implemented"
          description="Do you use a centralized identity provider for authentication?"
          checked={data.hasSSO}
          onChange={(checked) => updateField('hasSSO', checked)}
        />

        {data.hasSSO && (
          <Select
            label="SSO Provider"
            options={SSO_PROVIDERS}
            value={data.ssoProvider}
            onChange={(e) => updateField('ssoProvider', e.target.value)}
          />
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Multi-Factor Authentication (MFA)</h3>

        <Toggle
          label="MFA Enabled"
          description="Do you require multi-factor authentication?"
          checked={data.hasMFA}
          onChange={(checked) => updateField('hasMFA', checked)}
        />

        {data.hasMFA && (
          <Select
            label="MFA Coverage"
            options={MFA_COVERAGE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
            value={data.mfaCoverage}
            onChange={(e) => updateField('mfaCoverage', e.target.value)}
          />
        )}
      </div>

      {!data.hasMFA && (
        <InfoBox type="warning">
          MFA is strongly recommended and often required for SOC 2 compliance.
          Implementing MFA will be a priority in your roadmap.
        </InfoBox>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Authorization & Access Management</h3>

        <Toggle
          label="Role-Based Access Control (RBAC)"
          description="Do you assign permissions based on roles rather than individuals?"
          checked={data.hasRBAC}
          onChange={(checked) => updateField('hasRBAC', checked)}
        />

        <Toggle
          label="Privileged Access Management"
          description="Do you have special controls for admin/root access?"
          checked={data.hasPrivilegedAccessManagement}
          onChange={(checked) => updateField('hasPrivilegedAccessManagement', checked)}
        />

        <Toggle
          label="Regular Access Reviews"
          description="Do you periodically review and validate user access?"
          checked={data.hasAccessReviews}
          onChange={(checked) => updateField('hasAccessReviews', checked)}
        />

        {data.hasAccessReviews && (
          <Select
            label="Access Review Frequency"
            options={ACCESS_REVIEW_FREQUENCIES.map((opt) => ({ value: opt, label: opt }))}
            value={data.accessReviewFrequency}
            onChange={(e) => updateField('accessReviewFrequency', e.target.value)}
          />
        )}
      </div>
    </FormSection>
  );
}
