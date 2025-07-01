// placeholder for sb.model.js
const mongoose = require('mongoose');

const sbSchema = new mongoose.Schema({
  shippingBillNo: String,
  formNo: String,
  shippingBillDate: String,
  portCode: String,
  exportAgency: String,
  adCode: String,
  bankName: String,
  ieCode: String,
  invoiceNo: String,
  invoiceDate: String,
  fobCurrency: String,
  exportBillValue: Number,
  billOutstandingValue: Number,
  sbUtilization: Number,
  buyerName: String,
  buyerAddress: String,
  buyerCountryCode: String,
  consigneeName: String,
  consigneeCountryCode: String,
  portOfDestination: String,
  finalDestination: String,
  transitDays: Number,
  commodity: String,
  shippingCompany: String,
  blNumber: String,             // ✅ add this
  vesselName: String,           // ✅ add this
  blDate: String,               // ✅ add this
  commercialInvoice: String     // ✅ add this
}, { collection: "shipping_bill" });


module.exports = mongoose.model('ShippingBill', sbSchema);
