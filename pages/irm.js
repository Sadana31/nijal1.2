'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function IRMPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchField, setSearchField] = useState('Remittance Ref No');
  const [searchValue, setSearchValue] = useState('');
  const [expandedRows, setExpandedRows] = useState([]);
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [selectedIRMs, setSelectedIRMs] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);

  const router = useRouter();

  const handleClick = (text) => {
    if (text === 'Add IRM Entry') {
      router.push('/add_irm');
    } else if (text === 'Export File') {
      exportToCSV();
    }
    else if (text== 'Details'){
      showSelectedDetails();
    } else if (text === 'Modify IRM') {
          if (selectedIRMs.size !== 1) {
            toast.error("Please select exactly one IRM to modify.");
            return;
          }

          const selectedIRMNo = [...selectedIRMs][0];
          const selectedRow = data.find((row) => row.RemittanceRefNumber === selectedIRMNo);

          if (!selectedRow) {
            toast.error("Selected IRM not found.");
            return;
          }

          router.push(`/modify_irm?id=${selectedRow._id}`);
        }
      else if (text == 'Bulk IRM Upload'){
          router.push('/bulk_irm');
      }
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/irm')
      .then((res) => res.json())
      .then((result) => {
        const normalized = result.map(row => ({
          ...row,
          RemittanceRefNumber: row.RemittanceRefNumber || row.remittanceRefNo,
          BankName: row.BankName || row.bankName,
          IECode: row.IECode || row.ieCode,
          RemittanceDate: row.RemittanceDate || row.remittanceDate,
          RemittanceAmount: row.RemittanceAmount || row.remittanceAmount,
          OutstandingAmount: row.OutstandingAmount || row.outstandingAmount,
          RemitterName: row.RemitterName || row.remitterName,
          Status: row.Status || row.status,
          ADCode: row.ADCode || row.adCode,
          PurposeCode: row.PurposeCode || row.purposeCode,
          RemittanceCurrency: row.RemittanceCurrency || row.remittanceCurrency,
          UtilizedAmount: row.UtilizedAmount || row.utilizedAmount,
          RemitterAddress: row.RemitterAddress || row.remitterAddress,
          RemitterCountryCode: row.RemitterCountryCode || row.remitterCountryCode,
          RemitterBank: row.RemitterBank || row.remitterBank,
          OtherBankRefNumber: row.OtherBankRefNumber || row.otherBankRef
        }));
        setData(normalized);
        setFilteredData(normalized);
      })
      .catch(() => toast.error('Failed to fetch data'));
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchValue, searchField]);

  const handleSearch = () => {
    const keyMap = {
      'Remittance Ref No': 'RemittanceRefNumber',
      'Bank Name': 'BankName',
      'AD Code': 'ADCode',
      'IE Code': 'IECode'
    };
    const key = keyMap[searchField];
    const filtered = data.filter((row) => row[key]?.toLowerCase().includes(searchValue.toLowerCase()));
    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    if (!filteredData.length) return toast.error('No data to export');

    const headers = Object.keys(filteredData[0]);
    const csvRows = [
      headers.join(','),
      ...filteredData.map(row => headers.map(field => {
        const val = row[field];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'irm_data.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleRow = (id) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const showSelectedDetails = () => {
    if (selectedIRMs.size !== 1) return toast.error('Select exactly one IRM entry.');
    const id = [...selectedIRMs][0];
    const details = data.find((row) => row.RemittanceRefNumber === id);
    setModalData(details);
    setModalVisible(true);
  };

  const visibleRows = filteredData.slice(0, entriesToShow);

  const searchOptions = ['Remittance Ref No', 'Bank Name', 'AD Code', 'IE Code'];
  const placeholders = {
    'Remittance Ref No': 'e.g. 0002GRS12345678',
    'Bank Name': 'e.g. SBI',
    'AD Code': 'e.g. 6390005',
    'IE Code': 'e.g. 1234567890'
  };

  return (
    <div className="px-12 py-10 font-sans">
      <h1 className="text-4xl font-bold mb-6 text-[#08315c]">IRM Details Dashboard</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <label className="text-black font-bold">Search by:</label>
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-black"
          >
            {searchOptions.map((opt, i) => <option key={i}>{opt}</option>)}
          </select>
          <input
            type="text"
            placeholder={placeholders[searchField]}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 text-black w-64"
          />
        </div>
        <div className="flex items-center gap-4">
          {['Add IRM Entry', 'Bulk IRM Upload', 'Export File'].map((text, i) => (
            <button
              key={i}
              onClick={() => handleClick(text)}
              className="bg-[#4c94a6] hover:bg-[#417e8e] text-white px-5 py-2 rounded-md"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <label className='text-black'>Show</label>
        <select
          value={entriesToShow}
          onChange={(e) => setEntriesToShow(parseInt(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-black"
        >
          {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <label className='text-black'>entries</label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#7bbbc2] font-semibold">
              <th className="px-2 py-3 w-4"><input type="checkbox" /></th>
              <th className="px-2 py-3 w-4 text-black"></th>
              {["RemittanceRefNumber", "BankName", "IECode", "RemittanceDate", "RemittanceAmount", "OutstandingAmount", "RemitterName", "Status"].map((head, i) => (
                <th key={i} className="px-4 py-3 text-left text-black">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <>
                <tr key={row._id} className="border-b">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIRMs.has(row.RemittanceRefNumber)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIRMs);
                        if (e.target.checked) newSet.add(row.RemittanceRefNumber);
                        else newSet.delete(row.RemittanceRefNumber);
                        setSelectedIRMs(newSet);
                      }}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => toggleRow(row._id)} className="font-bold text-black">
                      {expandedRows.includes(row._id) ? '−' : '+'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-black">{row.RemittanceRefNumber}</td>
                  <td className="px-4 py-2 text-black">{row.BankName}</td>
                  <td className="px-4 py-2 text-black">{row.IECode}</td>
                  <td className="px-4 py-2 text-black">{row.RemittanceDate}</td>
                  <td className="px-4 py-2 text-black">{row.RemittanceAmount}</td>
                  <td className="px-4 py-2 text-black">{row.OutstandingAmount}</td>
                  <td className="px-4 py-2 text-black">{row.RemitterName}</td>
                  <td className="px-4 py-2 text-black">{row.Status}</td>
                </tr>
                {expandedRows.includes(row._id) && (
  <tr className="bg-gray-50 text-sm">
    <td colSpan={11}>
      <table className="w-full border-collapse text-left">
        <thead className="bg-gray-100 font-semibold text-black">
          <tr>
            {[" ","ADCode", "PurposeCode", "RemittanceCurrency", "UtilizedAmount"].map((key, i) => (
              <th key={i} className="px-4 py-2">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {[" ","ADCode", "PurposeCode", "RemittanceCurrency", "UtilizedAmount"].map((key, i) => (
              <td key={i} className="px-4 py-2 text-black">{row[key] || '-'}</td>
            ))}
          </tr>
        </tbody>

        <thead className="bg-gray-100 font-semibold text-black">
          <tr>
            {[" ","RemitterAddress", "RemitterCountryCode", "RemitterBank", "OtherBankRefNumber"].map((key, i) => (
              <th key={i} className="px-4 py-2">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {["","RemitterAddress", "RemitterCountryCode", "RemitterBank", "OtherBankRefNumber"].map((key, i) => (
              <td key={i} className="px-4 py-2 text-black">{row[key] || '-'}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
)}

              </>
            ))}
          </tbody>
        </table>
      </div>

      <br /><br />
      <div className="flex items-center gap-4 mt-6">
        {['Details', 'Modify IRM', 'Proceed to SB Mapping'].map((text, i) => (
          <button
            key={i}
            onClick={() => handleClick(text)}
            className="bg-[#4c94a6] hover:bg-[#417e8e] text-white font-semibold px-5 py-2 rounded-md"
          >
            {text}
          </button>
        ))}
      </div>


      {modalVisible && modalData && (
        <div className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50">
            <div className="bg-[#f3f8fa] rounded-lg w-[90%] max-w-6xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-300">
            {/* Modal Header */}
            <div className="bg-[#264a54] text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                <h2 className="text-xl font-semibold">IRM Details</h2>
                <button
                onClick={() => setModalVisible(false)}
                className="text-white text-2xl font-bold"
                >
                &times;
                </button>
            </div>
            <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-5 gap-x-10 text-sm text-[#1c2e3d]">
              {Object.entries(modalData).map(([label, value], i) => (
                <div key={i}>
                  <div className="font-semibold text-[#1f2937]">{label}</div>
                  <div className="text-gray-800">{value || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
