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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          List your key vendors <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          We&apos;ll pre-populate your vendor register with known tools. Separate with commas or new lines.
        </p>
        <textarea
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="e.g. AWS, Stripe, Salesforce, Datadog..."
          value={(data.vendorList ?? []).join(', ')}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = raw
              .split(/[,\n]/)
              .map((s) => s.trim())
              .filter(Boolean);
            updateField('vendorList', parsed);
          }}
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
