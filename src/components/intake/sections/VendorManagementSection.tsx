'use client';

import { VendorManagement, VENDOR_COUNTS } from '@/types/intake';
import FormSection from '../FormSection';
import { Select, Toggle, InfoBox } from '../FormFields';

interface VendorManagementSectionProps {
  data: VendorManagement;
  onChange: (data: VendorManagement) => void;
}

export default function VendorManagementSection({ data, onChange }: VendorManagementSectionProps) {
  const updateField = <K extends keyof VendorManagement>(
    field: K,
    value: VendorManagement[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <FormSection
      title="Vendor Management"
      description="Third-party vendors can introduce risk. SOC 2 requires you to manage vendor relationships."
    >
      <InfoBox type="info">
        Vendors that access, process, or store your data are considered &quot;subservice
        organizations&quot; and must be assessed for security.
      </InfoBox>

      <Select
        label="Number of Critical Vendors"
        options={VENDOR_COUNTS.map((opt) => ({ value: opt, label: opt }))}
        value={data.criticalVendorCount}
        onChange={(e) => updateField('criticalVendorCount', e.target.value)}
        helpText="Vendors that access customer data or critical systems"
        required
      />

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Current Vendor Practices</h3>

        <Toggle
          label="Vendor Inventory"
          description="Do you maintain a list of all vendors and their access levels?"
          checked={data.hasVendorInventory}
          onChange={(checked) => updateField('hasVendorInventory', checked)}
        />

        <Toggle
          label="Vendor Security Assessments"
          description="Do you evaluate vendor security before and during engagement?"
          checked={data.hasVendorAssessment}
          onChange={(checked) => updateField('hasVendorAssessment', checked)}
        />

        <Toggle
          label="Data Processing Agreements"
          description="Do you have DPAs/contracts defining data handling requirements?"
          checked={data.hasDataProcessingAgreements}
          onChange={(checked) => updateField('hasDataProcessingAgreements', checked)}
        />
      </div>

      {!data.hasVendorInventory && (
        <InfoBox type="tip">
          Creating a vendor inventory is a great first step. We&apos;ll help you build one
          as part of your compliance roadmap.
        </InfoBox>
      )}
    </FormSection>
  );
}
