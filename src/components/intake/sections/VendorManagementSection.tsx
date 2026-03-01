'use client';

import { VendorManagement } from '@/types/intake';
import FormSection from '../FormSection';
import { TextArea, InfoBox } from '../FormFields';

interface VendorManagementSectionProps {
  data: VendorManagement;
  onChange: (data: VendorManagement) => void;
}

export default function VendorManagementSection({ data, onChange }: VendorManagementSectionProps) {
  return (
    <FormSection
      title="Vendor Management"
      description="Third-party vendors can introduce risk. SOC 2 requires you to manage vendor relationships."
    >
      <InfoBox type="info">
        Vendors that access, process, or store your data are considered &quot;subservice
        organizations&quot; and must be assessed for security.
      </InfoBox>

      <TextArea
        label="What third-party services do you use that store, process, or access your systems or customer data?"
        value={data.thirdPartyServices}
        onChange={(e) => onChange({ ...data, thirdPartyServices: e.target.value })}
        placeholder="e.g., Stripe, Twilio, SendGrid, Datadog, PagerDuty, Slack, AWS, etc."
        helpText="List the services you rely on, separated by commas or new lines"
        rows={4}
      />
    </FormSection>
  );
}
