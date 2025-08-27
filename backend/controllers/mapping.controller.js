const ShippingBill = require('../models/sb.model');
const IRM = require('../models/irm.model');
const Mapping = require('../models/mapping.model');


exports.mapIRMsToSB = async (req, res) => {
  const { shippingBillData, selectedIRMData, trackNo } = req.body;

  if (!shippingBillData || !selectedIRMData || !Array.isArray(selectedIRMData)) {
    return res.status(400).json({ message: 'Missing or invalid data.' });
  }

  try {
    console.log("📦 Received IRM to SB Mapping Request");
    console.log("🔹 Shipping Bill Data:", shippingBillData);
    console.log("🔹 Selected IRMs:", selectedIRMData);

    const sbOutstanding = parseFloat(
      (shippingBillData.outstandingValue || '0').toString().replace(/,/g, '')
    );

    const totalUtilized = selectedIRMData.reduce(
      (sum, item) => sum + parseFloat(item.irmUtilizationAmount || 0),
      0
    );

    if (isNaN(sbOutstanding) || isNaN(totalUtilized)) {
      return res.status(400).json({
        message: 'Invalid numeric values for outstanding/utilization.'
      });
    }

    if (Math.abs(totalUtilized - sbOutstanding) > 0.01) {
      return res.status(400).json({
        message: `Total IRM utilization (${totalUtilized}) must equal the SB outstanding value (${sbOutstanding}).`
      });
    }

    // Update each IRM's utilizedAmount
    await Promise.all(selectedIRMData.map(async irm => {
      const ref = irm.RemittanceRefNumber || irm.remittanceRefNumber;
      await IRM.findOneAndUpdate(
        { RemittanceRefNumber: ref },
        { $set: { utilizedAmount: irm.irmUtilizationAmount } },
        { new: true }
      );
    }));

    // Fetch full IRM data from DB
    const fullIRMData = await Promise.all(selectedIRMData.map(async (irm) => {
    const ref = irm.RemittanceRefNumber || irm.remittanceRefNumber;
    const fullIRM = await IRM.findOne({ RemittanceRefNumber: ref }).lean();

    if (!fullIRM) return null;

    return {
      ...fullIRM,
      irmUtilizationAmount: irm.irmUtilizationAmount
    };
  }));

  


  // Filter out nulls in case any IRMs weren't found
  const cleanedIRMData = fullIRMData.filter(irm => irm !== null);


    // Save the mapping
    await Mapping.create({
      shippingBill: {
        shippingBillNo: shippingBillData.shippingBillNo,
        formNo: shippingBillData.formNo,
        shippingBillDate: shippingBillData.shippingBillDate,
        portCode: shippingBillData.portCode,
        exportAgency: shippingBillData.exportAgency,
        adCode: shippingBillData.adCode,
        bankName: shippingBillData.bankName,
        ieCode: shippingBillData.ieCode,
        invoiceNo: shippingBillData.invoiceNo,
        invoiceDate: shippingBillData.invoiceDate,
        fobCurrency: shippingBillData.fobCurrency,
        exportBillValue: shippingBillData.exportBillValue,
        billOutstandingValue: shippingBillData.billOutstandingValue,
        realizedValue: shippingBillData.realizedValue,
        sbUtilizationAmount: totalUtilized,
        buyerName: shippingBillData.buyerName,
        buyerAddress: shippingBillData.buyerAddress,
        buyerCountryCode: shippingBillData.buyerCountryCode,
        consigneeName: shippingBillData.consigneeName,
        consigneeCountryCode: shippingBillData.consigneeCountryCode,
        portOfDestination: shippingBillData.portOfDestination,
        finalDestination: shippingBillData.finalDestination,
        commodity: shippingBillData.commodity,
        shippingCompany: shippingBillData.shippingCompany,
        blNumber: shippingBillData.blNumber,
        vesselName: shippingBillData.vesselName,
        blDate: shippingBillData.blDate,
        commercialInvoice: shippingBillData.commercialInvoice
      },
      mappedIRMs: cleanedIRMData,
      createdAt: new Date()
    });

    console.log("✅ IRM to SB mapping saved successfully.");
    return res.status(200).json({ message: 'IRM successfully mapped to Shipping Bill.' });

  } catch (err) {
    console.error("❌ Error during IRM to SB mapping:", err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


exports.mapSBsToIRM = async (req, res) => {
  const { remittanceRefNumber, utilization } = req.body;

  if (!remittanceRefNumber || !Array.isArray(utilization) || utilization.length === 0) {
    return res.status(400).json({ message: 'Missing or invalid data in request body.' });
  }

  try {
    const irm = await IRM.findOne({ RemittanceRefNumber: remittanceRefNumber });
    if (!irm) return res.status(404).json({ message: 'IRM not found' });

    const irmOutstanding = parseFloat(
      (irm.outstandingAmount || '0').toString().replace(/,/g, '')
    );

    if (isNaN(irmOutstanding)) {
      return res.status(400).json({ message: 'IRM missing outstandingAmount' });
    }

    const totalUtilized = utilization.reduce(
      (sum, item) => sum + parseFloat(item.amount || 0),
      0
    );

    if (totalUtilized !== irmOutstanding) {
      return res.status(400).json({
        message: `Total utilization (${totalUtilized}) must equal the IRM outstanding value (${irmOutstanding}).`
      });
    }

    // Update each SB's utilizedAmount and fetch full details
    const updatedSBs = await Promise.all(
      utilization.map(async ({ shippingBillNo, amount }) => {
        const sb = await ShippingBill.findOneAndUpdate(
          { shippingBillNo },
          { $set: { utilizedAmount: parseFloat(amount) } },
          { new: true }
        );
        if (!sb) return null;

        return {
          ...sb.toObject(),
          sbUtilizationAmount: parseFloat(amount)
        };
      })
    );

    const cleanedSBs = updatedSBs.filter(Boolean);

    // Prepare mapping structure
    const mappingData = {
      shippingBill: null,
      IRM: [
        {
          ...irm.toObject(),
          irmUtilizationAmount: totalUtilized
        }
      ],
      mappedSBs: cleanedSBs,
      createdAt: new Date()
    };

    await Mapping.create(mappingData);

    return res.status(200).json({ message: 'Shipping Bills successfully mapped to IRM.' });

  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};



exports.getMappingHistoryBySB = async (req, res) => {
  const { sbNo } = req.params;

  if (!sbNo) {
    return res.status(400).json({ message: "Shipping Bill number (sbNo) is required" });
  }

  try {
    const mappings = await Mapping.find({ 'shippingBill.shippingBillNo': sbNo });

    if (!mappings || mappings.length === 0) {
      return res.status(404).json({ message: "No mappings found for this Shipping Bill" });
    }

    res.status(200).json(mappings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMappingHistoryByIRM = async (req, res) => {
  const { refNo } = req.params;

  if (!refNo) {
    return res.status(400).json({ message: "Remittance reference number (refNo) is required" });
  }

  try {
    const mappings = await Mapping.find({ 'mappedIRMs.RemittanceRefNumber': refNo });

    if (!mappings || mappings.length === 0) {
      return res.status(404).json({ message: "No mappings found for this IRM" });
    }

    // Extract mapped shipping bills only
    const mappedSBs = mappings.map(m => m.shippingBill);

    res.status(200).json(mappedSBs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.getAllMappings = async (req, res) => {
  try {
    const allMappings = await Mapping.find(); // fetch all documents
    res.status(200).json(allMappings);
  } catch (error) {
    console.error('Error fetching all mappings:', error);
    res.status(500).json({ message: 'Server error while fetching mappings' });
  }
};

