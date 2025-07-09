
const ShippingBill = require('../models/sb.model');

exports.getAllSB = async (req, res) => {
  try {
    const { _id, shippingBillNo } = req.query;

    if (_id) {
      const sb = await ShippingBill.findById(_id);
      if (!sb) return res.status(404).json({ message: "Shipping Bill not found" });
      return res.json([sb]); // return as array for consistency
    }

    if (shippingBillNo) {
      const sb = await ShippingBill.find({ shippingBillNo });
      if (!sb.length) return res.status(404).json({ message: "Shipping Bill not found" });
      return res.json(sb); // already an array
    }


    // If no _id, return all
    const sbRecords = await ShippingBill.find();
      res.json(sbRecords); // array
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

  const validEntries = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Check for missing fields
    const missing = requiredFields.filter(f => !row[f] || row[f].trim() === '');
    if (missing.length) {
      return res.status(400).json({ message: `Row ${i + 2}: Missing fields - ${missing.join(', ')}` });
    }

    // Validate numeric fields
    const exportBillValue = parseFloat(row.exportBillValue);
    const billOutstandingValue = parseFloat(row.billOutstandingValue);
    const sbUtilization = parseFloat(row.sbUtilization);

    if ([exportBillValue, billOutstandingValue, sbUtilization].some(isNaN)) {
      return res.status(400).json({ message: `Row ${i + 2}: Invalid numeric values` });
    }

    // Validate date format: dd-mm-yyyy
    const dateFields = ['shippingBillDate', 'invoiceDate', 'blDate'];
    for (const field of dateFields) {
      if (!/^\d{2}-\d{2}-\d{4}$/.test(row[field])) {
        return res.status(400).json({ message: `Row ${i + 2}: Invalid date format in ${field} (use dd-mm-yyyy)` });
      }
    }

    validEntries.push({
      shippingBillNo: row.shippingBillNo,
      formNo: row.formNo,
      shippingBillDate: row.shippingBillDate, // ✅ Store as string
      portCode: row.portCode,
      exportAgency: row.exportAgency,
      adCode: row.adCode,
      bankName: row.bankName,
      ieCode: row.ieCode,
      invoiceNo: row.invoiceNo,
      invoiceDate: row.invoiceDate,           // ✅ Store as string
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
      blDate: row.blDate,                     // ✅ Store as string
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
