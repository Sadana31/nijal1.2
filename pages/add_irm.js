'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AddIRM() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  const decimalFields = ['remittanceAmount', 'utilizedAmount', 'outstandingAmount'];
  const countryCodeFields = ['remitterCountryCode'];

  const showError = (input, message) => {
    let error = input.nextElementSibling;
    if (!error || !error.classList.contains('error-message')) {
      error = document.createElement('div');
      error.className = 'error-message';
      error.style.color = 'red';
      error.style.fontSize = '0.9em';
      input.after(error);
    }
    error.textContent = message;
    input.style.borderColor = 'red'; 
  };

  const clearError = (input) => {
    const error = input.nextElementSibling;
    if (error && error.classList.contains('error-message')) {
      error.textContent = '';
    }
    input.style.borderColor = ''; // reset border
  };


  const validateField = (input) => {
    clearError(input);
    const val = input.value.trim();
    const id = input.id;

    if (input.hasAttribute('required') && val === '') {
      showError(input, 'This field is required');
      return false;
    }

    if (input.maxLength > 0 && val.length > input.maxLength) {
      showError(input, `Maximum length is ${input.maxLength}`);
      return false;
    }

    // IE Code rule
    if (id === 'ieCode') {
      input.value = input.value.replace(/[^a-zA-Z0-9]/g, ''); // only alphanumeric
      if (input.value.length > 10) {
        input.value = input.value.slice(0, 10); // hard stop at 10
      }
      return;
    }

    // Currency rule
    if (id === 'remittanceCurrency') {
      if (!/^[A-Z]{3}$/.test(val)) {
        showError(input, 'Enter exactly 3 uppercase letters');
        return false;
      }
    }

    // Country code rule
    if (countryCodeFields.includes(id)) {
      if (val !== '' && !/^[A-Z]{3}$/.test(val)) {
        showError(input, 'Enter exactly 3 uppercase letters or leave empty');
        return false;
      }
    }

    // Date rule (not older than today)
    if (id === 'remittanceDate' && val) {
      const inputDate = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        showError(input, 'Date cannot be older than today');
        return false;
      }
    }

    // Decimal rule
    if (decimalFields.includes(id)) {
      if (!/^\d{1,18}(\.\d{1,2})?$/.test(val)) {
        showError(input, 'Enter a valid decimal (18 digits max, 2 decimals)');
        return false;
      }
    }

    return true;
  };


  const handleBlur = (e) => validateField(e.target);
  const handleInputWrapper = (e) => handleInput(e);
  const handleKeydown = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const handleInput = (e) => {
    const input = e.target;
    const id = input.id;

    if (id === 'remittanceCurrency' || countryCodeFields.includes(id)) {
      input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
      return;
    }

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
      if (id === 'remittanceAmount' || id === 'utilizedAmount') {
        autoCalculateOutstanding();
      }
      return;
    }

    const allowSpaceFields = ['bankName', 'remitterAddress', 'otherBankRef'];
    input.value = allowSpaceFields.includes(id)
      ? input.value.replace(/[^a-zA-Z0-9.\-\s]/g, '')
      : input.value.replace(/[^a-zA-Z0-9.\-]/g, '');
  };

  const autoCalculateOutstanding = () => {
    const form = formRef.current;
    const rem = parseFloat(form.remittanceAmount?.value || 0);
    const util = parseFloat(form.utilizedAmount?.value || 0);
    const outInput = form.outstandingAmount;
    if (!isNaN(rem) && !isNaN(util)) {
      outInput.value = (rem - util).toFixed(2);
    }
  };

  useEffect(() => {
    const form = formRef.current;
    const inputs = form.querySelectorAll('input');

    inputs.forEach((input) => {
      input.addEventListener('input', handleInputWrapper);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('keydown', handleKeydown);
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInputWrapper);
        input.removeEventListener('blur', handleBlur);
        input.removeEventListener('keydown', handleKeydown);
      });
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const form = formRef.current;
    const inputs = form.querySelectorAll('input');
    let valid = true;
    inputs.forEach((input) => {
      if (!validateField(input)) valid = false;
    });

    if (!valid) {
      toast.error('Please fix errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    const formDataObj = {};
    inputs.forEach((input) => {
      formDataObj[input.name] = input.value.trim();
    });

    try {
      const res = await fetch('https://nijal-backend.onrender.com/api/irm/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataObj),
      });

      if (!res.ok) {
        const err = await res.json();
        setIsSubmitting(false);
        return toast.error(err.message || 'Something went wrong');
      }

      toast.success('IRM entry saved!');
      setTimeout(() => router.push('/irm'), 1500);
    } catch (err) {
      console.error(err);
      toast.error('Network error while submitting.');
      setIsSubmitting(false);
    }
  };

  const mandatoryFields = [
    ['adCode', 'AD Code*'],
    ['bankName', 'Bank Name*'],
    ['ieCode', 'IE Code*'],
    ['RemittanceRefNo', 'Remittance Reference Number*'],
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
      onSubmit={handleSubmit}
      className="px-16 py-8 text-base text-[#1c2e3d]"
      autoComplete="off"
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
                required
                max={name === 'remittanceDate' ? today : undefined}  
                maxLength={name === 'remittanceCurrency' ? 3 : 50}
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
                maxLength={50}
                className="w-full border border-gray-400 rounded px-3 py-2"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-start space-x-4 mt-6">
        {/* Update button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`bg-[#08315c] text-white font-semibold px-8 py-3 rounded text-lg ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#061f38]'
          }`}
        >
          {isSubmitting ? 'Updating...' : 'Update'}
        </button>

        {/* Cancel button */}
        <button
          type="button"
          onClick={() => router.back()} // or handleCancel()
          className="bg-gray-500 text-white font-semibold px-8 py-3 rounded text-lg hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

    </form>
  );
}
