const mongoose = require('mongoose');
const { Schema } = mongoose;

const mappingSchema = new Schema({
  shippingBill: { type: Schema.Types.Mixed },
  mappedIRMs: [{ type: Schema.Types.Mixed }],
  mappedSBs: [{ type: Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mapping', mappingSchema);
