'use client';

import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-gray-600">{description}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
