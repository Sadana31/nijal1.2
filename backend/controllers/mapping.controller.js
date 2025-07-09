const ShippingBill = require('../models/sb.model');
const IRM = require('../models/irm.model');
// At the top
const Mapping = require('../models/mapping.model');

exports.mapIRMsToSB = async (req, res) => {
  const { shippingBillData, selectedIRMData, trackNo } = req.body;

  if (!shippingBillData || !selectedIRMData || !Array.isArray(selectedIRMData)) {
    return res.status(400).json({ message: 'Missing or invalid data.' });
  }

  try {
    const sbOutstanding =
  parseFloat((irm.OutstandingAmount || irm.outstandingAmount || "0").toString().replace(/,/g, ''));
    const totalUtilized = selectedIRMData.reduce((sum, item) => sum + parseFloat(item.irmUtilizationAmount || 0), 0);

    if (totalUtilized !== sbOutstanding) {
      return res.status(400).json({
        message: `Total IRM utilization (${totalUtilized}) must equal the SB outstanding value (${sbOutstanding}).`
      });
    }

    // Optional: Update IRMs in DB if needed
    await Promise.all(selectedIRMData.map(async irm => {
      await IRM.findOneAndUpdate(
        { RemittanceRefNumber: irm.remittanceRefNumber },
        { $set: { UtilizedAmount: irm.irmUtilizationAmount } },
        { new: true }
      );
    }));

    // Save the mapping
    await Mapping.create({
  shippingBill: {
    shippingBillNo: shippingBillData.shippingBillNo,
    formNo: shippingBillData.formNo,
    shippingBillDate: shippingBillData.shippingBillDate,
    portCode: shippingBillData.portCode,
    exportAgency: shippingBillData.exportAgency,
    adCode: shippingBillData.adCode,
    ieCode: shippingBillData.ieCode,
    invoiceNo: shippingBillData.invoiceNo,
    invoiceDate: shippingBillData.invoiceDate,
    fobCurrency: shippingBillData.fobCurrency,
    exportBillValue: shippingBillData.exportBillValue,
    realizedValue: shippingBillData.realizedValue,
    outstandingValue: shippingBillData.outstandingValue,
    sbUtilizationAmount: totalUtilized
  },
  mappedIRMs: selectedIRMData.map((irm) => ({
    remittanceRefNumber: irm.remittanceRefNumber,
    adCode: irm.adCode,
    bankName: irm.bankName,
    ieCode: irm.ieCode,
    remittanceDate: irm.remittanceDate,
    purposeCode: irm.purposeCode,
    remittanceCurrency: irm.remittanceCurrency,
    remittanceAmount: irm.remittanceAmount,
    utilizedAmount: irm.utilizedAmount,
    outstandingAmount: irm.outstandingAmount,
    irmUtilizationAmount: irm.irmUtilizationAmount,
  })),
  createdAt: new Date()
});



    return res.status(200).json({ message: 'IRM successfully mapped to Shipping Bill.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.mapSBsToIRM = async (req, res) => {
  const { remittanceRefNumber, utilization } = req.body;
  console.log("Received payload:", req.body);
  console.log("🛬 Received /irmToSB request");
  console.log("📦 Payload:", req.body);


  if (!remittanceRefNumber || !utilization || !Array.isArray(utilization)) {
    return res.status(400).json({ message: 'Missing or invalid data in request body.' });
  }

  try {
    const irm = await IRM.findOne({ RemittanceRefNumber: remittanceRefNumber });
    console.log("IRM found:", irm);

    if (!irm) return res.status(404).json({ message: 'IRM not found' });

    const irmOutstanding = parseFloat(
      (irm?.OutstandingAmount || irm?.outstandingAmount || 0).toString().replace(/[^\d.]/g, '')
    );
    const totalUtilized = utilization.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    console.log("Total utilization vs IRM outstanding:", totalUtilized, irmOutstanding);

    if (totalUtilized !== irmOutstanding) {
      return res.status(400).json({ message: `Total utilization (${totalUtilized}) must equal the IRM outstanding value (${irmOutstanding}).` });
    }

    const updatePromises = utilization.map(({ shippingBillNo, amount }) =>
      ShippingBill.findOneAndUpdate(
        { shippingBillNo },
        { $set: { UtilizedAmount: parseFloat(amount) } },
        { new: true }
      )
    );
    await Promise.all(updatePromises);

    const mappingData = {
      irm: {
        remittanceRefNumber: remittanceRefNumber,
      },
      mappedSBs: utilization.map(item => ({
        shippingBillNo: item.shippingBillNo,
        utilizationAmount: String(parseFloat(item.amount))
      })),
      createdAt: new Date()
    };
    console.log("Saving Mapping:", mappingData);

    await Mapping.create(mappingData);

    return res.status(200).json({ message: 'Shipping Bills successfully mapped to IRM.' });
  } catch (err) {
    console.error("Error while saving mapping:", err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
