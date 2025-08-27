'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AddShippingBill() {
  const formRef = useRef(null);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const decimalFields = ['exportBillValue', 'billRealizedValue', 'billOutstandingValue'];
  const integerFields = ['shippingBillNo'];
  const countryCodeFields = ['buyerCountryCode', 'consigneeCountryCode', 'fobCurrency'];
  const today = new Date().toISOString().split('T')[0];

  const fieldsAllowingSpaces = new Set([
    'exportAgency', 'bankName',
    'buyerName', 'buyerAddress', 'buyerCountryCode',
    'consigneeName', 'consigneeCountryCode',
    'originOfGoods', 'portOfDestination',
    'tenorAsPerInvoice', 'commodityDescription',
    'shippingCompanyName', 'blAwbNo',
    'vesselName', 'commercialInvoice', 'tradeTerms'
  ]);

  function showError(input, message) {
    let error = input.nextElementSibling;
    if (!error || !error.classList.contains('error-message')) {
      error = document.createElement('div');
      error.className = 'error-message';
      error.style.color = 'red';
      error.style.fontSize = '0.9em';
      input.after(error);
    }
    error.textContent = message;
    input.style.borderColor = 'red'; // 🔴 highlight input
  }

  function clearError(input) {
    let error = input.nextElementSibling;
    if (error && error.classList.contains('error-message')) {
      error.textContent = '';
    }
    input.style.borderColor = ''; // reset back to default
  }


  function validateField(input) {
    clearError(input);
    const val = input.value.trim();
    const id = input.id;

    const isOptionalCountry = ['buyerCountryCode', 'consigneeCountryCode'].includes(id);

    if (!isOptionalCountry && input.hasAttribute('required') && val === '') {
      showError(input, 'This field is required');
      return false;
    }

    if (input.maxLength > 0 && val.length > input.maxLength) {
      showError(input, `Maximum length is ${input.maxLength}`);
      return false;
    }

    if (countryCodeFields.includes(id)) {
      if (val && !/^[A-Z]{3}$/.test(val)) {
        showError(input, 'Enter exactly 3 uppercase alphabetic letters');
        return false;
      }
    } else {
      const pattern = fieldsAllowingSpaces.has(id)
        ? /^[a-zA-Z0-9.\- ]*$/
        : /^[a-zA-Z0-9.\-]*$/;
      if (!pattern.test(val)) {
        showError(
          input,
          fieldsAllowingSpaces.has(id)
            ? 'Only letters, numbers, hyphens (-), dots (.), and spaces allowed'
            : 'No spaces allowed. Only letters, numbers, hyphens (-), and dots (.) allowed'
        );
        return false;
      }
    }

    switch (id) {
      case 'shippingBillNo':
        if (!/^\d{1,10}$/.test(val)) {
          showError(input, 'Enter a valid number (up to 10 digits)');
          return false;
        }
        break;

      case 'portCode':
        if (val.length !== 6) {
          showError(input, 'Port Code must be exactly 6 characters');
          return false;
        }
        break;

      case 'ieCode':
        if (val.length !== 10) {
          showError(input, 'IE Code must be exactly 10 characters');
          return false;
        }
        break;

      case 'shippingBillDate':
      case 'invoiceDate':
      case 'blDate':
        if (val) {
          const date = new Date(val);
          const year = date.getFullYear();
          const today = new Date();
          today.setHours(0,0,0,0);

          if (isNaN(date.getTime()) || year < 1000 || year > 9999) {
            showError(input, 'Enter a valid date with 4-digit year');
            return false;
          }
          if (id === 'shippingBillDate' && date > today) {
            showError(input, 'Shipping Bill Date cannot be in the future');
            return false;
          }
        }
        break;

      case 'exportBillValue':
      case 'billRealizedValue':
        if (val === '' && input.hasAttribute('required')) {
          showError(input, 'This field is required');
          return false;
        }
        if (!/^\d{1,18}(\.\d{1,2})?$/.test(val)) {
          showError(input, 'Enter a valid number (up to 18 digits before decimal and 2 decimals)');
          return false;
        }
        const exportVal = parseFloat(document.getElementById('exportBillValue')?.value || '0');
        const realizedVal = parseFloat(document.getElementById('billRealizedValue')?.value || '0');
        if (realizedVal !== exportVal) {
          showError(input, 'Bill Realized must be exactly equal to Export Bill Value');
          return false;
        }

        // check outstanding ≤ export bill
        const outstandingVal = parseFloat(document.getElementById('billOutstandingValue')?.value || '0');
        if (outstandingVal > exportVal) {
          showError(document.getElementById('billOutstandingValue'), 'Outstanding cannot exceed Export Bill Value');
          return false;
        }
        break;
    }

    return true;
  }


  function handleInput(e) {
    const input = e.target;
    const id = input.id;

    if (countryCodeFields.includes(id)) {
      input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
      return;
    }

    if (input.maxLength > 0 && input.value.length > input.maxLength) {
      input.value = input.value.slice(0, input.maxLength);
    }

    if (integerFields.includes(id)) {
      input.value = input.value.replace(/\D/g, '');
      return;
    }

    if (['shippingBillDate', 'invoiceDate', 'blDate'].includes(id)) {
      const parts = input.value.split('-');
      if (parts[0]?.length > 4) {
        parts[0] = parts[0].slice(0, 4);
        input.value = parts.join('-');
      }
    }

    if (decimalFields.includes(id)) {
      let val = input.value.replace(/[^0-9.]/g, '');
      const firstDecimal = val.indexOf('.');
      if (firstDecimal !== -1) {
        val = val.slice(0, firstDecimal + 1) + val.slice(firstDecimal + 1).replace(/\./g, '');
      }
      const parts = val.split('.');
      parts[0] = parts[0].slice(0, 18);
      if (parts.length > 1) parts[1] = parts[1].slice(0, 2);
      input.value = parts.join('.');

      if (id === 'billRealizedValue' || id === 'exportBillValue') {
        const exportVal = parseFloat(document.getElementById('exportBillValue')?.value || '0');
        const realizedVal = parseFloat(document.getElementById('billRealizedValue')?.value || '0');
        const outstandingInput = document.getElementById('billOutstandingValue');
        if (outstandingInput) {
          const outstanding = (exportVal - realizedVal).toFixed(2);
          outstandingInput.value = isNaN(outstanding) ? '' : outstanding;
        }
      }
      return;
    }

    if (!fieldsAllowingSpaces.has(id)) {
      input.value = input.value.replace(/[^a-zA-Z0-9.\-]/g, '');
    } else {
      input.value = input.value.replace(/[^a-zA-Z0-9.\- ]/g, '');
    }

    if (id === 'ieCode') {
      input.value = input.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10); 
      return;
    }

    if (id === 'portCode') {
      input.value = input.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6); 
      return;
    }

  }

  function handleBlur(e) {
    validateField(e.target);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') e.preventDefault();
  }

  useEffect(() => {
    const form = formRef.current;
    const inputs = form.querySelectorAll('input');

    inputs.forEach((input) => {
      input.addEventListener('input', handleInput);
      input.addEventListener('blur', handleBlur);
      input.addEventListener('keydown', handleKeydown);
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

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
        const response = await fetch('https://nijal-backend.onrender.com/api/sb/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formDataObj),
        });

        if (response.ok) {
          toast.success('Shipping Bill saved!', { duration: 1500 });
          setTimeout(() => router.push('/'), 2000);
        } else {
          const err = await response.json();
          toast.error(err.message || 'Something went wrong');
          setIsSubmitting(false);
        }
      } catch (error) {
        toast.error('Network error while submitting.');
        console.error(error);
        setIsSubmitting(false);
      }
    };

    form.addEventListener('submit', handleSubmit);

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('blur', handleBlur);
        input.removeEventListener('keydown', handleKeydown);
      });
      form.removeEventListener('submit', handleSubmit);
    };
  }, [isSubmitting]);

  const shippingBillFields = [
    ['shippingBillNo', 'Shipping Bill*'],
    ['formNo', 'Form No*'],
    ['shippingBillDate', 'Shipping Bill Date*', 'date'],
    ['portCode', 'Port Code*'],
    ['exportAgency', 'Export Agency*'],
    ['adCode', 'AD Code*'],
    ['bankName', 'Bank Name*'],
    ['ieCode', 'IE Code*'],
    ['invoiceNo', 'Invoice No*'],
    ['invoiceDate', 'Invoice Date*', 'date'],
    ['fobCurrency', 'FOB Currency*'],
    ['exportBillValue', 'Export Bill Value*'],
    ['billRealizedValue', 'Bill Realized Value*'],
    ['billOutstandingValue', 'Bill Outstanding Value*'],
  ];

  const otherFields = [
    ['buyerName', 'Buyer Name'],
    ['buyerAddress', 'Buyer Address'],
    ['buyerCountryCode', 'Buyer Country Code'],
    ['consigneeName', 'Consignee Name'],
    ['consigneeCountryCode', 'Consignee Country Code'],
    ['originOfGoods', 'Origin of Goods'],
    ['portOfDestination', 'Port of Destination'],
    ['tenorAsPerInvoice', 'Tenor as per Invoice'],
    ['commodityDescription', 'commodity Description'],
    ['shippingCompanyName', 'Shipping Company Name'],
    ['blAwbNo', 'BL/AWB No'],
    ['vesselName', 'Vessel Name'],
    ['blDate', 'BL Date', 'date'],
    ['commercialInvoice', 'Commercial Invoice'],
    ['tradeTerms', 'Trade Terms'],
  ];

  return (
    <form
      ref={formRef}
      id="addSbForm"
      className="px-16 py-8 text-base text-[#1c2e3d]"
      autoComplete="off"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#08315c]">Add Shipping Bill</h2>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">Shipping Bill Basic Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {shippingBillFields.map(([name, label, type = 'text']) => (
            <div key={name}>
              <label className="block font-semibold mb-2">{label}</label>
              <input
                required
                type={type}
                id={name}
                name={name}
                maxLength={50}
                max={type === 'date' ? today : undefined}   // 🔹 Block future dates
                className="w-full border border-gray-400 rounded px-3 py-2"
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">Other Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {otherFields.map(([name, label, type = 'text']) => (
            <div key={name}>
              <label className="block font-semibold mb-2">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                maxLength={50}
                max={type === 'date' ? today : undefined}  
                className="w-full border border-gray-400 rounded px-3 py-2"
                autoComplete="off"
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
