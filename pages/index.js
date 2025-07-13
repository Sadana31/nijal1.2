  'use client';

  import { useEffect, useState } from 'react';
  import { useRef, useCallback } from 'react';
  import { useRouter } from 'next/router';
  import {toast} from 'sonner';
  import React from 'react'; 

  export default function SBPage() {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchField, setSearchField] = useState('Shipping Bill');
    const [searchValue, setSearchValue] = useState('');
    const [expandedRows, setExpandedRows] = useState([]);
    const [entriesToShow, setEntriesToShow] = useState(10);
    const [selectedSB, setSelectedSB] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);

    const [sortField, setSortField] = useState('shippingBillNo'); // Default sort field
    const [sortDirection, setSortDirection] = useState('asc');     // Default sort direction

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10); // default 10
    const [mappingHistory, setMappingHistory] = useState([]);

    const router = useRouter();

      const handleClick = (text) => {
        if (text === 'Add Shipping Bill') {
          router.push('/add_sb');
        } else if (text === 'Export File') {
          exportToCSV();
        } else if (text === 'Details') {
          showSelectedDetails();
        } else if (text === 'Modify SB') {
          if (!selectedSB) {
            toast.error("Please select exactly one Shipping Bill to modify.");
            return;
          }

          const selectedSBNo = selectedSB;    
          router.push(`/modify_sb?id=${selectedSBNo._id}`);
        }
        else if (text == 'Bulk Shipping Bill Upload'){
          router.push('/bulk_sb');
        }
        else if (text === "Proceed to IRM Mapping") {
          if (!selectedSB) {
            toast.error("Please select exactly one Shipping Bill to map.");
            return;
          }

          // store the object, not a primitive
          sessionStorage.setItem("selectedRow", JSON.stringify(selectedSB));

          router.push({
            pathname: '/mapping',
            query: { mode: 'sbToIrm' }
          });
        }

      };

      const formatDate = (input) => {
        if (!input || typeof input !== 'string') return '';

        // If it's already dd-mm-yyyy, return as is
        if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
          return input;
        }

        // If it's ISO or yyyy-mm-dd, parse and format
        const date = new Date(input);
        if (isNaN(date.getTime())) return '';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
      };

      const handleSearch = useCallback(() => {
        const searchKey = {
          'Shipping Bill': 'shippingBillNo',
          'Form No': 'formNo',
          'Port Code': 'portCode',
          'Bank Name': 'bankName'
        }[searchField];

        const filtered = data.filter((row) =>
          row[searchKey]?.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredData(filtered);
      }, [data, searchField, searchValue]);

    useEffect(() => {
      fetch('https://nijal-backend.onrender.com/api/sb')
        .then((res) => res.json())
        .then((result) => {
          setData(result);
          setFilteredData(result);
        })
        .catch((err) => console.error('Failed to fetch:', err));
    }, []);

    useEffect(() => {
      handleSearch();
    }, [handleSearch]);



    const toggleRow = (id) => {
      setExpandedRows((prev) =>
        prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
      );
    };

    


    const placeholders = {
      'Shipping Bill': 'e.g. 123456',
      'Form No': 'e.g. A1B2C3',
      'Port Code': 'e.g. INMAA',
      'Bank Name': 'e.g. SBI'
    };

    const showSelectedDetails = async () => {
      if (!selectedSB) {
        alert("Please select exactly one Shipping Bill to view details.");
        return;
      }

      const selectedSBNo = selectedSB.shippingBillNo;
      const details = data.find((row) => row.shippingBillNo === selectedSBNo);
      setModalData(details);

      try {
        const res = await fetch(`https://nijal-backend.onrender.com/api/mapping/history/sb/${selectedSBNo}`);
        const history = await res.json();
        setMappingHistory(history);
      } catch (err) {
        console.error("Failed to fetch mapping history:", err);
        setMappingHistory([]);
      }

      setModalVisible(true);
    };



    const exportToCSV = () => {
      if (!filteredData.length) {
        return toast.error('No data to export');
      }

      const header = Object.keys(filteredData[0]);
        const csvRows = [
          header.join(','),
          ...filteredData.map(row => header.map(field => {
            const value = row[field];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(','))
        ];


      const csvData = csvRows.join('\n');
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'shipping_bills.csv';
      link.click();

      URL.revokeObjectURL(url);
    };

    const sanitizeAndValidate = (field, value) => {
  let sanitized = value;

  switch (field) {
    case 'Shipping Bill':
      // Only digits, max 10 chars
      sanitized = sanitized.replace(/\D/g, '').slice(0, 10);
      break;

    case 'Form No':
      // Letters, numbers, hyphen, dot, space, max 50 chars
      sanitized = sanitized.replace(/[^a-zA-Z0-9.\- ]/g, '').slice(0, 50);
      break;

    case 'Port Code':
      // Exactly 3 uppercase letters
      sanitized = sanitized.toUpperCase().replace(/[^a-zA-Z0-9.\- ]/g, '').slice(0, 20);
      break;

    case 'Bank Name':
      // Letters, numbers, hyphen, dot, space, max 50 chars
      sanitized = sanitized.replace(/[^a-zA-Z0-9.\- ]/g, '').slice(0, 50);
      break;

    default:
      // Default general sanitization
      sanitized = sanitized.replace(/[^a-zA-Z0-9.\- ]/g, '').slice(0, 50);
  }

  return sanitized;
};

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };



  const sortableHeaders = [
    { label: 'Shipping Bill', key: 'shippingBillNo' },
    { label: 'Form No', key: 'formNo' },
    { label: 'Shipping Bill Date', key: 'shippingBillDate' },
    { label: 'Port Code', key: 'portCode' },
    { label: 'Bank Name', key: 'bankName' },
    { label: 'Invoice Count', key: 'invoiceCount' },
    { label: 'FOB Currency', key: 'fobCurrency' },
    { label: 'Export Bill Value', key: 'exportBillValue' },
    { label: 'Bill Outstanding Value', key: 'billOutstandingValue' },
    { label: 'Buyer Name', key: 'buyerName' },
    { label: 'Buyer Country Code', key: 'buyerCountryCode' },
  ];


   const sortedData = [...filteredData].sort((a, b) => {
  if (!sortField) return 0;
  const valA = a[sortField] || '';
  const valB = b[sortField] || '';
  if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
  if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
  return 0;
});
  const totalPages = Math.ceil(sortedData.length / entriesToShow);

  const visibleRows = sortedData.slice(
    (currentPage - 1) * entriesToShow,
    currentPage * entriesToShow
  );



    return (
      <div className="px-15 py-10 bg-white min-h-screen font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">SB Details Dashboard</h1>

        {/* Search & Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <label className="text-lg font-semibold text-gray-700">Search by:</label>
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="!border border-gray-300 rounded-md px-3 py-2 shadow-sm text-gray-800"
            >
              <option>Shipping Bill</option>
              <option>Form No</option>
              <option>Port Code</option>
              <option>Bank Name</option>
            </select>
            <input
              type="text"
              placeholder={placeholders[searchField]}
              value={searchValue}
              onChange={(e) => {
                const val = e.target.value;
                const sanitizedVal = sanitizeAndValidate(searchField, val);
                setSearchValue(sanitizedVal);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              className="border border-gray-300 rounded-md px-4 py-2 w-64 shadow-sm placeholder-gray-500 text-gray-800"
            />
          </div>

          <div className="flex items-center gap-4">
            {['Add Shipping Bill', 'Bulk Shipping Bill Upload', 'Export File'].map((text, index) => (
              <button
                key={index}
                onClick={() => handleClick(text)}
                className="bg-[#4c94a6] hover:bg-[#417e8e] text-white px-5 py-2 rounded-md shadow font-medium transition-all"
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Entries Control */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <label className="text-gray-700">Show</label>
          <select
            value={entriesToShow}
            onChange={(e) => {
              setEntriesToShow(parseInt(e.target.value));
              setCurrentPage(1); // Reset to page 1
            }}
            className="border border-gray-300 rounded px-2 py-1 text-gray-800"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <label className="text-gray-700">entries</label>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
             <thead>
                <tr className="bg-[#7bbbc2] text-black font-semibold">
                  <th className="px-3 py-3 w-4"></th>
                  <th className="px-3 py-3 w-4"></th>
                  {sortableHeaders.map(({ label, key }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-3 text-left cursor-pointer select-none"
                    >
                      {label}
                      <span className="inline-block w-4 text-center">
                        {sortField === key ? (sortDirection === 'asc' ? '⬆️' : '⬇️') : '↕'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
            <tbody className="text-gray-800">
              {visibleRows.map((row) => (
                <>
                  <tr key={row._id} className="border-b">
                    <td className="px-3 py-2"><input
                      type="radio"
                      name="sbSelection"
                      checked={selectedSB?._id === row._id}
                      onChange={() => setSelectedSB(row)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleRow(row._id)} className="font-bold text-lg">
                        {expandedRows.includes(row._id) ? '−' : '+'}
                      </button>
                    </td>
                    <td className="px-4 py-2">{row.shippingBillNo}</td>
                    <td className="px-4 py-2">{row.formNo}</td>
                    <td>{formatDate(row.shippingBillDate)}</td>
                    <td className="px-4 py-2">{row.portCode}</td>
                    <td className="px-4 py-2">{row.bankName}</td>
                    <td className="px-4 py-2">{row.invoiceCount}</td>
                    <td className="px-4 py-2">{row.fobCurrency}</td>
                    <td className="px-4 py-2">{row.exportBillValue}</td>
                    <td className="px-4 py-2">{row.billOutstandingValue}</td>
                    <td className="px-4 py-2">{row.buyerName}</td>
                    <td className="px-4 py-2">{row.buyerCountryCode}</td>
                  </tr>
                  {expandedRows.includes(row._id) && (
                    <tr className="bg-gray-50 text-sm">
                      <td colSpan={14} >
                        <table className="w-full border-collapse text-left">
                          <tbody>
                            <tr className="bg-gray-100 font-semibold">
                              <td className="px-4 py-2">  </td>
                              <td className="px-4 py-2">IE Code</td>
                              <td className="px-4 py-2">Invoice Date</td>
                              <td className="px-4 py-2">Realized Value</td>
                              <td className="px-4 py-2">Buyer Address</td>
                              <td className="px-4 py-2">Consignee Country Code</td>
                              <td className="px-4 py-2">Port of Destination</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2">  </td>
                              <td className="px-4 py-2">{row.ieCode || '123456789'}</td>
                              <td className="px-4 py-2">{row.invoiceDate || '05-05-2024'}</td>
                              <td className="px-4 py-2">{row.realizedValue || '$4,000.00'}</td>
                              <td className="px-4 py-2">{row.buyerAddress || 'Test Address'}</td>
                              <td className="px-4 py-2">{row.consigneeCountryCode || 'IN'}</td>
                              <td className="px-4 py-2">{row.portOfDestination || 'US'}</td>
                            </tr>
                            <tr className="bg-gray-100 font-semibold">
                              <td className="py-2"> </td>
                              <td className="px-4 py-2">Shipping Company</td>
                              <td className="px-4 py-2">Vessel Name</td>
                              <td className="px-4 py-2">BL Date</td>
                              <td className="px-4 py-2">Commercial Invoice</td>
                              <td className="px-4 py-2">Trade Terms</td>
                              <td className="px-4 py-2">Commodity</td>
                            </tr>
                            <tr>
                              <td className="py-2">         </td>
                              <td className="px-4 py-2">{row.shippingCompany || 'Maersk'}</td>
                              <td className="px-4 py-2">{row.vesselName || 'Vessel 55555'}</td>
                              <td className="px-4 py-2">{row.blDate || '06-05-2024'}</td>
                              <td className="px-4 py-2">{row.commercialInvoice || '21127240024'}</td>
                              <td className="px-4 py-2">{row.tradeTerms || '-'}</td>
                              <td className="px-4 py-2">{row.commodity || 'Heavy metal goods'}</td>
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


<div className="flex justify-end mt-6 pr-4 text-xs">
  <div className="flex items-center gap-1">
    <button
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      className="px-2 py-[2px] border rounded border-gray-400 text-gray-600 disabled:opacity-40"
    >
      Prev
    </button>

    {(() => {
      const pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (currentPage > 4) pages.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 3) pages.push('...');
        pages.push(totalPages);
      }

      return pages.map((p, i) => (
        <button
          key={i}
          onClick={() => typeof p === 'number' && setCurrentPage(p)}
          disabled={p === '...'}
          className={`px-2 py-[2px] border rounded ${
            p === currentPage
              ? 'border-black font-semibold text-black'
              : 'border-gray-400 text-gray-800'
          } ${p === '...' ? 'pointer-events-none opacity-60' : ''}`}
        >
          {p}
        </button>
      ));
    })()}

    <button
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages}
      className="px-2 py-[2px] border rounded border-gray-400 text-gray-600 disabled:opacity-40"
    >
      Next
    </button>
  </div>
</div>


        <br/><br/>
        <div className="flex items-center gap-4 mt-6">
        {['Details', 'Modify SB', 'Proceed to IRM Mapping'].map((text, i) => (
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
        <h2 className="text-xl font-semibold">Shipping Bill Details</h2>
        <button
          onClick={() => setModalVisible(false)}
          className="text-white text-2xl font-bold"
        >
          &times;
        </button>
      </div>

      {/* Modal Content */}
      <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-5 gap-x-10 text-sm text-[#1c2e3d]">
        {[
          ['Shipping Bill', modalData.shippingBillNo],
          ['Shipping Bill Date', modalData.shippingBillDate],
          ['Port Code', modalData.portCode],
          ['Bank Name', modalData.bankName],
          ['Invoice Count', modalData.invoiceCount],
          ['FOB Currency', modalData.fobCurrency],
          ['Export Bill Value', modalData.exportBillValue],
          ['Bill Outstanding Value', modalData.billOutstandingValue],
          ['Buyer Name', modalData.buyerName],
          ['Buyer Country Code', modalData.buyerCountryCode],
          ['IE Code', modalData.ieCode],
          ['Commercial Invoice', modalData.commercialInvoice],
          ['Trade Terms', modalData.tradeTerms],
          ['Invoice Date', modalData.invoiceDate],
          ['Realized Value', modalData.realizedValue],
          ['Buyer Address', modalData.buyerAddress],
          ['Consignee Country Code', modalData.consigneeCountryCode],
          ['Port of Destination', modalData.portOfDestination],
          ['Shipping Company', modalData.shippingCompany],
          ['Vessel Name', modalData.vesselName],
          ['BL Date', modalData.blDate],
          ['Commodity', modalData.commodity],
        ].map(([label, value], idx) => (
          <div key={idx}>
            <div className="font-semibold text-[#1f2937]">{label}</div>
            <div className="text-[#475569]">{value || '-'}</div>
          </div>
        ))}
      </div>

            <div className="px-8 pb-10">
  <h3 className="text-xl font-semibold text-[#1f2937] mt-10 mb-4">IRM Mapping History</h3>
  <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
    <table className="w-full text-sm text-gray-800 border-collapse">
      <thead>
        <tr className="bg-[#72c1c7] text-black font-semibold">
          <th className="px-4 py-3 text-left">Bank Name</th>
          <th className="px-4 py-3 text-left">Remittance Ref No</th>
          <th className="px-4 py-3 text-left">Remittance Date</th>
          <th className="px-4 py-3 text-left">Purpose Code</th>
          <th className="px-4 py-3 text-left">Currency</th>
          <th className="px-4 py-3 text-left">Remittance Amount</th>
          <th className="px-4 py-3 text-left">Outstanding</th>
          <th className="px-4 py-3 text-left">Remitter Name</th>
          <th className="px-4 py-3 text-left">Utilized</th>
        </tr>
      </thead>
      <tbody>
        {mappingHistory.length > 0 ? (
          mappingHistory.map((entry, idx) =>
            entry.mappedIRMs.map((irm, i) => (
              <tr key={`${idx}-${i}`} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{irm.BankName}</td>
                <td className="px-4 py-2">{irm.RemittanceRefNumber}</td>
                <td className="px-4 py-2">{irm.RemittanceDate}</td>
                <td className="px-4 py-2">{irm.PurposeCode}</td>
                <td className="px-4 py-2">{irm.RemittanceCurrency}</td>
                <td className="px-4 py-2">{irm.RemittanceAmount}</td>
                <td className="px-4 py-2">{irm.OutstandingAmount}</td>
                <td className="px-4 py-2">{irm.RemitterName}</td>
                <td className="px-4 py-2">{irm.irmUtilizationAmount || irm.UtilizedAmount || '-'}</td>
              </tr>
            ))
          )
        ) : (
          <tr>
            <td className="px-4 py-4 text-center text-gray-500 italic" colSpan={9}>
              No mapping history
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>





    </div>
  </div>
)}



      </div>
    );
  }