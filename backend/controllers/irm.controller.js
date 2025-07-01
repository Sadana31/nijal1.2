const IRM = require('../models/irm.model');

exports.getAllIRM = async (req, res) => {
  try {
    const irmRecords = await IRM.find();
    res.json(irmRecords);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createIRM = async (req, res) => {
  try {
    const newIRM = new IRM(req.body);
    await newIRM.save();
    res.status(201).json(newIRM);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getIRMById = async (req, res) => {
  try {
    const irm = await IRM.findById(req.params.id);  // lowercase variable name
    res.status(200).json(irm);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.updateIRM = async (req, res) => {
  try {
    const updated = await IRM.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createIRMInBulk = async (req, res) => {
  const data = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: 'No data provided' });
  }

  const requiredFields = [
    "remittanceRefNo", "adCode", "bankName", "ieCode", "remittanceDate",
    "purposeCode", "remittanceCurrency", "remittanceAmount", "utilizedAmount",
    "outstandingAmount", "remitterName", "remitterAddress", "remitterCountryCode",
    "remitterBank", "otherBankRef", "status", "remittanceType"
  ];

  const validEntries = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Check for missing fields
    const missing = requiredFields.filter(f => !row[f] || row[f].trim() === '');
    if (missing.length) {
      return res.status(400).json({ message: `Row ${i + 2}: Missing fields - ${missing.join(', ')}` });
    }

    // Validate date format
    if (!/^\d{2}-\d{2}-\d{4}$/.test(row.remittanceDate)) {
      return res.status(400).json({ message: `Row ${i + 2}: Invalid date format (use dd-mm-yyyy)` });
    }

    // Push to valid entries
    validEntries.push({
      SrNo: i + 1,
      adCode: row.adCode,
      bankName: row.bankName,
      ieCode: row.ieCode,
      remittanceRefNo: row.remittanceRefNo,
      remittanceDate: row.remittanceDate, // ✅ store as string
      purposeCode: row.purposeCode,
      remittanceCurrency: row.remittanceCurrency,
      remittanceAmount: parseFloat(row.remittanceAmount),
      utilizedAmount: parseFloat(row.utilizedAmount),
      outstandingAmount: parseFloat(row.outstandingAmount),
      remitterName: row.remitterName,
      remitterAddress: row.remitterAddress,
      remitterCountryCode: row.remitterCountryCode,
      remitterBank: row.remitterBank,
      otherBankRefNo: row.otherBankRef,
      status: row.status,
      remittanceType: row.remittanceType
    });
  }

  try {
    const inserted = await IRM.insertMany(validEntries);
    console.log('Inserted:', inserted.length);
    res.status(201).json({ message: `${inserted.length} IRM entries inserted successfully` });
  } catch (err) {
    console.error('Insertion failed:', err);
    res.status(500).json({ message: 'Failed to insert entries', error: err.message });
  }
};
