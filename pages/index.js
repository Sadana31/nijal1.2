  'use client';

  import { useEffect, useState } from 'react';
  import { useRef } from 'react';
  import { useRouter } from 'next/router';
  import {toast} from 'sonner';
  
  export default function SBPage() {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchField, setSearchField] = useState('Shipping Bill');
    const [searchValue, setSearchValue] = useState('');
    const [expandedRows, setExpandedRows] = useState([]);
    const [entriesToShow, setEntriesToShow] = useState(10);
    const [selectedSBs, setSelectedSBs] = useState(new Set());
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);

    const router = useRouter();

      const handleClick = (text) => {
        if (text === 'Add Shipping Bill') {
          router.push('/add_sb');
        } else if (text === 'Export File') {
          exportToCSV();
        } else if (text === 'Details') {
          showSelectedDetails();
        } else if (text === 'Modify SB') {
          if (selectedSBs.size !== 1) {
            toast.error("Please select exactly one Shipping Bill to modify.");
            return;
          }

          const selectedSBNo = [...selectedSBs][0];
          const selectedRow = data.find((row) => row.shippingBillNo === selectedSBNo);

          if (!selectedRow) {
            toast.error("Selected Shipping Bill not found.");
            return;
          }

          router.push(`/modify_sb?id=${selectedRow._id}`);
        }
        else if (text == 'Bulk Shipping Bill Upload'){
          router.push('/bulk_sb');
        }
      };


    useEffect(() => {
      fetch('http://localhost:5000/api/sb')
        .then((res) => res.json())
        .then((result) => {
          setData(result);
          setFilteredData(result);
        })
        .catch((err) => console.error('Failed to fetch:', err));
    }, []);

    useEffect(() => {
      handleSearch();
    }, [searchValue, searchField]);



    const toggleRow = (id) => {
      setExpandedRows((prev) =>
        prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
      );
    };

    const handleSearch = () => {
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
    };

    const placeholders = {
      'Shipping Bill': 'e.g. 123456',
      'Form No': 'e.g. A1B2C3',
      'Port Code': 'e.g. INMAA',
      'Bank Name': 'e.g. SBI'
    };

    const showSelectedDetails = () => {
      if (selectedSBs.size !== 1) {
        alert("Please select exactly one Shipping Bill to view details.");
        return;
      }

      const selectedSBNo = [...selectedSBs][0];
      const details = data.find((row) => row.shippingBillNo === selectedSBNo);
      setModalData(details);
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


    const visibleRows = filteredData.slice(0, entriesToShow);

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
              onChange={(e) => setSearchValue(e.target.value)}
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
            onChange={(e) => setEntriesToShow(parseInt(e.target.value))}
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
                <th className="px-3 py-3 w-4"><input
  type="checkbox"/></th>
                <th className="px-3 py-3 w-4"></th>
                {["Shipping Bill", "Form No", "Shipping Bill Date", "Port Code", "Bank Name", "Invoice Count", "FOB Currency", "Export Bill Value", "Bill Outstanding Value", "Buyer Name", "Buyer Country Code"].map((header, idx) => (
                  <th key={idx} className="px-4 py-3 text-left">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {visibleRows.map((row) => (
                <>
                  <tr key={row._id} className="border-b">
                    <td className="px-3 py-2"><input
  type="checkbox"
  checked={selectedSBs.has(row.shippingBillNo)}
  onChange={(e) => {
    const newSet = new Set(selectedSBs);
    if (e.target.checked) {
      newSet.add(row.shippingBillNo);
    } else {
      newSet.delete(row.shippingBillNo);
    }
    setSelectedSBs(newSet);
  }}
/></td>
                    <td className="px-3 py-2">
                      <button onClick={() => toggleRow(row._id)} className="font-bold text-lg">
                        {expandedRows.includes(row._id) ? '−' : '+'}
                      </button>
                    </td>
                    <td className="px-4 py-2">{row.shippingBillNo}</td>
                    <td className="px-4 py-2">{row.formNo}</td>
                    <td className="px-4 py-2">{row.shippingBillDate}</td>
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
    </div>
  </div>
)}



      </div>
    );
  }
