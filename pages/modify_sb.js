'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function ModifyShippingBill() {
  const [formData, setFormData] = useState({});
  const formRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const decimalFields = ['exportBillValue', 'billRealizedValue', 'billOutstandingValue'];
  const integerFields = ['shippingBill'];

  useEffect(() => {
    if (id) {
      fetch(`https://nijal-backend.onrender.com/api/sb/${id}`)
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

          const cleanValue = (val) => (val === 'NA' || val === 'N/A' ? '' : val);

          const cleanedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              key,
              typeof value === 'string' ? cleanValue(value) : value,
            ])
          );

          setFormData({
            ...cleanedData,
            shippingBillDate: convertDate(data.shippingBillDate),
            invoiceDate: convertDate(data.invoiceDate),
            blDate: convertDate(data.blDate),
          });
        })
        .catch(() => toast.error('Failed to load shipping bill'));
    }
  }, [id]);

  useEffect(() => {
    const form = formRef.current;
    const inputs = form.querySelectorAll('input');

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
      }
    }

    inputs.forEach((input) => {
      input.addEventListener('input', handleInput);
      input.addEventListener('blur', () => validateField(input));
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('blur', () => validateField(input));
      });
    };
  }, []);

  useEffect(() => {
    const form = formRef.current;

    const submitHandler = async (e) => {
      e.preventDefault();

      const inputs = form.querySelectorAll('input');
      let valid = true;
      inputs.forEach((input) => {
        if (!input.disabled && !input.readOnly && !validateField(input)) valid = false;
      });

      if (!valid) {
        toast.error('Please fix errors before submitting.');
        return;
      }

      try {
        const response = await fetch(`https://nijal-backend.onrender.com/api/sb/update/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success('Shipping Bill updated!', { duration: 1500 });
          setTimeout(() => router.push('/'), 1500);
        } else {
          const err = await response.json();
          toast.error(err.message || 'Update failed.');
        }
      } catch (error) {
        toast.error('Network error during update.');
        console.error(error);
      }
    };

    form.addEventListener('submit', submitHandler);
    return () => form.removeEventListener('submit', submitHandler);
  }, [formData, id, router]);

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
      const error = input.nextElementSibling;
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
          if (!/^\d{1,18}(\.\d{1,2})?$/.test(val)) {
            showError(input, 'Enter a valid number (18 digits max, 2 decimals)');
            return false;
          }
          break;
      }

      return true;
    }
    
  return (
    <form ref={formRef} className="px-16 py-8 text-base text-[#1c2e3d]">
      <h2 className="text-2xl font-bold mb-6 text-[#08315c]">Modify Shipping Bill</h2>

      <fieldset className="border border-gray-400 rounded p-6 mb-8">
        <legend className="font-semibold text-[#08315c] px-2 text-lg">Shipping Bill Basic Details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[
            ['shippingBillNo', 'Shipping Bill*', 'text', 10],
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
            ['sbUtilization', 'Bill Realized Value*'],
            ['billOutstandingValue', 'Bill Outstanding Value*'],
          ].map(([name, label, type = 'text', maxLength]) => (
            <div key={name}>
              <label className="block font-semibold mb-2">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                maxLength={maxLength}
                required
                value={formData[name] || ''}
                onChange={(e) =>
                  setFormData({ ...formData, [name]: e.target.value })
                }
                className={`w-full border border-gray-400 rounded px-3 py-2 ${formData[name] ? 'bg-gray-100' : ''}`}
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
