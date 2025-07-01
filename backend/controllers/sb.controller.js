
const ShippingBill = require('../models/sb.model');

exports.getAllSB = async (req, res) => {
  try {
    const sbRecords = await ShippingBill.find();
    res.json(sbRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSB = async (req, res) => {
  try {
    const newSB = new ShippingBill(req.body);
    await newSB.save();
    res.status(201).json(newSB);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSBById = async (req, res) => {
  try {
    const sb = await ShippingBill.findById(req.params.id);
    res.status(200).json(sb);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSB = async (req, res) => {
  try {
    const updated = await ShippingBill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.createSBInBulk = async (req, res) => {
  const data = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: 'No data provided' });
  }

  const requiredFields = [
    'shippingBillNo', 'formNo', 'shippingBillDate', 'portCode', 'exportAgency',
    'adCode', 'bankName', 'ieCode', 'invoiceNo', 'invoiceDate', 'fobCurrency',
    'exportBillValue', 'billOutstandingValue', 'sbUtilization', 'buyerName',
    'buyerAddress', 'buyerCountryCode', 'consigneeName', 'consigneeCountryCode',
    'portOfDestination', 'finalDestination', 'commodity', 'shippingCompany',
    'blNumber', 'vesselName', 'blDate', 'commercialInvoice'
  ];

  const parseDate = (dateStr) => {
    const [dd, mm, yyyy] = dateStr.split('-');
    return new Date(`${yyyy}-${mm}-${dd}`);
  };

  const validEntries = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const missing = requiredFields.filter(f => !row[f] || row[f].trim() === '');
    if (missing.length) {
      return res.status(400).json({ message: `Row ${i + 2}: Missing fields - ${missing.join(', ')}` });
    }

    // Convert numeric fields
    const exportBillValue = parseFloat(row.exportBillValue);
    const billOutstandingValue = parseFloat(row.billOutstandingValue);
    const sbUtilization = parseFloat(row.sbUtilization);

    if ([exportBillValue, billOutstandingValue, sbUtilization].some(isNaN)) {
      return res.status(400).json({ message: `Row ${i + 2}: Invalid numeric values` });
    }

    // Convert date fields
    const shippingBillDate = parseDate(row.shippingBillDate);
    const invoiceDate = parseDate(row.invoiceDate);
    const blDate = parseDate(row.blDate);

    if ([shippingBillDate, invoiceDate, blDate].some(d => isNaN(d.getTime()))) {
      return res.status(400).json({ message: `Row ${i + 2}: Invalid date format` });
    }

    validEntries.push({
      shippingBillNo: row.shippingBillNo,
      formNo: row.formNo,
      shippingBillDate,
      portCode: row.portCode,
      exportAgency: row.exportAgency,
      adCode: row.adCode,
      bankName: row.bankName,
      ieCode: row.ieCode,
      invoiceNo: row.invoiceNo,
      invoiceDate,
      fobCurrency: row.fobCurrency,
      exportBillValue,
      billOutstandingValue,
      sbUtilization,
      buyerName: row.buyerName,
      buyerAddress: row.buyerAddress,
      buyerCountryCode: row.buyerCountryCode,
      consigneeName: row.consigneeName,
      consigneeCountryCode: row.consigneeCountryCode,
      portOfDestination: row.portOfDestination,
      finalDestination: row.finalDestination,
      commodity: row.commodity,
      shippingCompany: row.shippingCompany,
      blNumber: row.blNumber,
      vesselName: row.vesselName,
      blDate,
      commercialInvoice: row.commercialInvoice,
    });
  }

  try {
    await ShippingBill.insertMany(validEntries);
    res.status(201).json({ message: `${validEntries.length} Shipping Bill entries inserted successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to insert entries', error: err.message });
  }
};


