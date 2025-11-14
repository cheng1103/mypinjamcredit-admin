import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Lead {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  loanAmount: number;
  loanType: string;
  status: string;
  occupation?: string;
  monthlyIncome?: number;
  location?: string;
  message?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export const exportLeadToPDF = (lead: Lead) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Lead Details Report', 14, 20);

  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

  // Personal Information
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Personal Information', 14, 40);

  autoTable(doc, {
    startY: 45,
    head: [['Field', 'Value']],
    body: [
      ['Full Name', lead.fullName],
      ['Phone Number', lead.phone],
      ['Email', lead.email || 'N/A'],
      ['Occupation', lead.occupation || 'N/A'],
      ['Location', lead.location || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }, // blue-500
    margin: { left: 14, right: 14 },
  });

  // Financial Information
  const finalY = (doc as any).lastAutoTable.finalY || 90;
  doc.setFontSize(14);
  doc.text('Financial Information', 14, finalY + 10);

  autoTable(doc, {
    startY: finalY + 15,
    head: [['Field', 'Value']],
    body: [
      ['Monthly Income', lead.monthlyIncome ? `RM ${lead.monthlyIncome.toLocaleString()}` : 'N/A'],
      ['Loan Amount Requested', `RM ${lead.loanAmount.toLocaleString()}`],
      ['Loan Type', lead.loanType],
    ],
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94] }, // green-500
    margin: { left: 14, right: 14 },
  });

  // Application Status
  const finalY2 = (doc as any).lastAutoTable.finalY || 140;
  doc.setFontSize(14);
  doc.text('Application Status', 14, finalY2 + 10);

  autoTable(doc, {
    startY: finalY2 + 15,
    head: [['Field', 'Value']],
    body: [
      ['Status', lead.status],
      ['Assigned To', lead.assignedTo || 'Unassigned'],
      ['Submitted On', new Date(lead.createdAt).toLocaleString()],
      ['Last Updated', new Date(lead.updatedAt).toLocaleString()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [168, 85, 247] }, // purple-500
    margin: { left: 14, right: 14 },
  });

  // Message (if exists)
  if (lead.message) {
    const finalY3 = (doc as any).lastAutoTable.finalY || 190;
    doc.setFontSize(14);
    doc.text('Additional Message', 14, finalY3 + 10);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitMessage = doc.splitTextToSize(lead.message, 180);
    doc.text(splitMessage, 14, finalY3 + 18);
  }

  // Save the PDF
  doc.save(`lead_${lead.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportLeadsToPDF = (leads: Lead[]) => {
  const doc = new jsPDF('landscape'); // Use landscape for wider table

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Leads Export Report', 14, 20);

  // Add generation date and count
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Total Leads: ${leads.length}`, 14, 34);

  // Create table data
  const tableData = leads.map(lead => [
    lead.fullName,
    lead.phone,
    lead.occupation || 'N/A',
    lead.monthlyIncome ? `RM ${lead.monthlyIncome.toLocaleString()}` : 'N/A',
    lead.loanType,
    `RM ${lead.loanAmount.toLocaleString()}`,
    lead.location || 'N/A',
    lead.status,
    new Date(lead.createdAt).toLocaleDateString(),
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Name', 'Phone', 'Occupation', 'Income', 'Loan Type', 'Amount', 'Location', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Save the PDF
  doc.save(`leads_export_${new Date().toISOString().split('T')[0]}.pdf`);
};
