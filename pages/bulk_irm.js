'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';

export default function BulkIRMUpload() {
  const [csvData, setCsvData] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [fileName, setFileName] = useState('');

  const headers = [
    'SrNo', 'adCode', 'bankName', 'ieCode', 'RemittanceRefNumber',
    'remittanceDate', 'purposeCode', 'remittanceCurrency', 'remittanceAmount',
    'utilizedAmount', 'outstandingAmount', 'remitterName', 'remitterAddress',
    'remitterCountryCode', 'remitterBank', 'otherBankRefNumber', 'Status', 'remittanceType'
  ];

  const sampleRow = {
    SrNo: '1',
    adCode: '6390005',
    bankName: 'Kotak Bank',
    ieCode: '654987321',
    RemittanceRefNumber: '0002GRS65498732',
    remittanceDate: '10-05-2024',
    purposeCode: 'P1305',
    remittanceCurrency: 'JPY',
    remittanceAmount: '4000000',
    utilizedAmount: '1000000',
    outstandingAmount: '3000000',
    remitterName: 'UVW Inc',
    remitterAddress: 'Osaka Street',
    remitterCountryCode: 'JP',
    remitterBank: 'MUFG',
    otherBankRefNumber: 'Test654987',
    Status: 'partially',
    remittanceType: 'IRM'
  };

  const downloadSampleCSV = () => {
    const csv = Papa.unparse([headers, Object.values(sampleRow)], { quotes: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_irm_upload.csv';
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
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: (result) => {
        const rows = result.data;
        const valid = [];
        const invalid = [];

        const requiredFields = [
          "RemittanceRefNo", "adCode", "bankName", "ieCode", "remittanceDate",
          "purposeCode", "remittanceCurrency", "remittanceAmount", "utilizedAmount",
          "outstandingAmount", "remitterName", "remitterAddress", "remitterCountryCode",
          "remitterBank", "otherBankRef", "status", "remittanceType"
        ];

        rows.forEach((row, index) => {
          const errors = [];

          for (const field of requiredFields) {
            if (!row[field] || row[field].trim() === "") {
              errors.push(`Missing ${field}`);
            }
          }

          if (row.remittanceDate && !/^\d{2}-\d{2}-\d{4}$/.test(row.remittanceDate)) {
            errors.push("Invalid remittanceDate format");
          }

          for (const key of ["remittanceAmount", "utilizedAmount", "outstandingAmount"]) {
            if (row[key] && !/^\d{1,18}(\.\d{1,2})?$/.test(row[key])) {
              errors.push(`${key} is invalid`);
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
      toast.error('No valid rows to upload');
      return;
    }

    try {
      const response = await fetch('https://nijal-backend.onrender.com/api/irm/bulk_add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRows),
      });

      if (response.ok) {
        toast.success('IRM entries uploaded successfully!');
        setCsvData([]);
        setValidRows([]);
        setInvalidRows([]);
        setTimeout(() => {
            router.push('/irm');  
        }, 1500);  
        } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Network error during upload');
    }
  };

  return (
    <div className="px-16 py-10 font-sans text-[#1c2e3d]">
      <h1 className="text-3xl font-bold mb-6 text-[#08315c]">Bulk IRM Upload</h1>

      <div className="bg-[#e6f2f5] border border-[#bcdde4] rounded-lg p-6 mb-6 inline-block">
        <h2 className="text-lg font-semibold mb-3">📋 Instructions</h2>
        <ul className="list-disc ml-6 text-sm space-y-1">
          <li>Download the sample CSV using the button below.</li>
          <li>Start entering your data from row 3 onward (row 1 is headers, row 2 is sample).</li>
          <li><b>Date format</b> must be <code>dd-mm-yyyy</code>.</li>
          <li>Numeric fields (amounts) can have up to 18 digits and 2 decimal places.</li>
          <li>All required fields must be filled — empty values are flagged.</li>
        </ul>
      </div>

      <br/>

      <button
        onClick={downloadSampleCSV}
        className="bg-[#4c94a6] hover:bg-[#417e8e] text-white px-5 py-2 rounded-md mb-6"
      >
        Download Sample CSV
      </button>
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
