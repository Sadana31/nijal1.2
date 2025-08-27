'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function ModifyIRM() {
  const [formData, setFormData] = useState({});
  const formRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const today = new Date().toISOString().split('T')[0];

  const decimalFields = ['remittanceAmount', 'utilizedAmount', 'outstandingAmount'];
  const countryCodeFields = ['remitterCountryCode'];

  function sanitizeValue(id, value) {
    if (decimalFields.includes(id)) {
      let val = value.replace(/[^0-9.]/g, '');
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
      return val;
    }

    if (countryCodeFields.includes(id) || id === 'remittanceCurrency') {
      return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    }

    if (id === 'ieCode') {
      return value.replace(/\D/g, '').slice(0, 10);
    }

    return value.replace(/[^a-zA-Z0-9.\- ]/g, '').slice(0, 50);
  }

function handleInput(e) {
  const input = e.target;
  const id = input.id;
  const sanitized = sanitizeValue(id, input.value);
  input.value = sanitized;
  setFormData((prev) => ({ ...prev, [id]: sanitized }));
}



useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const response = await fetch(`https://nijal-backend.onrender.com/api/irm/${id}`);
        if (!response.ok) throw new Error("Failed to fetch IRM");
        const data = await response.json();
        setFormData(data);
      } catch (err) {
        toast.error("Could not load IRM details");
        console.error(err);
      }
    })();
  }, [id]);

  useEffect(() => {
    const form = formRef.current;

    function handleSubmit(e) {
      e.preventDefault();
      (async () => {
        try {
          const response = await fetch(`https://nijal-backend.onrender.com/api/irm/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            toast.success('IRM entry updated!', { duration: 1500 });
            setTimeout(() => router.push('/irm'), 1500);
          } else {
            const err = await response.json();
            toast.error(err.message || 'Update failed');
          }
        } catch (error) {
          toast.error('Network error while updating.');
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
  }, [formData, id, router]);

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
    <form ref={formRef} className="px-16 py-8 text-base text-[#1c2e3d]">
      <h2 className="text-2xl font-bold mb-6 text-[#08315c]">Modify IRM</h2>

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
                formNoValidate
                maxLength={name === 'remittanceCurrency' ? 3 : 50}
                value={formData[name] || ''}
                max={name === 'remittanceCurrency'  ? today : undefined}  
                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                className={`w-full border border-gray-400 rounded px-3 py-2 ${formData[name] ? 'bg-gray-100' : ''}`}
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
                maxLength={50}
                max={name == 'remittanceDate' ? today : undefined}  
                value={formData[name] || ''}
                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                className={`w-full border border-gray-400 rounded px-3 py-2 ${formData[name] ? 'bg-gray-100' : ''}`}
              />
            </div>
          ))}
        </div>
      </fieldset>

     <div className="flex gap-4 mt-6">
        <button
          type="submit"
          className="bg-[#08315c] text-white font-semibold px-8 py-3 rounded hover:bg-[#061f38] text-lg"
        >
          Update
        </button>

        <button
          type="button"
          className="bg-gray-400 text-white font-semibold px-8 py-3 rounded hover:bg-gray-600 text-lg"
          onClick={() => router.push('/irm')} 
        >
          Cancel
        </button>
      </div>



    </form>
  );
}
