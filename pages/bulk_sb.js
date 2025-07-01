'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function BulkSBUpload() {
  const [csvData, setCsvData] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const router = useRouter();

  const headers = [
    'shippingBillNo', 'formNo', 'shippingBillDate', 'portCode', 'exportAgency',
    'adCode', 'bankName', 'ieCode', 'invoiceNo', 'invoiceDate', 'fobCurrency',
    'exportBillValue', 'billOutstandingValue', 'sbUtilization', 'buyerName',
    'buyerAddress', 'buyerCountryCode', 'consigneeName', 'consigneeCountryCode',
    'portOfDestination', 'finalDestination', 'commodity', 'shippingCompany',
    'blNumber', 'vesselName', 'blDate', 'commercialInvoice'
  ];

  const sampleRow = {
    shippingBillNo: '1234568',
    formNo: 'A1',
    shippingBillDate: '12-05-2024',
    portCode: 'INMUM1',
    exportAgency: 'DGFT',
    adCode: '6590001',
    bankName: 'HDFC Bank',
    ieCode: '987654321',
    invoiceNo: '21127240025-01',
    invoiceDate: '06-05-2024',
    fobCurrency: 'EUR',
    exportBillValue: '12000',
    billOutstandingValue: '3000',
    sbUtilization: '9000',
    buyerName: 'XYZ Global',
    buyerAddress: '456 Market Street',
    buyerCountryCode: 'DE',
    consigneeName: 'XYZ Global',
    consigneeCountryCode: 'DE',
    portOfDestination: 'DE',
    finalDestination: 'FR',
    commodity: 'Electronic devices',
    shippingCompany: 'MSC',
    blNumber: '1234568',
    vesselName: 'Vessel 77777',
    blDate: '07-05-2024',
    commercialInvoice: '21127240025'
  };

  const downloadSampleCSV = () => {
    const csv = Papa.unparse([headers, Object.values(sampleRow)], { quotes: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_sb_upload.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
      complete: (result) => {
        const rows = result.data;
        const valid = [];
        const invalid = [];

        rows.forEach((row, index) => {
          const errors = [];

          for (const field of headers) {
            if (!row[field] || row[field] === '') {
              errors.push(`Missing ${field}`);
            }
          }

          for (const field of ['shippingBillDate', 'invoiceDate', 'blDate']) {
            if (row[field] && !/^\d{2}-\d{2}-\d{4}$/.test(row[field])) {
              errors.push(`${field} has invalid format`);
            }
          }

          for (const numField of ['exportBillValue', 'billOutstandingValue', 'sbUtilization']) {
            if (row[numField] && !/^\d{1,18}(\.\d{1,2})?$/.test(row[numField])) {
              errors.push(`${numField} is invalid`);
            }
          }

          if (errors.length) {
            invalid.push({ row: index + 2, issues: errors });
          } else {
            valid.push(row);
          }
        });

        setCsvData(rows);
        setValidRows(valid);
        setInvalidRows(invalid);
      }
    });
  };

  const handleUpload = async () => {
    if (!validRows.length) {
      toast.error('No valid rows to upload',3000);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/sb/bulk_add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRows),
      });

      if (res.ok) {
        toast.success('Shipping Bill entries uploaded successfully!');
        setTimeout(() => router.push('/'), 1500);
      } else {
        toast.error('Upload failed',3000);
      }
    } catch (err) {
      toast.error('Network error',3000);
    }
  };

  return (
    <div className="px-16 py-10 font-sans text-[#1c2e3d]">
      <h1 className="text-3xl font-bold mb-6 text-[#08315c]">Bulk Shipping Bill Upload</h1>

      <div className="bg-[#e6f2f5] border border-[#bcdde4] rounded-lg p-6 mb-6 inline-block">
        <h2 className="text-lg font-semibold mb-3">📋 Instructions</h2>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Click the button below to download the sample CSV format.</li>
          <li>Start entering your data from row 3 onward.</li>
          <li>Ensure <code>Date</code> fields are in <b>dd-mm-yyyy</b> format.</li>
          <li>Ensure amount fields are numeric (up to 18 digits and 2 decimals).</li>
          <li>All fields are mandatory. Leave no blanks.</li>
        </ul>
      </div>

        <br/>

      <button
        onClick={downloadSampleCSV}
        className="bg-[#4c94a6] hover:bg-[#417e8e] text-white px-5 py-2 rounded-md mb-6"
      >
        Download Sample CSV
      </button>

        <br/>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative inline-block">
          <input
            type="file"
            id="csvUpload"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 w-full cursor-pointer"
          />
          <label
            htmlFor="csvUpload"
            className="bg-gray-300 text-black px-4 py-2 rounded-md cursor-pointer hover:bg-gray-400"
          >
            Choose File
          </label>
        </div>

        <span className="text-sm text-gray-700">
          {fileName ? `📁 ${fileName}` : 'No file chosen'}
        </span>
      </div>

      {csvData.length > 0 && (
        <div className="mt-6">
          <div className="bg-[#f0f7f9] border border-[#c9e4ea] rounded-lg p-5 mb-4">
            <h2 className="text-lg font-semibold text-[#08315c] mb-2">Validation Summary</h2>
            <p className="text-green-700 font-medium">✔️ Valid rows: {validRows.length}</p>
            <p className="text-red-700 font-medium">❌ Invalid rows: {invalidRows.length}</p>

            {invalidRows.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-300 rounded p-4">
                <h3 className="font-semibold text-red-700 mb-2">Issues found:</h3>
                <ul className="list-disc pl-5 text-sm text-red-800 space-y-1">
                  {invalidRows.map((item, i) => (
                    <li key={i}>Row {item.row}: {item.issues.join(', ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={validRows.length === 0}
            className={`mt-4 bg-[#08315c] text-white px-6 py-3 rounded-md font-semibold transition-all ${
              validRows.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#061f38]'
            }`}
          >
            Upload
          </button>
        </div>
      )}
    </div>
  );
}
