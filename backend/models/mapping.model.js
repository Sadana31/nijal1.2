const mongoose = require('mongoose');

const mappingSchema = new mongoose.Schema({
  trackNo: String,

  // IRM fields (if mapping IRM → SB)
  irm: {
    remittanceRefNumber: String,
    adCode: String,
    bankName: String,
    ieCode: String,
    remittanceDate: String,
    purposeCode: String,
    remittanceCurrency: String,
    remittanceAmount: String,
    utilizedAmount: String,
    outstandingAmount: String,
  },

  // Shipping Bills mapped (if mapping IRM → SB)
  mappedSBs: [
    {
      shippingBillNo: String,
      utilizationAmount: String,
    },
  ],

  // SB to IRM mapping (you already have this)
  shippingBill: {
    shippingBillNo: String,
    formNo: String,
    shippingBillDate: String,
    portCode: String,
    exportAgency: String,
    adCode: String,
    ieCode: String,
    invoiceNo: String,
    invoiceDate: String,
    fobCurrency: String,
    exportBillValue: String,
    realizedValue: String,
    outstandingValue: String,
    sbUtilizationAmount: String,
  },
  mappedIRMs: [
    {
      remittanceRefNumber: String,
      adCode: String,
      bankName: String,
      ieCode: String,
      remittanceDate: String,
      purposeCode: String,
      remittanceCurrency: String,
      remittanceAmount: String,
      utilizedAmount: String,
      outstandingAmount: String,
      irmUtilizationAmount: String,
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'mapping' });

module.exports = mongoose.model('Mapping', mappingSchema);
