'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {toast} from 'sonner';

export default function AddShippingBill() {
  const [formData, setFormData] = useState({});
  const formRef = useRef(null);

  const decimalFields = ['exportBillValue', 'billRealizedValue', 'billOutstandingValue'];
  const integerFields = ['shippingBill'];
  const router = useRouter();

  useEffect(() => {
    const form = formRef.current;

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

      if (input.hasAttribute('required') && val === '') {
        showError(input, 'This field is required');
        return false;
      }

      if (input.maxLength > 0 && val.length > input.maxLength) {
        showError(input, `Maximum length is ${input.maxLength}`);
        return false;
      }

      switch (input.id) {
        case 'shippingBill':
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

    if (input.maxLength > 0 && input.value.length > input.maxLength) {
        input.value = input.value.slice(0, input.maxLength);
    }

    const id = input.id;

    if (integerFields.includes(id)) {
        input.value = input.value.replace(/\D/g, '');
        return;
    }

    if (['shippingBillDate', 'invoiceDate', 'blDate'].includes(id)) {
        const parts = input.value.split('-');
        if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].slice(0, 4); // restrict year input to 4 digits
        input.value = parts.join('-');
        }
    }

    if (decimalFields.includes(id)) {
        let val = input.value;
        const selectionStart = input.selectionStart;

        val = val.replace(/[^0-9.]/g, '');

        const firstDecimal = val.indexOf('.');
        if (firstDecimal !== -1) {
        val =
            val.slice(0, firstDecimal + 1) +
            val.slice(firstDecimal + 1).replace(/\./g, '');
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
    }


    const inputs = form.querySelectorAll('input');
    inputs.forEach((input) => {
      input.addEventListener('input', handleInput);
      input.addEventListener('blur', () => validateField(input));
    });

    form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;
  inputs.forEach((input) => {
    if (!validateField(input)) {
      valid = false;
    }
  });
  if (valid) {
    try {
      const response = await fetch('http://localhost:5000/api/sb/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // ✅ use formData from React state
      });


      if (response.ok) {
        toast.success('Shipping Bill saved!', { duration: 1500 });
        setTimeout(() => router.push('/'), 2000);
      } else {
        const err = await response.json();
        toast.error(err.message || 'Something went wrong');
      }

    } catch (error) {
      toast.error('Network error while submitting.');
      console.error(error);
    }
  } else {
    toast.error('Please fix errors before submitting.');
  }
});



    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('blur', () => validateField(input));
      });
    };
  }, []);

  return (
    <form
      ref={formRef}
      id="addSbForm"
      className="px-16 py-8 text-base text-[#1c2e3d]"
    >
      <h2 className="text-2xl font-bold mb-6 text-[#08315c]">Add Shipping Bill</h2>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">Shipping Bill Basic Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            ['shippingBill', 'Shipping Bill*', 'text', 10, true],
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
          ].map(([name, label, type = 'text']) => (
            <div key={name}>
              <label className="block font-semibold mb-2">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                value={formData[name] || ''}
                onChange={(e) =>
                  setFormData({ ...formData, [name]: e.target.value })
                }
                className="w-full border border-gray-400 rounded px-3 py-2"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">Other Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
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
          ].map(([name, label, type = 'text']) => (
            <div key={name}>
              <label className="block font-semibold mb-2">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                value={formData[name] || ''}
                onChange={(e) =>
                  setFormData({ ...formData, [name]: e.target.value })
                }
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