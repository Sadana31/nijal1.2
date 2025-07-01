'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AddIRM() {
  const router = useRouter();
  const [formData, setFormData] = useState({});

  const decimalFields = ['remittanceAmount', 'utilizedAmount', 'outstandingAmount'];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    let newValue = value;

    // Limit to digits and max 2 decimal places
    if (decimalFields.includes(id)) {
      newValue = newValue.replace(/[^0-9.]/g, '');
      const parts = newValue.split('.');
      parts[0] = parts[0].slice(0, 18);
      if (parts.length > 1) {
        parts[1] = parts[1].slice(0, 2);
        newValue = `${parts[0]}.${parts[1]}`;
      } else {
        newValue = parts[0];
      }
    }

    if (id === 'remittanceCurrency') {
      newValue = newValue.slice(0, 3).toUpperCase(); // Limit currency to 3 chars
    }

    setFormData((prev) => ({ ...prev, [id]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('https://nijal-backend.onrender.com/api/irm/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        return toast.error(err.message || 'Something went wrong');
      }

      toast.success('IRM entry saved!');
      setTimeout(() => router.push('/irm'), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Network error while submitting.');
    }
  };

  const mandatoryFields = [
    ['adCode', 'AD Code*'],
    ['bankName', 'Bank Name*'],
    ['ieCode', 'IE Code*'],
    ['remittanceRefNo', 'Remittance Reference Number*'],
    ['remittanceDate', 'Remittance Date*'],
    ['purposeCode', 'Purpose Code*'],
    ['remittanceCurrency', 'Remittance Currency*'],
    ['remittanceAmount', 'Remittance Amount*'],
    ['utilizedAmount', 'Utilized Amount*'],
    ['outstandingAmount', 'Outstanding Amount*'],
  ];

  const optionalFields = [
    ['remitterName', 'Remitter Name'],
    ['remitterAddress', 'Remitter Address'],
    ['remitterCountryCode', 'Remitter Country Code'],
    ['remitterBank', 'Remitter Bank'],
    ['otherBankRef', 'Other Bank Reference Number'],
    ['status', 'Status'],
    ['remittanceType', 'Remittance Type'],
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="px-16 py-8 text-base text-[#1c2e3d]"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#08315c]">Add IRM</h2>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">Mandatory Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mandatoryFields.map(([name, label]) => (
            <div key={name}>
              <label className="block font-semibold mb-2" htmlFor={name}>{label}</label>
              <input
                type={name === 'remittanceDate' ? 'date' : 'text'}
                id={name}
                name={name}
                maxLength={name === 'remittanceCurrency' ? 3 : undefined}
                value={formData[name] || ''
                  
                }
                onChange={handleInputChange}
                className="w-full border border-gray-400 rounded px-3 py-2"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">Optional Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {optionalFields.map(([name, label]) => (
            <div key={name}>
              <label className="block font-semibold mb-2" htmlFor={name}>{label}</label>
              <input
                type="text"
                id={name}
                name={name}
                value={formData[name] || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-400 rounded px-3 py-2"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="bg-[#08315c] text-white font-semibold px-8 py-3 rounded hover:bg-[#061f38] text-lg"
      >
        Submit
      </button>
    </form>
  );
}
