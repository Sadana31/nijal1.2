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

  const decimalFields = ['remittanceAmount', 'utilizedAmount', 'outstandingAmount'];
  const dateFields = ['remittanceDate'];

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/irm/${id}`)
        .then((res) => res.json())
        .then((data) => {
          const convertDate = (dateStr) => {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length === 3 && parts[2].length === 4) {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
          };

          const cleanValue = (val) => val === 'NA' || val === 'N/A' ? '' : val;
          const cleanedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? cleanValue(value) : value])
          );

          const normalized = {
            adCode: data.adCode || data.ADCode || '',
            bankName: data.bankName || data.BankName || '',
            ieCode: data.ieCode || data.IECode || '',
            remittanceRefNo: data.remittanceRefNo || data.RemittanceRefNumber || '',
            remittanceDate: convertDate(data.remittanceDate || data.RemittanceDate),
            purposeCode: data.purposeCode || data.PurposeCode || '',
            remittanceCurrency: data.remittanceCurrency || data.RemittanceCurrency || '',
            remittanceAmount: data.remittanceAmount || data.RemittanceAmount || '',
            utilizedAmount: data.utilizedAmount || data.UtilizedAmount || '',
            outstandingAmount: data.outstandingAmount || data.OutstandingAmount || '',
            remitterName: data.remitterName || data.RemitterName || '',
            remitterAddress: data.remitterAddress || data.RemitterAddress || '',
            remitterCountryCode: data.remitterCountryCode || data.RemitterCountryCode || '',
            remitterBank: data.remitterBank || data.RemitterBank || '',
            otherBankRef: data.otherBankRef || data.OtherBankRefNumber || '',
            status: data.status || data.Status || '',
            remittanceType: data.remittanceType || data.RemittanceType || '',
            };

            setFormData(normalized);

        })
        .catch(() => toast.error('Failed to load IRM data'));
    }
  }, [id]);

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
          const response = await fetch(`http://localhost:5000/api/irm/update/${id}`, {
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
                required
                maxLength={name === 'remittanceCurrency' ? 3 : undefined}
                value={formData[name] || ''}
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
                value={formData[name] || ''}
                onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                className={`w-full border border-gray-400 rounded px-3 py-2 ${formData[name] ? 'bg-gray-100' : ''}`}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="bg-[#08315c] text-white font-semibold px-8 py-3 rounded hover:bg-[#061f38] text-lg"
      >
        Update
      </button>
    </form>
  );
}
