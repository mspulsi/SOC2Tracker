'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRoadmap } from '@/lib/use-roadmap';
import { autoPopulateVendors, getNextReviewDate, getKnownVendorInfo } from '@/lib/vendor-engine';
import { Vendor, VendorRiskTier, AssessmentStatus } from '@/types/vendor';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<VendorRiskTier, { dot: string; badge: string; text: string }> = {
  critical: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', text: 'text-red-700' },
  high:     { dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700' },
  medium:   { dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-700' },
  low:      { dot: 'bg-green-400', badge: 'bg-green-100 text-green-700', text: 'text-green-700' },
};

const STATUS_STYLES: Record<AssessmentStatus, string> = {
  'assessed':     'bg-green-100 text-green-700',
  'needs-review': 'bg-yellow-100 text-yellow-700',
  'not-started':  'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<AssessmentStatus, string> = {
  'assessed':     'Assessed',
  'needs-review': 'Needs Review',
  'not-started':  'Not Started',
};

const TIER_ORDER: Record<VendorRiskTier, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function relativeDate(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function dueDateColor(iso: string | null): string {
  if (!iso) return 'text-gray-400';
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'text-red-600 font-semibold';
  if (days <= 30) return 'text-red-500 font-medium';
  if (days <= 90) return 'text-orange-500 font-medium';
  return 'text-gray-500';
}

function dueDateLabel(iso: string | null): string {
  if (!iso) return '—';
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days <= 30) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

const VENDOR_STORAGE_KEY = 'soc2-vendor-data';

function loadVendors(): Vendor[] | null {
  const s = localStorage.getItem(VENDOR_STORAGE_KEY);
  return s ? JSON.parse(s) : null;
}

function saveVendors(vendors: Vendor[]) {
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendors));
}

// ─── Slide-over Detail Panel ──────────────────────────────────────────────────

function VendorDetail({ vendor, handlesPHI, onUpdate, onClose }: {
  vendor: Vendor;
  handlesPHI: boolean;
  onUpdate: (updated: Vendor) => void;
  onClose: () => void;
}) {
  const [v, setV] = useState<Vendor>(vendor);
  const knownInfo = getKnownVendorInfo(vendor.name);

  function update(patch: Partial<Vendor>) {
    const updated = { ...v, ...patch };
    setV(updated);
    onUpdate(updated);
  }

  function markReviewed() {
    update({
      assessmentStatus: 'assessed',
      lastReviewed: new Date().toISOString().split('T')[0],
      nextReviewDue: getNextReviewDate(v.riskTier),
      assessmentHistory: [
        ...v.assessmentHistory,
        {
          date: new Date().toISOString().split('T')[0],
          status: 'assessed',
          reviewer: 'You',
          notes: v.notes,
        },
      ],
    });
  }

  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l border-gray-200 z-20 flex flex-col shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-gray-900">{v.name}</h2>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_STYLES[v.riskTier].badge}`}>
              {v.riskTier}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {v.category}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 px-5 py-4 space-y-5">
        {/* Known vendor info */}
        {knownInfo && (
          <div className="bg-blue-50 rounded-lg p-3 text-xs">
            <p className="font-semibold text-blue-700 mb-1">Known vendor — we have info on this one</p>
            <p className="text-blue-600">
              SOC 2:{' '}
              {knownInfo.hasSoc2Report ? (
                knownInfo.soc2ReportUrl ? (
                  <a href={knownInfo.soc2ReportUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    View report / trust center ↗
                  </a>
                ) : 'Available'
              ) : 'Not publicly available'}
            </p>
          </div>
        )}

        {/* Confirm vendor */}
        {!v.confirmedByUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
            <p className="text-amber-700 font-medium mb-2">Auto-detected — please confirm this is accurate</p>
            <button
              onClick={() => update({ confirmedByUser: true })}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-md font-medium hover:bg-amber-700"
            >
              Confirm Vendor
            </button>
          </div>
        )}

        {/* Security Posture */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Security Posture</p>
          <div className="space-y-3">
            {/* SOC 2 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">SOC 2 Report</span>
              <select
                value={v.hasSoc2Report === null ? 'unknown' : v.hasSoc2Report ? 'yes' : 'no'}
                onChange={e => update({ hasSoc2Report: e.target.value === 'unknown' ? null : e.target.value === 'yes' })}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="unknown">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {v.hasSoc2Report && (
              <input
                type="url"
                placeholder="Trust center URL (optional)"
                value={v.soc2ReportUrl ?? ''}
                onChange={e => update({ soc2ReportUrl: e.target.value || null })}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
            {/* DPA */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">DPA in place</span>
              <select
                value={v.hasDPA === null ? 'unknown' : v.hasDPA ? 'yes' : 'no'}
                onChange={e => update({ hasDPA: e.target.value === 'unknown' ? null : e.target.value === 'yes' })}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="unknown">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {/* BAA — only if PHI */}
            {handlesPHI && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">BAA in place</span>
                <select
                  value={v.hasBAA === null ? 'unknown' : v.hasBAA ? 'yes' : 'no'}
                  onChange={e => update({ hasBAA: e.target.value === 'unknown' ? null : e.target.value === 'yes' })}
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="unknown">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Data Access */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Data Access</p>
          <div className="flex flex-wrap gap-1.5">
            {v.dataAccess.map(d => (
              <span key={d} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{d}</span>
            ))}
          </div>
          {v.hasProductionAccess && (
            <p className="text-xs text-red-600 mt-2 font-medium">⚠ Has production system access</p>
          )}
        </section>

        {/* Assessment */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Assessment</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Status</span>
              <select
                value={v.assessmentStatus}
                onChange={e => update({ assessmentStatus: e.target.value as AssessmentStatus })}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="not-started">Not Started</option>
                <option value="needs-review">Needs Review</option>
                <option value="assessed">Assessed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes</label>
              <textarea
                value={v.notes}
                onChange={e => update({ notes: e.target.value })}
                rows={3}
                placeholder="Notes from this assessment..."
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              onClick={markReviewed}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Mark as Reviewed Today
            </button>
          </div>
        </section>

        {/* Assessment history */}
        {v.assessmentHistory.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">History</p>
            <ul className="space-y-2">
              {[...v.assessmentHistory].reverse().map((h, i) => (
                <li key={i} className="text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[h.status]}`}>{STATUS_LABELS[h.status]}</span>
                    <span className="text-gray-400">{h.date}</span>
                  </div>
                  {h.notes && <p className="text-gray-500 mt-1">{h.notes}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Website link */}
        {v.website && (
          <a href={v.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline">
            Visit {v.name} website ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main Vendors Page ────────────────────────────────────────────────────────

export default function VendorsPage() {
  const { intakeData, loading } = useRoadmap();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showConfirmBanner, setShowConfirmBanner] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const existing = loadVendors();
    if (existing) {
      setVendors(existing);
      setInitialized(true);
    } else if (intakeData) {
      const auto = autoPopulateVendors(intakeData);
      setVendors(auto);
      saveVendors(auto);
      setShowConfirmBanner(true);
      setInitialized(true);
    }
  }, [intakeData]);

  function updateVendor(updated: Vendor) {
    const next = vendors.map(v => v.id === updated.id ? updated : v);
    setVendors(next);
    saveVendors(next);
  }

  if (loading || !initialized) {
    return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (!intakeData) {
    return (
      <div className="p-8 text-center text-gray-500">
        No assessment found. <Link href="/intake" className="text-blue-600 underline">Start assessment</Link>
      </div>
    );
  }

  const selected = vendors.find(v => v.id === selectedId) ?? null;
  const handlesPHI = intakeData.dataHandling.handlesPHI;

  // Sort: not-started critical first, then by tier, then name
  const sorted = [...vendors].sort((a, b) => {
    if (a.assessmentStatus === 'not-started' && b.assessmentStatus !== 'not-started') return -1;
    if (a.assessmentStatus !== 'not-started' && b.assessmentStatus === 'not-started') return 1;
    const tierDiff = TIER_ORDER[a.riskTier] - TIER_ORDER[b.riskTier];
    if (tierDiff !== 0) return tierDiff;
    return a.name.localeCompare(b.name);
  });

  const assessed = vendors.filter(v => v.assessmentStatus === 'assessed').length;
  const unconfirmed = vendors.filter(v => !v.confirmedByUser).length;
  const today = Date.now();
  const expiringSoon = vendors.filter(v => {
    if (!v.nextReviewDue) return false;
    const days = Math.ceil((new Date(v.nextReviewDue).getTime() - today) / 86400000);
    return days >= 0 && days <= 90;
  }).length;
  const criticalUnreviewed = vendors.filter(v => v.riskTier === 'critical' && v.assessmentStatus === 'not-started').length;

  return (
    <div className={`p-8 ${selected ? 'pr-[25rem]' : ''} transition-all`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-gray-500 text-sm mt-1">
          {vendors.length} vendors · {assessed} assessed · {criticalUnreviewed} critical unreviewed
        </p>
      </div>

      {/* Auto-populate banner */}
      {showConfirmBanner && unconfirmed > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">We found {vendors.length} vendors based on your setup</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Review each one to confirm the risk tier and data access are correct. Click any row to open the detail panel.
            </p>
          </div>
          <button onClick={() => setShowConfirmBanner(false)} className="ml-auto text-blue-400 hover:text-blue-600 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Alert strip */}
      {(criticalUnreviewed > 0 || expiringSoon > 0) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {criticalUnreviewed > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span><span className="font-semibold">{criticalUnreviewed} critical vendor{criticalUnreviewed !== 1 ? 's' : ''}</span> with no assessment</span>
            </div>
          )}
          {expiringSoon > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              <span><span className="font-semibold">{expiringSoon} assessment{expiringSoon !== 1 ? 's' : ''}</span> expiring within 90 days</span>
            </div>
          )}
        </div>
      )}

      {/* Vendor table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Data Access</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Review</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Next Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(vendor => {
              const ts = TIER_STYLES[vendor.riskTier];
              const isSelected = vendor.id === selectedId;

              return (
                <tr
                  key={vendor.id}
                  onClick={() => setSelectedId(isSelected ? null : vendor.id)}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  {/* Vendor name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${ts.dot}`} />
                      <span className="font-medium text-gray-900">{vendor.name}</span>
                      {!vendor.confirmedByUser && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">Unconfirmed</span>
                      )}
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{vendor.category}</td>
                  {/* Risk */}
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ts.badge}`}>
                      {vendor.riskTier}
                    </span>
                  </td>
                  {/* Data access */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {vendor.dataAccess.slice(0, 2).map(d => (
                        <span key={d} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{d}</span>
                      ))}
                      {vendor.dataAccess.length > 2 && (
                        <span className="text-xs text-gray-400">+{vendor.dataAccess.length - 2}</span>
                      )}
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[vendor.assessmentStatus]}`}>
                      {STATUS_LABELS[vendor.assessmentStatus]}
                    </span>
                  </td>
                  {/* Last reviewed */}
                  <td className="px-4 py-3.5 text-xs text-gray-500">{relativeDate(vendor.lastReviewed)}</td>
                  {/* Next due */}
                  <td className={`px-4 py-3.5 text-xs ${dueDateColor(vendor.nextReviewDue)}`}>
                    {dueDateLabel(vendor.nextReviewDue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-over */}
      {selected && (
        <VendorDetail
          vendor={selected}
          handlesPHI={handlesPHI}
          onUpdate={updateVendor}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
