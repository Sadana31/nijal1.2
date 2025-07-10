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

  useEffect(() => {
    const storedIRM = sessionStorage.getItem("selectedRow");
    if (storedIRM) {
      setSelectedIRM(JSON.parse(storedIRM));
    }
  }, []);

  useEffect(() => {
    const row = sessionStorage.getItem('selectedRow');
    if (row) setSelectedSB(JSON.parse(row));
    else toast.error('No Shipping Bill selected');
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
          formNo: row.formNo || row.FormNo,
          shippingBillDate: row.shippingBillDate || row.ShippingBillDate,
          portCode: row.portCode || row.PortCode,
          bankName: row.bankName || row.BankName,
          invoiceCount: row.invoiceCount || row.InvoiceCount,
          fobCurrency: row.fobCurrency || row.FOBCurrency,
          exportBillValue: row.exportBillValue || row.ExportBillValue,
          billOutstandingValue: row.billOutstandingValue || row.BillOutstandingValue,
          buyerName: row.buyerName || row.BuyerName,
          buyerCountryCode: row.buyerCountryCode || row.BuyerCountryCode,
          ieCode: row.ieCode || row.IECode,
          invoiceDate: row.invoiceDate || row.InvoiceDate,
          realizedValue: row.realizedValue || row.RealizedValue,
          buyerAddress: row.buyerAddress || row.BuyerAddress,
          consigneeCountryCode: row.consigneeCountryCode || row.ConsigneeCountryCode,
          portOfDestination: row.portOfDestination || row.PortOfDestination,
          shippingCompany: row.shippingCompany || row.ShippingCompany,
          vesselName: row.vesselName || row.VesselName,
          blDate: row.blDate || row.BLDate,
          commercialInvoice: row.commercialInvoice || row.CommercialInvoice,
          tradeTerms: row.tradeTerms || row.TradeTerms,
          commodity: row.commodity || row.Commodity
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
          RemittanceRefNumber: row.RemittanceRefNumber || row.remittanceRefNo,
          BankName: row.BankName || row.bankName,
          IECode: row.IECode || row.ieCode,
          RemittanceDate: row.RemittanceDate || row.remittanceDate,
          PurposeCode: row.PurposeCode || row.purposeCode,
          RemittanceCurrency: row.RemittanceCurrency || row.remittanceCurrency,
          RemittanceAmount: row.RemittanceAmount || row.remittanceAmount,
          OutstandingAmount: row.OutstandingAmount || row.outstandingAmount,
          RemitterName: row.RemitterName || row.remitterName,
          RemitterAddress: row.RemitterAddress || row.remitterAddress,
          RemitterCountryCode: row.RemitterCountryCode || row.remitterCountryCode,
          RemitterBank: row.RemitterBank || row.remitterBank,
          OtherBankRefNumber: row.OtherBankRefNumber || row.otherBankRef,
          Status: row.Status || row.status,
          RemittanceType: row.RemittanceType || row.remittanceType,
          UtilizedAmount: row.UtilizedAmount || row.utilizedAmount,
          ADCode: row.ADCode || row.adCode,
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

  const irmOutstanding = parseFloat(selectedIRM?.OutstandingAmount) || 0;
  console.log("selectedIRM?.OutstandingAmount =", selectedIRM?.OutstandingAmount);



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
    const res = await fetch('http://localhost:5000/api/mapping/irmToSB', {
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
          adCode: irm.ADCode,
          bankName: irm.BankName,
          ieCode: irm.IECode,
          remittanceDate: irm.RemittanceDate,
          purposeCode: irm.PurposeCode,
          remittanceCurrency: irm.RemittanceCurrency,
          remittanceAmount: irm.RemittanceAmount,
          utilizedAmount: irm.UtilizedAmount,
          outstandingAmount: irm.OutstandingAmount,
          irmUtilizationAmount: amt
        };
      })
    };


    console.log("Sending payload:", payload);

    try {
      const res = await fetch('http://localhost:5000/api/mapping/sbToIRM', {
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

  const visibleRows = mode === 'irmToSb' ? sbData : irmData;

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
              <th className="px-3 py-2">Remittance Amount</th>
              <th className="px-3 py-2">Outstanding Amount</th>
              <th className="px-3 py-2">Remitter Name</th>
              <th className="px-3 py-2">Status</th>
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
              <td className="px-3 py-2">{selectedIRM.BankName}</td>
              <td className="px-3 py-2">{selectedIRM.IECode}</td>
              <td className="px-3 py-2">{selectedIRM.RemittanceDate}</td>
              <td className="px-3 py-2">{selectedIRM.RemittanceAmount}</td>
              <td className="px-3 py-2">{selectedIRM.OutstandingAmount}</td>
              <td className="px-3 py-2">{selectedIRM.RemitterName}</td>
              <td className="px-3 py-2">{selectedIRM.Status}</td>
            </tr>
            {showIRMDetails && (
              <tr className="bg-gray-50 text-sm">
                <td colSpan={9}>
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-gray-100 font-semibold text-black">
                      <tr>
                        {["ADCode", "PurposeCode", "RemittanceCurrency", "UtilizedAmount"].map((key, i) => (
                          <th key={i} className="px-4 py-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {["ADCode", "PurposeCode", "RemittanceCurrency", "UtilizedAmount"].map((key, i) => (
                          <td key={i} className="px-4 py-2 text-black">{selectedIRM[key] || '-'}</td>
                        ))}
                      </tr>
                    </tbody>
                    <thead className="bg-gray-100 font-semibold text-black">
                      <tr>
                        {["RemitterAddress", "RemitterCountryCode", "RemitterBank", "OtherBankRefNumber"].map((key, i) => (
                          <th key={i} className="px-4 py-2">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {["RemitterAddress", "RemitterCountryCode", "RemitterBank", "OtherBankRefNumber"].map((key, i) => (
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
            {sbData.map((sb, i) => (
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
            setUtilization({
              ...utilization,
              [sb.shippingBillNo]: value === '' ? '' : parseFloat(value),
            });
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
                {["","IECode", "InvoiceDate", "RealizedValue", "BuyerAddress", "ConsigneeCountryCode"].map((key, i) => (
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
                {["","PortOfDestination", "ShippingCompany", "VesselName", "BLDate", "TradeTerms", "Commodity"].map((key, i) => (
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
                <th className="px-3 py-2">FOB Currency</th>
                <th className="px-3 py-2">Export Bill Value</th>
                <th className="px-3 py-2">Bill Outstanding Value</th>
                <th className="px-3 py-2">Buyer Name</th>
                <th className="px-3 py-2">Buyer Country Code</th>
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
                <td className="px-3 py-2">{selectedSB.fobCurrency}</td>
                <td className="px-3 py-2">{selectedSB.exportBillValue}</td>
                <td className="px-3 py-2">{selectedSB.billOutstandingValue}</td>
                <td className="px-3 py-2">{selectedSB.buyerName}</td>
                <td className="px-3 py-2">{selectedSB.buyerCountryCode}</td>
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
                          <td className="px-4 py-2">Commodity</td>
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#7bbbc2] font-semibold">
              <th className="px-2 py-3 w-4"><input type="checkbox" /></th>
              <th className="px-2 py-3 w-4 text-black"></th>
              {["RemittanceRefNumber", "BankName", "IECode", "RemittanceDate", "RemittanceAmount", "OutstandingAmount", "RemitterName", "Status"].map((head, i) => (
                <th key={i} className="px-4 py-3 text-left text-black">{head}</th>
              ))}
              <th className="px-4 py-3 text-left text-black">Utilization Amount</th>
            </tr>
          </thead>
          <tbody>
            {irmData.map((row) => (
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
                  <td className="px-4 py-2 text-black">{row.BankName}</td>
                  <td className="px-4 py-2 text-black">{row.IECode}</td>
                  <td className="px-4 py-2 text-black">{row.RemittanceDate}</td>
                  <td className="px-4 py-2 text-black">{row.RemittanceAmount}</td>
                  <td className="px-4 py-2 text-black">{row.OutstandingAmount}</td>
                  <td className="px-4 py-2 text-black">{row.RemitterName}</td>
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
                            {[" ", "ADCode", "PurposeCode", "RemittanceCurrency", "UtilizedAmount"].map((key, i) => (
                              <th key={i} className="px-4 py-2">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {[" ", "ADCode", "PurposeCode", "RemittanceCurrency", "UtilizedAmount"].map((key, i) => (
                              <td key={i} className="px-4 py-2 text-black">{row[key] || '-'}</td>
                            ))}
                          </tr>
                        </tbody>

                        <thead className="bg-gray-100 font-semibold text-black">
                          <tr>
                            {[" ", "RemitterAddress", "RemitterCountryCode", "RemitterBank", "OtherBankRefNumber"].map((key, i) => (
                              <th key={i} className="px-4 py-2">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {[" ", "RemitterAddress", "RemitterCountryCode", "RemitterBank", "OtherBankRefNumber"].map((key, i) => (
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
