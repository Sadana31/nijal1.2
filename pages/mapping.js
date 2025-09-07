'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

export default function MappingPage() {
  const router = useRouter();
  const { mode } = router.query;

  const [selectedSB, setSelectedSB] = useState(null);
  const [irmData, setIrmData] = useState([]);
  const [sbData, setSbData] = useState([]);
  const [expandedIRMRows, setExpandedIRMRows] = useState([]);
  const [expandedSBRows, setExpandedSBRows] = useState([]);
  const [selectedIRMs, setSelectedIRMs] = useState(new Set());
  const [selectedSBs, setSelectedSBs] = useState(new Set());
  const [utilization, setUtilization] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [selectedIRM, setSelectedIRM] = useState(null);
  const [showIRMDetails, setShowIRMDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10); // you can change number of rows per page
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const [sbUtilizationAmount, setSbUtilizationAmount] = useState(
    selectedSB?.billOutstandingValue || 0
  );
const [irmUtilizationAmount, setIrmUtilizationAmount] = useState(
  selectedIRM?.outstandingAmount || 0
);

let mapped,balance;

if (mode === 'irmToSb') {
  // Mapping IRM → SB
  const selectedSBUtilization = Array.from(selectedSBs).reduce(
    (sum, sbNo) => sum + (parseFloat(utilization[sbNo]) || 0),
    0
  );

  mapped = selectedSBUtilization; // sum of all selected SB utilization
  balance = (irmUtilizationAmount || 0) - mapped; // IRM entered minus sum of selected SBs
} else {
  // Mapping SB → IRM
  const selectedIRMUtilization = Array.from(selectedIRMs).reduce(
    (sum, irmNo) => sum + (parseFloat(utilization[irmNo]) || 0),
    0
  );

  mapped = selectedIRMUtilization; // sum of all selected IRMs
  balance = (sbUtilizationAmount || 0) - mapped;
}




  useEffect(() => {
    const storedIRM = sessionStorage.getItem("selectedRow");
    if (storedIRM) {
      const rawIRM = JSON.parse(storedIRM);
      const normalizedIRM = {
        ...rawIRM,
        RemittanceRefNumber: rawIRM.RemittanceRefNumber || rawIRM.RemittanceRefNo,
        bankName: rawIRM.bankName || rawIRM.bankName,
        ieCode: rawIRM.ieCode || rawIRM.ieCode,
        remittanceDate: rawIRM.remittanceDate || rawIRM.remittanceDate,
        purposeCode: rawIRM.purposeCode || rawIRM.purposeCode,
        remittanceCurrency: rawIRM.remittanceCurrency || rawIRM.remittanceCurrency,
        remittanceAmount: rawIRM.remittanceAmount || rawIRM.remittanceAmount,
        outstandingAmount: rawIRM.outstandingAmount || rawIRM.outstandingAmount,
        remitterName: rawIRM.remitterName || rawIRM.remitterName,
        remitterAddress: rawIRM.remitterAddress || rawIRM.remitterAddress,
        remitterCountryCode: rawIRM.remitterCountryCode || rawIRM.remitterCountryCode,
        remitterBank: rawIRM.remitterBank || rawIRM.remitterBank,
        otherBankRefNumber: rawIRM.otherBankRefNumber || rawIRM.otherBankRef,
        Status: rawIRM.Status || rawIRM.status,
        remittanceType: rawIRM.remittanceType || rawIRM.remittanceType,
        utilizedAmount: rawIRM.utilizedAmount || rawIRM.utilizedAmount,
        adCode: rawIRM.adCode || rawIRM.adCode,
      };
      setSelectedIRM(normalizedIRM);
    }
  }, []);

  useEffect(() => {
    const row = sessionStorage.getItem('selectedRow');
    if (row) {
      const sb = JSON.parse(row);
      setSelectedSB(sb);
      setSelectedSBs(new Set()); // reset previously selected SBs
    } else toast.error('No Shipping Bill selected');
  }, []);


  useEffect(() => {
  if (!router.isReady) return;

  if (mode === 'irmToSb') {
    fetch('https://nijal-backend.onrender.com/api/sb')
      .then(res => res.json())
      .then(data => {
        const normalized = data.map(row => ({
          ...row,
          shippingBillNo: row.shippingBillNo || row.ShippingBill,
          formNo: row.formNo || row.formNo,
          shippingBillDate: row.shippingBillDate || row.shippingBillDate,
          portCode: row.portCode || row.portCode,
          bankName: row.bankName || row.bankName,
          invoiceCount: row.invoiceCount || row.InvoiceCount,
          fobCurrency: row.fobCurrency || row.fobCurrency,
          exportBillValue: row.exportBillValue || row.exportBillValue,
          billOutstandingValue: row.billOutstandingValue || row.billOutstandingValue,
          buyerName: row.buyerName || row.buyerName,
          buyerCountryCode: row.buyerCountryCode || row.buyerCountryCode,
          ieCode: row.ieCode || row.ieCode,
          invoiceDate: row.invoiceDate || row.invoiceDate,
          realizedValue: row.realizedValue || row.RealizedValue,
          buyerAddress: row.buyerAddress || row.buyerAddress,
          consigneeCountryCode: row.consigneeCountryCode || row.consigneeCountryCode,
          portOfDestination: row.portOfDestination || row.portOfDestination,
          shippingCompany: row.shippingCompany || row.shippingCompany,
          vesselName: row.vesselName || row.vesselName,
          blDate: row.blDate || row.blDate,
          commercialInvoice: row.commercialInvoice || row.commercialInvoice,
          tradeTerms: row.tradeTerms || row.TradeTerms,
          commodity: row.commodity || row.commodity
        }));
        setSbData(normalized);
      })
      .catch(() => toast.error('Failed to fetch SB data'));
  } else {
    fetch('https://nijal-backend.onrender.com/api/irm')
      .then(res => res.json())
      .then(data => {
        const normalized = data.map(row => ({
          ...row,
          RemittanceRefNumber: row.RemittanceRefNumber || row.RemittanceRefNo,
          bankName: row.bankName || row.bankName,
          ieCode: row.ieCode || row.ieCode,
          remittanceDate: row.remittanceDate || row.remittanceDate,
          purposeCode: row.purposeCode || row.purposeCode,
          remittanceCurrency: row.remittanceCurrency || row.remittanceCurrency,
          remittanceAmount: row.remittanceAmount || row.remittanceAmount,
          outstandingAmount: row.outstandingAmount || row.outstandingAmount,
          remitterName: row.remitterName || row.remitterName,
          remitterAddress: row.remitterAddress || row.remitterAddress,
          remitterCountryCode: row.remitterCountryCode || row.remitterCountryCode,
          remitterBank: row.remitterBank || row.remitterBank,
          otherBankRefNumber: row.otherBankRefNumber || row.otherBankRef,
          Status: row.Status || row.status,
          remittanceType: row.remittanceType || row.remittanceType,
          utilizedAmount: row.utilizedAmount || row.utilizedAmount,
          adCode: row.adCode || row.adCode,
        }));
        setIrmData(normalized);
      })
      .catch(() => toast.error('Failed to fetch IRM data'));
  }
}, [mode, router.isReady]);


  const toggleIRMRow = (id) => {
    setExpandedIRMRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSBRow = (id) => {
    setExpandedSBRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };






const handleSubmitMappingIRMToSB = async () => {
  const selected = Array.from(selectedSBs); // multiple SBs
  if (selected.length === 0) return toast.error("Select at least one Shipping Bill");

  const totalUtilization = selected.reduce(
    (sum, sbNo) => sum + parseFloat(utilization[sbNo] || 0), 0
  );

  const irmOutstanding = parseFloat(selectedIRM?.outstandingAmount) || 0;
  console.log("selectedIRM?.outstandingAmount =", selectedIRM?.outstandingAmount);



  if (totalUtilization !== irmOutstanding) {
    toast.error(`Utilization total (${totalUtilization}) does not match IRM outstanding (${irmOutstanding})`);
    return;
  }


  const payload = {
    remittanceRefNumber: selectedIRM?.RemittanceRefNumber,
    utilization: selected.map(sbNo => ({
      shippingBillNo: sbNo,
      amount: parseFloat(utilization[sbNo] || 0),
    })),
  };

  try {
    const res = await fetch('https://nijal-backend.onrender.com/api/mapping/irmToSB', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("IRM mapped to Shipping Bills");
      router.push('/');
    } else {
      toast.error(data.message || 'Mapping failed');
    }
  } catch (err) {
    toast.error('Mapping failed');
  }
};


  const handleSubmitMappingSBToIRM = async () => {
    const selected = Array.from(selectedIRMs);
    if (selected.length === 0) return toast.error("Select at least one IRM");
    if (!selectedSB?.shippingBillNo) return toast.error("No valid Shipping Bill selected");

    const totalUtilization = selected.reduce(
      (sum, irmNo) => sum + parseFloat(utilization[irmNo] || 0),
      0
    );

    const sbOutstanding = parseFloat(selectedSB?.billOutstandingValue || 0);
    if (totalUtilization !== sbOutstanding)
      return toast.error(`Utilization total (${totalUtilization}) does not match SB outstanding (${sbOutstanding})`);

    const payload = {
      shippingBillData: {
        ...selectedSB,
        outstandingValue: selectedSB.billOutstandingValue  // map to expected backend key
      },
      selectedIRMData: selected.map(irmNo => {
        const irm = irmData.find(i => i.RemittanceRefNumber === irmNo);
        const amt = parseFloat(utilization[irmNo]);
        if (!irm || isNaN(amt) || amt <= 0) {
          throw new Error(`Invalid or missing data for IRM ${irmNo}`);
        }

        return {
          remittanceRefNumber: irm.RemittanceRefNumber,
          adCode: irm.adCode,
          bankName: irm.bankName,
          ieCode: irm.ieCode,
          remittanceDate: irm.remittanceDate,
          purposeCode: irm.purposeCode,
          remittanceCurrency: irm.remittanceCurrency,
          remittanceAmount: irm.remittanceAmount,
          utilizedAmount: irm.utilizedAmount,
          outstandingAmount: irm.outstandingAmount,
          irmUtilizationAmount: amt
        };
      })
    };



    console.log("Sending payload:", payload);

    try {
      const res = await fetch('https://nijal-backend.onrender.com/api/mapping/sbToIRM', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Shipping Bill mapped to IRMs");
        router.push('/');
      } else {
        toast.error(data.message || 'Mapping failed');
      }
    } catch (err) {
      toast.error(err.message || 'Mapping failed');
    }

};



useEffect(() => {
  if (selectedIRM) setIrmUtilizationAmount(parseFloat(selectedIRM.outstandingAmount) || 0);
}, [selectedIRM]);

useEffect(() => {
  if (selectedSB) setSbUtilizationAmount(parseFloat(selectedSB.billOutstandingValue) || 0);
}, [selectedSB]);



  const visibleRows = mode === 'irmToSb' ? sbData : irmData;
  const currentRows = visibleRows.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(visibleRows.length / rowsPerPage);

  return (
    <div className="p-6 text-[13px] text-black">
      {mode === 'irmToSb' ? (
        <div id="irmToSbUI">
  <div className="p-6 text-[13px] text-black" style={{ marginLeft: '30px' }}>
    {selectedIRM && (
      <div className="mb-6 p-4 border border-gray-300 rounded-xl shadow-sm overflow-hidden bg-white">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Selected IRM</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-[#6cbcbf] text-white">
            <tr>
              <th className="px-3 py-2 w-[40px]"></th>
              <th className="px-3 py-2">Remittance Ref No</th>
              <th className="px-3 py-2">Bank Name</th>
              <th className="px-3 py-2">IE Code</th>
              <th className="px-3 py-2">Remittance Date</th>
              <th className="px-3 py-2">Remitter Name</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Remittance Amount</th>
              <th className="px-3 py-2">Outstanding Amount</th>
              <th className="px-3 py-2">Utilization Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-3 py-2">
                <button onClick={() => setShowIRMDetails(prev => !prev)} className="text-lg font-bold">
                  {showIRMDetails ? '−' : '+'}
                </button>
              </td>
              <td className="px-3 py-2">{selectedIRM.RemittanceRefNumber}</td>
              <td className="px-3 py-2">{selectedIRM.bankName}</td>
              <td className="px-3 py-2">{selectedIRM.ieCode}</td>
              <td className="px-3 py-2">{selectedIRM.remittanceDate}</td>
              <td className="px-3 py-2">{selectedIRM.remitterName}</td>
              <td className="px-3 py-2">{selectedIRM.Status}</td>
              <td className="px-3 py-2">{selectedIRM.remittanceAmount}</td>
              <td className="px-3 py-2">{selectedIRM.outstandingAmount}</td>
              <td className='px-3 py-2'><input
                  type="number"
                  className="border border-gray-300 rounded px-2 py-1 w-24 text-black"
                  value={irmUtilizationAmount}
                  onChange={(e) => setIrmUtilizationAmount(parseFloat(e.target.value) || 0)}
                />
                </td>
            </tr>
            {showIRMDetails && (
              <tr className="bg-gray-50 text-sm">
                <td colSpan={9}>
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-gray-100 font-semibold text-black">
                      <tr>
                        {["adCode", "purposeCode", "remittanceCurrency", "utilizedAmount"].map((key, i) => (
                          <th key={i} className="px-4 py-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {["adCode", "purposeCode", "remittanceCurrency", "utilizedAmount"].map((key, i) => (
                          <td key={i} className="px-4 py-2 text-black">{selectedIRM[key] || '-'}</td>
                        ))}
                      </tr>
                    </tbody>
                    <thead className="bg-gray-100 font-semibold text-black">
                      <tr>
                        {["remitterAddress", "remitterCountryCode", "remitterBank", "otherBankRefNumber"].map((key, i) => (
                          <th key={i} className="px-4 py-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {["remitterAddress", "remitterCountryCode", "remitterBank", "otherBankRefNumber"].map((key, i) => (
                          <td key={i} className="px-4 py-2 text-black">{selectedIRM[key] || '-'}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    <div className="mt-1 mb-5 inline-flex border rounded overflow-hidden">
  {/* IRM Mapping Available */}
  <div className="flex">
    <div className="bg-blue-100 text-black px-4 py-2 border-r border-gray-300 text-xl">
      IRM Mapping Available
    </div>
    <div className="bg-white text-black font-bold text-xl px-4 py-2 border-r border-gray-300">
      {irmUtilizationAmount}
    </div>
  </div>

  {/* Mapped (sum of selected SB utilization) */}
  <div className="flex">
    <div className="bg-blue-100 text-black text-xl px-4 py-2 border-r border-gray-300">
      Mapped
    </div>
    <div className="bg-white text-black font-bold text-xl px-4 py-2 border-r border-gray-300">
      {mapped}
    </div>
  </div>

  {/* Balance (IRM - Mapped) */}
  <div className="flex">
    <div className="bg-blue-100 text-black text-xl px-4 py-2 border-r border-gray-300">
      Balance
    </div>
    <div className="bg-white text-black font-bold text-xl px-4 py-2">
      {balance}
    </div>
  </div>
</div>


    
    {sbData.length > 0 && (
      <div className="p-4 border border-gray-300 rounded-xl shadow-sm overflow-hidden bg-white">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Select Shipping Bills to map</h2>
        <table className="w-full text-sm text-left">
          <thead className="bg-[#6cbcbf] text-white">
            <tr>
              <th className="px-3 py-2 w-[30px]">
                <input type="checkbox" />
              </th>
              <th className="px-3 py-2 w-[30px]"></th> {/* ← expander column */}
              <th className="px-3 py-2">Shipping Bill</th>
              <th className="px-3 py-2">Form No</th>
              <th className="px-3 py-2">Shipping Bill Date</th>
              <th className="px-3 py-2">Port Code</th>
              <th className="px-3 py-2">Bank Name</th>
              <th className="px-3 py-2">Invoice Count</th>
              <th className="px-3 py-2">FOB Currency</th>
              <th className="px-3 py-2">Export Bill Value</th>
              <th className="px-3 py-2">Utilization Amount</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((sb, i) => (
  <React.Fragment key={i}>
    <tr className="border-b">
      <td className="px-3 py-2 text-black">
        <input
          type="checkbox"
          checked={selectedSBs.has(sb.shippingBillNo)}
          onChange={(e) => {
            const newSet = new Set(selectedSBs);
            if (e.target.checked) newSet.add(sb.shippingBillNo);
            else newSet.delete(sb.shippingBillNo);
            setSelectedSBs(newSet);
          }}
        />
      </td>
      <td className="px-3 py-2 text-black">
        <button
          onClick={() => toggleSBRow(sb.shippingBillNo)}
          className="font-bold text-black"
        >
          {expandedSBRows.includes(sb.shippingBillNo) ? '−' : '+'}
        </button>
      </td>
      <td className="px-3 py-2 text-black">{sb.shippingBillNo}</td>

      <td className="px-3 py-2 text-black">{sb.formNo}</td>
      <td className="px-3 py-2 text-black">{sb.shippingBillDate}</td>
      <td className="px-3 py-2 text-black">{sb.portCode}</td>
      <td className="px-3 py-2 text-black">{sb.bankName}</td>
      <td className="px-3 py-2 text-black">{sb.invoiceCount}</td>
      <td className="px-3 py-2 text-black">{sb.fobCurrency}</td>
      <td className="px-3 py-2 text-black">{sb.exportBillValue}</td>
      <td className="px-3 py-2 text-black">
        <input
          type="number"
          className="border border-gray-300 rounded px-2 py-1 w-24 text-black"
          value={utilization[sb.shippingBillNo] || ''}
          onChange={(e) => {
            const value = e.target.value;
            setUtilization(prev => ({
              ...prev,
              [sb.shippingBillNo]: isNaN(parseFloat(value)) ? 0 : parseFloat(value),
            }));
          }}
        />
      </td>
    </tr>

    {/* Expanded row content */}
    {expandedSBRows.includes(sb.shippingBillNo) && (
      <tr className="bg-gray-50 text-sm">
        <td colSpan={11}>
          <table className="w-full border-collapse text-left">
            <thead className="bg-gray-100 font-semibold text-black">
              <tr>
                {["","ieCode", "invoiceDate", "RealizedValue", "buyerAddress", "consigneeCountryCode"].map((key, i) => (
                  <th key={i} className="px-4 py-2">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {["","ieCode", "invoiceDate", "realizedValue", "buyerAddress", "consigneeCountryCode"].map((key, i) => (
                  <td key={i} className="px-4 py-2 text-black">{sb[key] || '-'}</td>
                ))}
              </tr>
            </tbody>

            <thead className="bg-gray-100 font-semibold text-black">
              <tr>
                {["","portOfDestination", "shippingCompany", "vesselName", "blDate", "TradeTerms", "commodity"].map((key, i) => (
                  <th key={i} className="px-4 py-2">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {["","portOfDestination", "shippingCompany", "vesselName", "blDate", "tradeTerms", "commodity"].map((key, i) => (
                  <td key={i} className="px-4 py-2 text-black">{sb[key] || '-'}</td>
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
    )}

    <div className="flex justify-end mt-2 items-center gap-2">
      <button
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
      >
        Prev
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          onClick={() => setCurrentPage(num)}
          className={`px-3 py-1 border rounded ${currentPage === num ? 'border-black font-bold' : 'bg-white hover:bg-gray-100'}`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
      >
        Next
      </button>
    </div>



<div className="mt-4">
        <button
          onClick={handleSubmitMappingIRMToSB}
          style={{
            backgroundColor: '#2a9d8f',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            fontWeight: 600,
            borderRadius: '6px',
            fontSize: '17px',
          }}
        >
          Map Selected SBs
        </button>
      </div>
    
  </div>
</div>



      ) : (
        <div id="sbToIrmUI">
          <div className="p-6 text-[13px] text-black" style={{marginLeft:'30px'}}>
      {selectedSB && (
        <div className="mb-6 p-4 border border-gray-300 rounded-xl shadow-sm overflow-hidden bg-white">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Selected Shipping Bill</h2>
          <table className="w-full text-sm text-left">
            <thead className="bg-[#6cbcbf] text-white">
              <tr>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2">Shipping Bill</th>
                <th className="px-3 py-2">Form No</th>
                <th className="px-3 py-2">Shipping Bill Date</th>
                <th className="px-3 py-2">Port Code</th>
                <th className="px-3 py-2">Bank Name</th>
                <th className="px-3 py-2">Invoice Count</th>
                <th className="px-3 py-2">Buyer Name</th>
                <th className="px-3 py-2">Buyer Country Code</th>
                <th className="px-3 py-2">FOB Currency</th>
                <th className="px-3 py-2">Export Bill Value</th>
                <th className="px-3 py-2">Bill Outstanding Value</th>
                <th className="px-3 py-2">Utilization Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2">
                  <button
                    onClick={() => setShowDetails(prev => !prev)}
                    className="text-lg font-bold"
                  >
                    {showDetails ? '-' : '+'}
                  </button>
                </td>
                <td className="px-3 py-2">{selectedSB.shippingBillNo}</td>
                <td className="px-3 py-2">{selectedSB.formNo}</td>
                <td className="px-3 py-2">{selectedSB.shippingBillDate}</td>
                <td className="px-3 py-2">{selectedSB.portCode}</td>
                <td className="px-3 py-2">{selectedSB.bankName}</td>
                <td className="px-3 py-2">{selectedSB.invoiceCount}</td>
                <td className="px-3 py-2">{selectedSB.buyerName}</td>
                <td className="px-3 py-2">{selectedSB.buyerCountryCode}</td>
                <td className="px-3 py-2">{selectedSB.fobCurrency}</td>
                <td className="px-3 py-2">{selectedSB.exportBillValue}</td>
                <td className="px-3 py-2">{selectedSB.billOutstandingValue}</td>
                <td className='px-3 py-2'><input
                  type="number"
                  className="border border-gray-300 rounded px-2 py-1 w-24 text-black"
                  value={sbUtilizationAmount}
                  onChange={(e) => setSbUtilizationAmount(parseFloat(e.target.value) || 0)}
                />
                </td>
              </tr>
              {showDetails && (
                <tr className="bg-gray-50 text-sm">
                  <td colSpan={14}>
                    <table className="w-full border-collapse text-left">
                      <tbody>
                        <tr className="bg-gray-100 font-semibold">
                          <td className="px-4 py-2"> </td>
                          <td className="px-4 py-2">IE Code</td>
                          <td className="px-4 py-2">Invoice Date</td>
                          <td className="px-4 py-2">Realized Value</td>
                          <td className="px-4 py-2">Buyer Address</td>
                          <td className="px-4 py-2">Consignee Country Code</td>
                          <td className="px-4 py-2">Port of Destination</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2"> </td>
                          <td className="px-4 py-2">{selectedSB.ieCode || '123456789'}</td>
                          <td className="px-4 py-2">{selectedSB.invoiceDate || '05-05-2024'}</td>
                          <td className="px-4 py-2">{selectedSB.realizedValue || '$4,000.00'}</td>
                          <td className="px-4 py-2">{selectedSB.buyerAddress || 'Test Address'}</td>
                          <td className="px-4 py-2">{selectedSB.consigneeCountryCode || 'IN'}</td>
                          <td className="px-4 py-2">{selectedSB.portOfDestination || 'US'}</td>
                        </tr>
                        <tr className="bg-gray-100 font-semibold">
                          <td className="py-2"> </td>
                          <td className="px-4 py-2">Shipping Company</td>
                          <td className="px-4 py-2">Vessel Name</td>
                          <td className="px-4 py-2">BL Date</td>
                          <td className="px-4 py-2">Commercial Invoice</td>
                          <td className="px-4 py-2">Trade Terms</td>
                          <td className="px-4 py-2">commodity</td>
                        </tr>
                        <tr>
                          <td className="py-2"> </td>
                          <td className="px-4 py-2">{selectedSB.shippingCompany || 'Maersk'}</td>
                          <td className="px-4 py-2">{selectedSB.vesselName || 'Vessel 55555'}</td>
                          <td className="px-4 py-2">{selectedSB.blDate || '06-05-2024'}</td>
                          <td className="px-4 py-2">{selectedSB.commercialInvoice || '21127240024'}</td>
                          <td className="px-4 py-2">{selectedSB.tradeTerms || '-'}</td>
                          <td className="px-4 py-2">{selectedSB.commodity || 'Heavy metal goods'}</td>
                        </tr>
                        </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}


<div className="mt-1 mb-5 inline-flex border rounded overflow-hidden">
  {/* IRM Mapping Available */}
  <div className="flex">
    <div className="bg-blue-100 text-black  px-4 py-2 border-r border-gray-300 text-xl">
      IRM Mapping Available
    </div>
    <div className="bg-white text-black font-bold text-xl px-4 py-2 border-r border-gray-300">
      {sbUtilizationAmount}
    </div>
  </div>

  {/* Mapped */}
  <div className="flex">
    <div className="bg-blue-100 text-black text-xl px-4 py-2 border-r border-gray-300">
      Mapped
    </div>
    <div className="bg-white text-black font-bold text-xl px-4 py-2 border-r border-gray-300">
      {mapped}
    </div>
  </div>

  {/* Balance */}
  <div className="flex">
    <div className="bg-blue-100 text-black text-xl px-4 py-2 border-r border-gray-300">
      Balance
    </div>
    <div className="bg-white text-black font-bold text-xl px-4 py-2">
      {balance}
    </div>
  </div>
</div>


      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#7bbbc2] font-semibold">
              <th className="px-2 py-3 w-4"><input type="checkbox" /></th>
              <th className="px-2 py-3 w-4 text-black"></th>
              {["RemittanceRefNumber", "bankName", "ieCode", "remittanceDate", "remittanceAmount", "outstandingAmount", "remitterName", "Status"].map((head, i) => (
                <th key={i} className="px-4 py-3 text-left text-black">{head}</th>
              ))}
              <th className="px-4 py-3 text-left text-black">Utilization Amount</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row) => (
              <React.Fragment key={row._id}>
                <tr className="border-b">
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
                    <button onClick={() => toggleIRMRow(row._id)} className="font-bold text-black">
                      {expandedIRMRows.includes(row._id) ? '−' : '+'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-black">{row.RemittanceRefNumber}</td>
                  <td className="px-4 py-2 text-black">{row.bankName}</td>
                  <td className="px-4 py-2 text-black">{row.ieCode}</td>
                  <td className="px-4 py-2 text-black">{row.remittanceDate}</td>
                  <td className="px-4 py-2 text-black">{row.remittanceAmount}</td>
                  <td className="px-4 py-2 text-black">{row.outstandingAmount}</td>
                  <td className="px-4 py-2 text-black">{row.remitterName}</td>
                  <td className="px-4 py-2 text-black">{row.Status}</td>
                  <td className="px-4 py-2 text-black">
                    <input
                      className="w-24 h-[24px] border border-black text-black px-1 text-sm"
                      value={utilization[row.RemittanceRefNumber] || ''}
                      onChange={(e) =>
                        setUtilization({
                          ...utilization,
                          [row.RemittanceRefNumber]: e.target.value,
                        })
                      }
                    />
                  </td>
                </tr>
                {expandedIRMRows.includes(row._id) && (
                  <tr className="bg-gray-50 text-sm">
                    <td colSpan={12}>
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-gray-100 font-semibold text-black">
                          <tr>
                            {[" ", "adCode", "purposeCode", "remittanceCurrency", "utilizedAmount"].map((key, i) => (
                              <th key={i} className="px-4 py-2">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {[" ", "adCode", "purposeCode", "remittanceCurrency", "utilizedAmount"].map((key, i) => (
                              <td key={i} className="px-4 py-2 text-black">{row[key] || '-'}</td>
                            ))}
                          </tr>
                        </tbody>

                        <thead className="bg-gray-100 font-semibold text-black">
                          <tr>
                            {[" ", "remitterAddress", "remitterCountryCode", "remitterBank", "otherBankRefNumber"].map((key, i) => (
                              <th key={i} className="px-4 py-2">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {[" ", "remitterAddress", "remitterCountryCode", "remitterBank", "otherBankRefNumber"].map((key, i) => (
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

      <div className="flex justify-end mt-2 items-center gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 border rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
        >
          Prev
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setCurrentPage(num)}
            className={`px-3 py-1 border rounded ${currentPage === num ? 'border-black font-bold' : 'bg-white hover:bg-gray-100'}`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
        >
          Next
        </button>
      </div>



      <div className="mt-4">
        <button
          onClick={handleSubmitMappingSBToIRM}
          style={{
            backgroundColor: '#2a9d8f',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            fontWeight: 600,
            borderRadius: '6px',
            fontSize: '17px',
          }}
        >
          Map Selected IRMs
        </button>
      </div>
</div>
        </div>
      )}
    </div>

  );
}
