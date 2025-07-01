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

    const date = parseDate(row.remittanceDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: `Row ${i + 2}: Invalid date format` });
    }

    validEntries.push({
      SrNo: i + 1,
      adCode: row.adCode,
      bankName: row.bankName,
      ieCode: row.ieCode,
      remittanceRefNo: row.remittanceRefNo,
      remittanceDate: date,
      purposeCode: row.purposeCode,
      remittanceCurrency: row.remittanceCurrency,
      remittanceAmount: parseFloat(row.remittanceAmount),
      utilizedAmount: parseFloat(row.utilizedAmount),
      outstandingAmount: parseFloat(row.outstandingAmount),
      remitterName: row.remitterName,
      remitterAddress: row.remitterAddress,
      remitterCountryCode: row.remitterCountryCode,
      remitterBank: row.remitterBank,
      otherBankRefNo: row.otherBankRef,  // ✅ fixed line
      status: row.status,
      remittanceType: row.remittanceType
    });

  }

  try {
    const inserted = await IRM.insertMany(validEntries);
    console.log('Inserted:', inserted);  // ✅ Debug log
    res.status(201).json({ message: `${inserted.length} IRM entries inserted successfully` });
  } catch (err) {
    console.error('Insertion failed:', err);  // ✅ Error log
    res.status(500).json({ message: 'Failed to insert entries', error: err.message });
  }

};

