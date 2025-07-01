// placeholder for irm.model.js
const mongoose = require('mongoose');

const irmSchema = new mongoose.Schema({
  adCode: String,
  bankName: String,
  ieCode: String,
  remittanceRefNo: String,
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
  otherBankRefNo: String,
  status: String,
  remittanceType: String,
},{ collection: 'irm' }); 

module.exports = mongoose.model('IRM', irmSchema);
