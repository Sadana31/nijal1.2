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
  }

  function clearError(input) {
    let error = input.nextElementSibling;
    if (error && error.classList.contains('error-message')) {
      error.textContent = '';
    }
  }

  function validateField(input) {
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

    // Country Code Special Check
    if (countryCodeFields.includes(id)) {
      if (!/^[A-Z]{3}$/.test(val)) {
        showError(input, 'Enter exactly 3 uppercase alphabetic letters');
        return false;
      }
    } else {
        // Check allowed characters
        if (!/^[a-zA-Z0-9.\- ]*$/.test(val)) {
          showError(input, 'Only letters, numbers, hyphens (-), and dots (.) allowed');
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

      case 'shippingBillDate':
      case 'invoiceDate':
      case 'blDate':
        if (val) {
          const date = new Date(val);
          const year = date.getFullYear();
          if (isNaN(date.getTime()) || year < 1000 || year > 9999) {
            showError(input, 'Enter a valid date with 4-digit year');
            return false;
          }
        }
        break;

      case 'exportBillValue':
      case 'billRealizedValue':
      case 'billOutstandingValue':
        if (val === '') {
          if (input.hasAttribute('required')) {
            showError(input, 'This field is required');
            return false;
          }
          break;
        }
        if (!/^\d{1,18}(\.\d{1,2})?$/.test(val)) {
          showError(input, 'Enter a valid number (up to 18 digits before decimal and 2 decimals)');
          return false;
        }
        break;
    }

    return true;
  }

  function handleInput(e) {
    const input = e.target;
    const id = input.id;

    // Country code fields – uppercase only letters
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
      if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].slice(0, 4);
        input.value = parts.join('-');
      }
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
      return;
    }

    // For all others: allow only letters, numbers, dot, hyphen
    input.value = input.value.replace(/[^a-zA-Z0-9.\- ]/g, '');
  }

  useEffect(() => {
    const form = formRef.current;
    const inputs = form.querySelectorAll('input');

    const disableEnterKey = (e) => {
      if (e.key === 'Enter') e.preventDefault();
    };

    inputs.forEach((input) => {
      input.addEventListener('input', handleInput);
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('keydown', disableEnterKey);
    });

    form.addEventListener('submit', async (e) => {
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
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('keydown', disableEnterKey);
      });
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
    ['commodityDescription', 'Commodity Description'],
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
        <legend className="font-semibold text-[#08315c] px-2 text-lg">
          Shipping Bill Basic Details
        </legend>
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
                className="w-full border border-gray-400 rounded px-3 py-2"
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">
          Other Details
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {otherFields.map(([name, label, type = 'text']) => (
            <div key={name}>
              <label className="block font-semibold mb-2">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                maxLength={50}
                className="w-full border border-gray-400 rounded px-3 py-2"
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`bg-[#08315c] text-white font-semibold px-8 py-3 rounded text-lg ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#061f38]'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
