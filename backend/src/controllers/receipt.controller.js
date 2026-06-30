const PDFDocument = require('pdfkit');
const prisma = require('../config/prisma');

// Generate sequential receipt number: GSY-00001
const generateReceiptNo = async () => {
  const count = await prisma.receipt.count();
  return `GSY-${String(count + 1).padStart(5, '0')}`;
};

// ─── Generate & Save Receipt ──────────────────────────────────
const generateReceipt = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { user } = req;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: true,
        staff: { select: { id: true, fullName: true } },
        cashier: { select: { id: true, fullName: true } },
        branch: { select: { id: true, name: true, location: true, phone: true } },
        receipt: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (transaction.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Receipt only available for confirmed transactions' });
    }

    // Access control
    if (user.role === 'STAFF' && transaction.staffId !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (user.role === 'ADMIN' && transaction.branchId !== user.branchId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Create receipt record if doesn't exist
    let receipt = transaction.receipt;
    if (!receipt) {
      const receiptNo = await generateReceiptNo();
      receipt = await prisma.receipt.create({
        data: { receiptNo, transactionId, printedById: user.id },
      });
    }

    // Build PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${receipt.receiptNo}.pdf"`);
    doc.pipe(res);

    const branch = transaction.branch;
    const primaryColor = '#1a5276';
    const accentColor = '#2980b9';
    const lightGray = '#f0f0f0';

    // ── Header ──────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('GOSANDY COMPANY LTD', 50, 25, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
      .text(`${branch.name} Branch • ${branch.location}`, 50, 52, { align: 'center' });
    if (branch.phone) {
      doc.text(`Tel: ${branch.phone}`, 50, 68, { align: 'center' });
    }

    // ── Receipt Info Box ────────────────────────────────────────
    doc.rect(50, 115, doc.page.width - 100, 70).fill(lightGray).stroke('#ddd');
    doc.fillColor('#333').fontSize(10).font('Helvetica-Bold');

    doc.text('RECEIPT', 60, 125);
    doc.font('Helvetica').text(receipt.receiptNo, 60, 140).fontSize(9);

    doc.font('Helvetica-Bold').text('DATE', 220, 125);
    doc.font('Helvetica').text(
      new Date(transaction.confirmedAt).toLocaleString('en-GH', {
        dateStyle: 'medium', timeStyle: 'short',
      }),
      220, 140
    );

    doc.font('Helvetica-Bold').text('SERVED BY', 380, 125);
    doc.font('Helvetica').text(transaction.staff.fullName, 380, 140);

    if (transaction.customerName) {
      doc.font('Helvetica-Bold').text('CUSTOMER', 60, 158);
      doc.font('Helvetica').text(transaction.customerName, 140, 158);
    }

    // ── Items Table ─────────────────────────────────────────────
    let y = 205;
    // Table header
    doc.rect(50, y - 5, doc.page.width - 100, 22).fill(accentColor);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    doc.text('ITEM', 60, y);
    doc.text('QTY', 310, y, { width: 60, align: 'right' });
    doc.text('UNIT PRICE', 380, y, { width: 80, align: 'right' });
    doc.text('SUBTOTAL', 470, y, { width: 80, align: 'right' });

    y += 28;
    doc.fillColor('#333').font('Helvetica').fontSize(10);

    transaction.items.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.rect(50, y - 4, doc.page.width - 100, 20).fill('#f9f9f9');
      }
      doc.fillColor('#333');
      doc.text(item.itemName, 60, y, { width: 240 });
      doc.text(String(item.quantity), 310, y, { width: 60, align: 'right' });
      doc.text(`₵${parseFloat(item.unitPrice).toFixed(2)}`, 380, y, { width: 80, align: 'right' });
      doc.text(`₵${parseFloat(item.subtotal).toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 22;
    });

    // ── Totals ──────────────────────────────────────────────────
    y += 10;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#ccc').stroke();
    y += 12;

    const totalsX = 370;
    doc.font('Helvetica').fillColor('#555').fontSize(10);
    doc.text('Subtotal:', totalsX, y);
    doc.text(`₵${parseFloat(transaction.totalAmount).toFixed(2)}`, totalsX + 110, y, { align: 'right', width: 60 });

    y += 18;
    doc.rect(50, y - 4, doc.page.width - 100, 24).fill(primaryColor);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(12);
    doc.text('TOTAL:', totalsX, y);
    doc.text(`₵${parseFloat(transaction.totalAmount).toFixed(2)}`, totalsX + 110, y, { align: 'right', width: 60 });

    y += 30;
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    doc.text('Amount Paid:', totalsX, y);
    doc.text(`₵${parseFloat(transaction.amountPaid).toFixed(2)}`, totalsX + 110, y, { align: 'right', width: 60 });

    y += 18;
    doc.font('Helvetica-Bold').fillColor(accentColor);
    doc.text('Change:', totalsX, y);
    doc.text(`₵${parseFloat(transaction.balance).toFixed(2)}`, totalsX + 110, y, { align: 'right', width: 60 });

    // ── Footer ──────────────────────────────────────────────────
    y += 50;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#ccc').stroke();
    y += 15;
    doc.fillColor('#888').fontSize(9).font('Helvetica')
      .text('Thank you for choosing Gosandy Company Ltd!', 50, y, { align: 'center' })
      .text('Printing • Photocopying • Lamination • Binding • Scanning • Typing • Editing', 50, y + 14, { align: 'center' });

    if (transaction.cashier) {
      doc.text(`Cashier: ${transaction.cashier.fullName}`, 50, y + 30, { align: 'center' });
    }

    doc.end();
  } catch (err) {
    console.error('Receipt generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Could not generate receipt' });
    }
  }
};

// ─── Get Receipt Info ─────────────────────────────────────────
const getReceipt = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const receipt = await prisma.receipt.findUnique({
      where: { transactionId },
      include: {
        printedBy: { select: { id: true, fullName: true } },
        transaction: { select: { id: true, totalAmount: true, status: true } },
      },
    });

    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch receipt' });
  }
};

module.exports = { generateReceipt, getReceipt };
