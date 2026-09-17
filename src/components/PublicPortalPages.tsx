import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { FaCircleCheck, FaPaperPlane } from 'react-icons/fa6';
import { api } from '../api';
import BrandLogo from './BrandLogo';
import { PROVINCES, citiesForProvince } from '../data/pakistanCities';

/**
 * Standalone, no-login versions of the two portal forms so they can be
 * shared with anyone via a link:
 *   #/dealership-form  -> dealership application
 *   #/inquiry-form     -> customer support ticket
 */

type Kind = 'dealership' | 'inquiry';

const inputCls =
  'w-full bg-slate-50 border border-transparent focus:border-brand-blue focus:bg-white rounded-lg px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder-slate-400';
const inputPlainCls =
  'w-full bg-white border border-slate-300 focus:border-brand-blue rounded-lg px-4 py-3 text-sm text-slate-800 outline-none transition placeholder-slate-400 shadow-sm';

function Shell({ kind, children }: { kind: Kind; children: React.ReactNode }) {
  const isDealer = kind === 'dealership';
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Brand strip */}
      <div className="bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo wordmark={false} className="h-5 w-auto" />
            <span className="text-sm font-black uppercase tracking-wide text-white">Expert Builders</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {isDealer ? 'Partner Portal' : 'Support Portal'}
          </span>
        </div>
      </div>

      {/* Hero */}
      <div
        className="relative h-40 md:h-52 flex items-center justify-center text-center px-4"
        style={{
          background: isDealer
            ? 'linear-gradient(180deg, rgba(18,22,25,0.55) 0%, rgba(18,22,25,0.85) 100%), url(\'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=80\') center/cover no-repeat #12161a'
            : 'linear-gradient(180deg, rgba(18,22,25,0.55) 0%, rgba(18,22,25,0.85) 100%), url(\'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1600&q=80\') center/cover no-repeat #12161a',
        }}
      >
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            {isDealer ? 'Become A Dealer' : 'Product Support'}
          </h1>
          <p className="text-slate-300 mt-2 text-xs md:text-sm font-light max-w-xl mx-auto">
            {isDealer
              ? 'Join our network of trusted partners and grow with Expert Builders & Developers.'
              : 'Dedicated customer care and technical support for your Expert Builders experience.'}
          </p>
        </div>
      </div>

      <div className="flex-1">{children}</div>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} Expert Builders & Developers
      </footer>
    </div>
  );
}

function SuccessCard({ code, kind }: { code: string; kind: Kind }) {
  return (
    <div className="max-w-2xl mx-auto px-4 -mt-10 pb-16 relative z-10">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10 text-center">
        <FaCircleCheck className="text-emerald-500 text-5xl mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 mt-4">
          {kind === 'dealership' ? 'Application Submitted!' : 'Ticket Submitted!'}
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {kind === 'dealership'
            ? 'Thank you for your interest in partnering with Expert Builders & Developers. Our team will review your application and get back to you soon.'
            : 'We have received your support ticket and will respond within 48 business hours.'}
        </p>
        <p className="mt-4 inline-block bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-sm font-mono font-bold text-brand-dark">
          Reference: {code}
        </p>
      </div>
    </div>
  );
}

