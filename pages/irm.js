'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';

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
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("All"); // All, Completed, Partial, Outstanding

  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * entriesToShow;
  const endIndex = startIndex + entriesToShow;
  const totalPages = Math.ceil(filteredData.length / entriesToShow);

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
          const selectedRow = data.find((row) => row.RemittanceRefNo === selectedIRMNo);

          if (!selectedRow) {
            toast.error("Selected IRM not found.");
            return;
          }

          router.push(`/modify_irm?id=${selectedRow._id}`);
        }
      else if (text == 'Bulk IRM Upload'){
          router.push('/bulk_irm');
      }
      else if (text === "Proceed to SB Mapping") {
                if (selectedIRMs.size !== 1) {
                  toast.error("Please select exactly one IRM to map.");
                  return;
                }
      
                const selectedIRMNo = [...selectedIRMs][0];
                const selectedRow = data.find((row) => row.RemittanceRefNo === selectedIRMNo);
      
                if (!selectedRow) {
                  toast.error("Selected IRM not found.");
                  return;
                }
      
                // ✅ Store in sessionStorage
                sessionStorage.setItem("selectedRow", JSON.stringify(selectedRow));
      
                // ✅ Navigate
                router.push({
                  pathname: '/mapping',
                  query: { mode: 'irmToSb' }
                });
              }
  };

  const getStatus = (row) => {
    if (row.outstandingAmount === 0) return "Completed";
    if (row.outstandingAmount > 0 && row.outstandingAmount < row.remittanceAmount) return "Partial";
    if (row.outstandingAmount === row.remittanceAmount) return "Outstanding";
    return "Other";
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };


  useEffect(() => {
    fetch('https://nijal-backend.onrender.com/api/irm')
      .then((res) => res.json())
      .then((result) => {
        const normalized = result.map(row => ({
          ...row,
          RemittanceRefNo: row.RemittanceRefNo || row.RemittanceRefNo,
          bankName: row.bankName || row.bankName,
          ieCode: row.ieCode || row.ieCode,
          remittanceDate: row.remittanceDate || row.remittanceDate,
          remittanceAmount: row.remittanceAmount || row.remittanceAmount,
          outstandingAmount: row.outstandingAmount || row.outstandingAmount,
          remitterName: row.remitterName || row.remitterName,
          status: row.status || row.Status,
          adCode: row.adCode || row.adCode,
          purposeCode: row.purposeCode || row.purposeCode,
          remittanceCurrency: row.remittanceCurrency || row.remittanceCurrency,
          utilizedAmount: row.utilizedAmount || row.utilizedAmount,
          remitterAddress: row.remitterAddress || row.remitterAddress,
          remitterCountryCode: row.remitterCountryCode || row.remitterCountryCode,
          remitterBank: row.remitterBank || row.remitterBank,
          otherBankRefNumber: row.otherBankRefNumber || row.otherBankRefNumber,
        }));
        setData(normalized);
        setFilteredData(normalized);
      })
      .catch(() => toast.error('Failed to fetch data'));
  }, []);

  const handleSearch = useCallback(() => {
    const keyMap = {
      'Remittance Ref No': 'RemittanceRefNo',
      'Bank Name': 'bankName',
      'AD Code': 'adCode',
      'IE Code': 'ieCode'
    };
    const key = keyMap[searchField];
    const filtered = data.filter((row) =>
      row[key]?.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredData(filtered);
  }, [data, searchField, searchValue]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  


  const sanitizeSearchInput = (field, value) => {
  let val = value;

  switch (field) {
    case 'AD Code':
      val = val.replace(/\D/g, '').slice(0, 10);
      break;
   case 'IE Code':
    // Only digits, max 10 digits
    val = val.replace(/\D/g, '').slice(0, 10);
    break;


    case 'Remittance Ref No':
    case 'Bank Name':
      // Letters, numbers, hyphen, dot, space, max 50 chars
      val = val.replace(/[^a-zA-Z.\- ]/g, '').slice(0, 20);
      break;

    default:
      val = val;
  }

  return val;
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

  const showSelectedDetails = async () => {
    if (selectedIRMs.size !== 1) return toast.error('Select exactly one IRM entry.');
    const id = [...selectedIRMs][0];
    const details = data.find((row) => row.RemittanceRefNo === id);

    if (!details) return toast.error('Selected IRM not found');

    try {
      const res = await fetch(`https://nijal-backend.onrender.com/api/mapping/history/irm/${id}`);
      const history = await res.json();

      // If it's not an array (some error), fallback to empty array
      const mappedShippingBills = Array.isArray(history) ? history : [];

      setModalData({ ...details, mappedShippingBills });
      setModalVisible(true);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load mapping history');

      // Still show modal with no history
      setModalData({ ...details, mappedShippingBills: [] });
      setModalVisible(true);
    }
  };



  const statusFiltered = filteredData.filter(row => {
    const status = getStatus(row);
    return statusFilter === "All" || status === statusFilter;
  });

  const sortedData = [...statusFiltered].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField] || '';
    const valB = b[sortField] || '';
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const visibleRows = sortedData.slice(startIndex, endIndex);


  const searchOptions = ['Remittance Ref No', 'Bank Name', 'AD Code', 'IE Code'];

  const placeholders = {
    'Remittance Ref No': 'e.g. 0002GRS12345678',
    'Bank Name': 'e.g. IRMI',
    'AD Code': 'e.g. 6390005',
    'IE Code': 'e.g. 1234567890'
  };

  const sortableHeaders = [
    { label: 'Remittance Ref No', key: 'RemittanceRefNo' },
    { label: 'Bank Name', key: 'bankName' },
    { label: 'IE Code', key: 'ieCode' },
    { label: 'Remittance Date', key: 'remittanceDate' },
    { label: 'Remittance Amount', key: 'remittanceAmount' },
    { label: 'Outstanding Amount', key: 'outstandingAmount' },
    { label: 'Remitter Name', key: 'remitterName' },
    { label: 'Status', key: 'status' }
  ];

// At the top of your component (after other useStates)
const [columnsToShow, setColumnsToShow] = useState(sortableHeaders.map(h => h.label));

useEffect(() => {
  const saved = localStorage.getItem('irmSelectedColumns');
  if (saved) {
    const savedColumns = JSON.parse(saved);
    setColumnsToShow(savedColumns);
  } else {
    setColumnsToShow(sortableHeaders.map(h => h.label));
  }
}, []);

  return (
    <div className="pl-12 pr-2 py-10 font-sans">
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
            onChange={(e) => setSearchValue(sanitizeSearchInput(searchField, e.target.value))}
            className="border border-gray-300 rounded-md px-4 py-2 w-64 shadow-sm placeholder-gray-500 text-gray-800"
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

      <div className="flex justify-between items-center mb-5">
  {/* Left: Quick Filters */}
  <div className="flex items-center gap-3">
    <span className="font-semibold text-black">Quick Filters :</span>
    {["All", "Completed", "Partial", "Outstanding"].map((f) => (
      <label
        key={f}
        className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer select-none transition
          ${statusFilter === f ? "bg-blue-50 border-blue-600" : "bg-gray-50 border-gray-300"}`}
      >
        <input
          type="radio"
          name="statusFilter"
          value={f}
          checked={statusFilter === f}
          onChange={() => setStatusFilter(f)}
          className="w-4 h-4 text-blue-600 border-gray-400"
        />
        <span className="text-black">{f}</span>
      </label>
    ))}
  </div>

  {/* Right: Configure + Reset Columns */}
  <div className="flex items-center gap-4">
    <button
      onClick={() => router.push('/irm_columns')}
      className="bg-[#4c94a6] hover:bg-[#417e8e] text-white px-5 py-2 rounded-md shadow font-medium transition-all"
    >
      Configure Columns
    </button>
    <button
      onClick={() => {
        localStorage.removeItem('irmSelectedColumns');
        toast('Columns reset to default!');
        router.refresh(); // Re-render page to reflect default columns
      }}
      className="bg-[#4c94a6] hover:bg-[#417e8e] text-white px-5 py-2 rounded-md shadow font-medium transition-all"
    >
      Reset
    </button>
  </div>
</div>


      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#7bbbc2] font-semibold">
              <th className="px-2 py-3 w-4"></th>
              <th className="px-2 py-3 w-4"></th>
              {columnsToShow.map((label) => {
                const header = sortableHeaders.find(h => h.label === label);
                const key = header?.key || label; // fallback
                return (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-4 py-3 text-left text-black cursor-pointer select-none"
                  >
                    {label}
                    <span className="inline-block w-4 ml-1">
                      {sortField === key ? (sortDirection === 'asc' ? '⬆️' : '⬇️') : '↕'}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
  {visibleRows.map((row) => (
    <React.Fragment key={row._id}>
      <tr
        className={`border-b cursor-pointer 
          ${selectedIRMs.has(row.RemittanceRefNo) 
            ? 'bg-blue-200 hover:bg-blue-300' 
            : 'hover:bg-gray-200'}`}
        onDoubleClick={() => {
          setModalData(row);
          setModalVisible(true);
        }}
        onClick={() => {
          const newSet = new Set(selectedIRMs);
          if (newSet.has(row.RemittanceRefNo)) {
            newSet.clear(); // deselect if already selected
          } else {
            newSet.clear();
            newSet.add(row.RemittanceRefNo);
          }
          setSelectedIRMs(newSet);
        }}
      >
        {/* Radio Selection */}
        <td className="px-2 py-2">
          <input
            type="radio"
            name="irmSelection"
            checked={selectedIRMs.has(row.RemittanceRefNo)}
            onChange={() => {
              const newSet = new Set(selectedIRMs);
              if (newSet.has(row.RemittanceRefNo)) {
                newSet.clear();
              } else {
                newSet.clear();
                newSet.add(row.RemittanceRefNo);
              }
              setSelectedIRMs(newSet);
            }}
          />
        </td>

        {/* Expand/Collapse */}
        <td className="px-2 py-2">
          <button onClick={() => toggleRow(row._id)} className="font-bold text-black">
            {expandedRows.includes(row._id) ? '−' : '+'}
          </button>
        </td>

        {/* Dynamic Columns */}
        {columnsToShow.map((label) => {
          const header = sortableHeaders.find(h => h.label === label);
          const key = header?.key || label;
          let value = row[key];

          // Special formatting
          if (key === 'remittanceDate') value = formatDate(value);

          if (key === 'status') {
            value =
              row.outstandingAmount === 0
                ? 'Completed'
                : row.outstandingAmount > 0 && row.outstandingAmount < row.remittanceAmount
                ? 'Partial Payment'
                : row.outstandingAmount === row.remittanceAmount
                ? 'Outstanding'
                : '-';
          }

          return (
            <td
              key={key}
              className="px-4 py-2 text-black"
              style={{
                ...(key === 'status' && {
                  color:
                    row.outstandingAmount === 0
                      ? 'green'
                      : row.outstandingAmount > 0 && row.outstandingAmount < row.remittanceAmount
                      ? 'darkorange'
                      : row.outstandingAmount === row.remittanceAmount
                      ? 'red'
                      : 'black'
                })
              }}
            >
              {value || '-'}
            </td>
          );
        })}
      </tr>

      {/* Expanded Row */}
      {expandedRows.includes(row._id) && (
        <tr className="bg-gray-50 text-sm">
          <td colSpan={2 + columnsToShow.length}>
            <table className="w-full border-collapse text-left">
              {/* First Row */}
              <thead className="bg-gray-100 font-semibold text-black">
                <tr>
                  {['', 'adCode', 'purposeCode', 'remittanceCurrency', 'utilizedAmount'].map((key, i) => (
                    <th key={i} className="px-4 py-2">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['', 'adCode', 'purposeCode', 'remittanceCurrency', 'utilizedAmount'].map((key, i) => (
                    <td key={i} className="px-4 py-2 text-black">{row[key] || '-'}</td>
                  ))}
                </tr>
              </tbody>

              {/* Second Row */}
              <thead className="bg-gray-100 font-semibold text-black">
                <tr>
                  {['', 'remitterAddress', 'remitterCountryCode', 'remitterBank', 'otherBankRefNumber'].map((key, i) => (
                    <th key={i} className="px-4 py-2">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['', 'remitterAddress', 'remitterCountryCode', 'remitterBank', 'otherBankRefNumber'].map((key, i) => (
                    <td key={i} className="px-4 py-2 text-black">{row[key] || '-'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </React.Fragment>
  ))}
</tbody>

        </table>
      </div>
      
     <div className="flex items-center justify-between mb-3 mt-5">
  {/* Entries dropdown (left) */}
  <div className="flex items-center gap-2">
    <label className="text-black">Show</label>
    <select
      value={entriesToShow}
      onChange={(e) => setEntriesToShow(parseInt(e.target.value))}
      className="border border-gray-300 rounded px-2 py-1 text-black"
    >
      {[5, 10, 25, 50].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
    <label className="text-black">entries</label>
  </div>

  {/* Pagination (right) */}
  <div className="flex items-center gap-1 text-xs">
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
        if (currentPage > 4) pages.push("...");
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (currentPage < totalPages - 3) pages.push("...");
        pages.push(totalPages);
      }

      return pages.map((p, i) => (
        <button
          key={i}
          onClick={() => typeof p === "number" && setCurrentPage(p)}
          disabled={p === "..."}
          className={`px-2 py-[2px] border rounded ${
            p === currentPage
              ? "border-black font-semibold text-black"
              : "border-gray-400 text-gray-800"
          } ${p === "..." ? "pointer-events-none opacity-60" : ""}`}
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
              {Object.entries(modalData).map(([label, value], i) => {
                if (typeof value === 'object' && value !== null) {
                  return null; // or handle separately if needed
                }

                return (
                  <div key={i}>
                    <div className="font-semibold text-[#1f2937]">{label}</div>
                    <div className="text-gray-800">{value || '-'}</div>
                  </div>
                );
              })}


                <div className="px-8 pb-10 col-span-full">
                  <h3 className="text-xl font-semibold text-[#1f2937] mt-10 mb-4">Mapped Shipping Bills</h3>
                  <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
                    <table className="w-full text-sm text-gray-800 border-collapse">
                      <thead>
                        <tr className="bg-[#72c1c7] text-black font-semibold">
                          <th className="px-4 py-3 text-left">Shipping Bill</th>
                          <th className="px-4 py-3 text-left">Form No</th>
                          <th className="px-4 py-3 text-left">SB Date</th>
                          <th className="px-4 py-3 text-left">Port Code</th>
                          <th className="px-4 py-3 text-left">Bank Name</th>
                          <th className="px-4 py-3 text-left">FOB Currency</th>
                          <th className="px-4 py-3 text-left">Export Bill Value</th>
                          <th className="px-4 py-3 text-left">Outstanding</th>
                          <th className="px-4 py-3 text-left">Buyer Name</th>
                          <th className="px-4 py-3 text-left">Buyer Country</th>
                          <th className="px-4 py-3 text-left">Utilized</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalData.mappedShippingBills && modalData.mappedShippingBills.length > 0 ? (
                          modalData.mappedShippingBills.map((sb, i) => (
                            <tr key={i} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-2">{sb.shippingBillNo}</td>
                              <td className="px-4 py-2">{sb.formNo}</td>
                              <td className="px-4 py-2">{sb.shippingBillDate}</td>
                              <td className="px-4 py-2">{sb.portCode}</td>
                              <td className="px-4 py-2">{sb.bankName}</td>
                              <td className="px-4 py-2">{sb.fobCurrency}</td>
                              <td className="px-4 py-2">{sb.exportBillValue}</td>
                              <td className="px-4 py-2">{sb.billOutstandingValue || sb.outstandingValue}</td>
                              <td className="px-4 py-2">{sb.buyerName}</td>
                              <td className="px-4 py-2">{sb.buyerCountryCode}</td>
                              <td className="px-4 py-2">{sb.sbUtilizationAmount}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-4 text-center text-gray-500 italic" colSpan={11}>
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
        </div>
      )}
    </div>
  );
}
