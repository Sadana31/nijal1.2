'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AddIRM() {
  const [formData, setFormData] = useState({});
  const formRef = useRef(null);
  const router = useRouter();

  const decimalFields = ['remittanceAmount', 'utilizedAmount', 'outstandingAmount'];
  const dateFields = ['remittanceDate'];

  useEffect(() => {
    const form = formRef.current;

    function handleInput(e) {
      const input = e.target;
      const id = input.id;

      if (input.maxLength > 0 && input.value.length > input.maxLength) {
        input.value = input.value.slice(0, input.maxLength);
      }

      if (decimalFields.includes(id)) {
        let val = input.value;
        const selectionStart = input.selectionStart;

        val = val.replace(/[^0-9.]/g, '');

        const firstDecimal = val.indexOf('.');
        if (firstDecimal !== -1) {
          val = val.slice(0, firstDecimal + 1) + val.slice(firstDecimal + 1).replace(/\./g, '');
        }

        const parts = val.split('.');
        parts[0] = parts[0].slice(0, 18);
        if (parts.length > 1) {
          parts[1] = parts[1].slice(0, 2);
          val = parts[0] + '.' + parts[1];
        } else {
          val = parts[0];
        }

        input.value = val;
        input.setSelectionRange(selectionStart, selectionStart);
      }

      if (dateFields.includes(id)) {
        const parts = input.value.split('-');
        if (parts[0] && parts[0].length > 4) {
          parts[0] = parts[0].slice(0, 4);
          input.value = parts.join('-');
        }
      }
    }

    function handleSubmit(e) {
      e.preventDefault();
      (async () => {
        try {
          const response = await fetch('http://localhost:5000/api/irm/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            toast.success('IRM entry saved!', { duration: 1500 });
            setTimeout(() => router.push('/irm'), 2000);
          } else {
            const err = await response.json();
            toast.error(err.message || 'Something went wrong');
          }
        } catch (error) {
          toast.error('Network error while submitting.');
          console.error(error);
        }
      })();
    }

    const inputs = form.querySelectorAll('input');
    inputs.forEach((input) => {
      input.addEventListener('input', handleInput);
    });
    form.addEventListener('submit', handleSubmit);

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInput);
      });
      form.removeEventListener('submit', handleSubmit);
    };
  }, [router, formData]);

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
      ref={formRef}
      id="addIrmForm"
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
                value={formData[name] || ''}
                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
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