export function PublicDealershipFormPage() {
  const [form, setForm] = useState({
    salutation: 'Mr.', firstName: '', lastName: '', email: '', phone: '',
    businessName: '', address: '', yearsInBusiness: '', oemDealer: 'Choose Yes/No',
    province: '', city: '', propertyOwnership: '', structure: '', fileName: '',
  });
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');

  const cityOptions = useMemo(() => citiesForProvince(form.province), [form.province]);

  const setField =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required');
    if (!form.email.trim()) return setError('Email is required');
    if (!form.phone.trim()) return setError('Phone is required');
    if (!form.businessName.trim()) return setError('Business name is required');
    if (!form.address.trim()) return setError('Address is required');
    if (!form.yearsInBusiness.trim()) return setError('Years in business is required');
    if (!consent) return setError('Please accept the Privacy Policy first');

    setSaving(true);
    try {
      const res = await api.createPortalSubmission({
        type: 'dealership',
        name: `${form.salutation} ${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        business_name: form.businessName.trim(),
        address: form.address.trim(),
        years_in_business: form.yearsInBusiness.trim(),
        oem_dealer: form.oemDealer === 'Choose Yes/No' ? '' : form.oemDealer,
        province: form.province,
        city: form.city,
        property_ownership: form.propertyOwnership,
        structure: form.structure,
        file_name: form.fileName,
      });
      setRefCode(res.data.code || 'DLR');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell kind="dealership">
      {refCode ? (
        <SuccessCard code={refCode} kind="dealership" />
      ) : (
        <div className="max-w-3xl mx-auto px-4 -mt-10 pb-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide text-center mb-6">
              Dealership Application
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Salutation</label>
                  <select value={form.salutation} onChange={setField('salutation')} className={inputCls}>
                    <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Dr.</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                  <input value={form.firstName} onChange={setField('firstName')} placeholder="First name" className={inputCls} />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                  <input value={form.lastName} onChange={setField('lastName')} placeholder="Last name" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
                  <input type="email" value={form.email} onChange={setField('email')} placeholder="name@email.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                  <input value={form.phone} onChange={setField('phone')} placeholder="+92 3xx xxxxxxx" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Current Business Name *</label>
                  <input value={form.businessName} onChange={setField('businessName')} placeholder="Business name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Address *</label>
                  <input value={form.address} onChange={setField('address')} placeholder="Business address" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Years in Automotive Business *</label>
                  <input type="number" min={0} max={60} value={form.yearsInBusiness} onChange={setField('yearsInBusiness')} placeholder="e.g. 8" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Currently an OEM Dealer</label>
                  <select value={form.oemDealer} onChange={setField('oemDealer')} className={inputCls}>
                    <option value="Choose Yes/No">Choose Yes/No</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Province</label>
                  <select
                    value={form.province}
                    onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value, city: '' }))}
                    className={inputCls}
                  >
                    <option value="">Select Province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
                  <select value={form.city} onChange={setField('city')} className={inputCls}>
                    <option value="">Select City</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Property Ownership</label>
                  <select value={form.propertyOwnership} onChange={setField('propertyOwnership')} className={inputCls}>
                    <option value="">Select Property Status</option>
                    <option>Property Owned</option>
                    <option>Property Rented</option>
                    <option>Property Leased</option>
                    <option>Property to be procured</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Structure</label>
                  <select value={form.structure} onChange={setField('structure')} className={inputCls}>
                    <option value="">Select Structure Status</option>
                    <option>Completely Finished</option>
                    <option>Grey Structure Ready</option>
                    <option>Empty Plot</option>
                    <option>N/A</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Attach File Here (file name reference)</label>
                <input value={form.fileName} onChange={setField('fileName')} placeholder="e.g. profile_documents.pdf" className={inputCls} />
              </div>

              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-blue cursor-pointer" />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I have read the Privacy Policy and accept the processing of data for the purposes indicated.
                </span>
              </label>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving}
                  className="w-full md:w-1/2 bg-brand-blue hover:bg-brand-dark text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane className="text-xs" />
                  {saving ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

export function PublicInquiryFormPage() {
  const [form, setForm] = useState({
    chassisNumber: '', orderNumber: '', problemCategory: '',
    custName: '', custEmail: '', custPhone: '', custReason: '',
  });
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refCode, setRefCode] = useState('');

  const PROBLEMS = [
    'Return', 'Replace', 'Product Parts', 'Product Related Questions',
    'Battery & Charging Issues', 'Motor & Acceleration Performance',
    'Display Panel & Electronics', 'Brake System & Suspension',
    'Keyless / Remote Control Unit', 'Warranty & Service Registration', 'Others',
  ];

  const setField =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async () => {
    setError('');
    if (!form.chassisNumber.trim()) return setError('Chassis number is required');
    if (!form.problemCategory) return setError('Please pick your problem');
    if (!form.custName.trim()) return setError('Name is required');
    if (!form.custEmail.trim()) return setError('Email is required');
    if (!form.custPhone.trim()) return setError('Phone is required');
    if (!form.custReason.trim()) return setError('Please tell us your reason');
    if (!consent) return setError('Please accept the Privacy Policy first');

    setSaving(true);
    try {
      const res = await api.createPortalSubmission({
        type: 'inquiry',
        name: form.custName.trim(),
        email: form.custEmail.trim(),
        phone: form.custPhone.trim(),
        chassis_number: form.chassisNumber.trim(),
        order_number: form.orderNumber.trim(),
        problem_category: form.problemCategory,
        reason: form.custReason.trim(),
      });
      setRefCode(res.data.code || 'TCK');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell kind="inquiry">
      {refCode ? (
        <SuccessCard code={refCode} kind="inquiry" />
      ) : (
        <div className="max-w-2xl mx-auto px-4 -mt-10 pb-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide text-center mb-4">
              Submit A Ticket
            </h3>
            <p className="text-[11px] text-slate-500 text-center leading-relaxed mb-5">
              Improve your experience with Expert Builders by taking just a few moments to register your product or project.
              We will come back to you in a maximum of 48 business hours.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input value={form.chassisNumber} onChange={setField('chassisNumber')} placeholder="Chassis Number *" className={inputPlainCls} />
              <input value={form.orderNumber} onChange={setField('orderNumber')} placeholder="Order ID / DO Number" className={inputPlainCls} />
              <select value={form.problemCategory} onChange={setField('problemCategory')} className={inputPlainCls}>
                <option value="" disabled>Pick Your Problem *</option>
                {PROBLEMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.custName} onChange={setField('custName')} placeholder="Name *" className={inputPlainCls} />
                <input type="email" value={form.custEmail} onChange={setField('custEmail')} placeholder="Email *" className={inputPlainCls} />
              </div>
              <input value={form.custPhone} onChange={setField('custPhone')} placeholder="Phone *" className={inputPlainCls} />
              <textarea rows={4} value={form.custReason} onChange={setField('custReason')} placeholder="Tell Us Your Reason *" className={`${inputPlainCls} resize-none`} />

              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-blue cursor-pointer" />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I have read the Privacy Policy and accept the processing of data for the purposes indicated.
                </span>
              </label>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving}
                  className="w-full md:w-1/2 bg-brand-blue hover:bg-brand-dark text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane className="text-xs" />
                  {saving ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
