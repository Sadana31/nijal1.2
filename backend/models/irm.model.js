// irm.model.js
const mongoose = require('mongoose');

const irmSchema = new mongoose.Schema({
  SrNo: Number,
  adCode: String,
  bankName: String,
  ieCode: String,
  RemittanceRefNo: String,
  remittanceDate: String,
  purposeCode: String,
  remittanceCurrency: String,
  remittanceAmount: Number,
  utilizedAmount: Number,
  outstandingAmount: Number,
  remitterName: String,
  remitterAddress: String,
  remitterCountryCode: String,
  remitterBank: String,
  otherBankRef: String,
  status: String,
  remittanceType: String,
}, { collection: 'irm' });

module.exports = mongoose.model('IRM', irmSchema);
