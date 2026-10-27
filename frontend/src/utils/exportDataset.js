/**
 * Direct file stream CSV download from backend (memory efficient for large datasets).
 */
export const downloadDatasetCSVDirect = async (api, reqId, isMain = false, filename = 'complax_dataset.csv') => {
  try {
    const downloadUrl = isMain ? '/datasets/main/download' : `/datasets/${reqId}/download`;
    const res = await api.get(downloadUrl, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert('Failed to download dataset CSV.');
  }
};

/**
 * Exports dataset array to CSV file download.
 */
export const downloadDatasetCSV = (data, filename = 'complax_dataset.csv') => {
  if (!data || data.length === 0) {
    alert('No dataset content available to download.');
    return;
  }

  const headers = ['complaint', 'priority'];
  const csvRows = [headers.join(',')];

  data.forEach(item => {
    const complaint = `"${(item.complaint || '').replace(/"/g, '""')}"`;
    const priority = `"${(item.priority || '').replace(/"/g, '""')}"`;
    csvRows.push(`${complaint},${priority}`);
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports dataset array to styled printable PDF document.
 * Safely handles large datasets by truncating printable DOM rows to top 1,000.
 */
export const downloadDatasetPDF = (data, title = 'COMPLAX Complaint Dataset', stats = null) => {
  if (!data || data.length === 0) {
    alert('No dataset content available to download.');
    return;
  }

  const totalCount = stats?.total ?? data.length;
  const highCount = stats?.high ?? data.filter(d => (d.priority || '').toUpperCase() === 'HIGH').length;
  const mediumCount = stats?.medium ?? data.filter(d => (d.priority || '').toUpperCase() === 'MEDIUM').length;
  const lowCount = stats?.low ?? data.filter(d => (d.priority || '').toUpperCase() === 'LOW').length;

  const MAX_PDF_ROWS = 1000;
  const isTruncated = totalCount > MAX_PDF_ROWS || data.length > MAX_PDF_ROWS;
  const displayData = data.slice(0, MAX_PDF_ROWS);

  const rowsHtml = displayData.map((item, idx) => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #64748B;">${idx + 1}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; color: #0F172A; font-size: 11px; line-height: 1.3;">
        ${(item.complaint || '').replace(/</g, '&lt;')}
      </td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: center;">
        <span style="
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          ${
            (item.priority || '').toUpperCase() === 'HIGH'
              ? 'background: #FEE2E2; color: #DC2626;'
              : (item.priority || '').toUpperCase() === 'MEDIUM'
              ? 'background: #FEF3C7; color: #D97706;'
              : 'background: #D1FAE5; color: #059669;'
          }
        ">${item.priority || 'MEDIUM'}</span>
      </td>
    </tr>
  `).join('');

  const pdfHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; color: #0F172A; background: #FFFFFF; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E06D43; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 20px; font-weight: 800; color: #E06D43; margin: 0; }
        .subtitle { font-size: 11px; color: #64748B; margin-top: 3px; }
        .summary { display: flex; gap: 10px; margin-bottom: 15px; }
        .badge-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px; flex: 1; text-align: center; }
        .badge-num { font-size: 16px; font-weight: 800; }
        .badge-label { font-size: 9px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #F1F5F9; color: #475569; padding: 8px; text-align: left; border-bottom: 2px solid #CBD5E1; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        .note-box { margin-bottom: 10px; padding: 8px 12px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; font-size: 11px; color: #92400E; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">COMPLAX — ${title}</h1>
          <div class="subtitle">Exported Report • Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 13px; font-weight: 800; color: #0F172A;">${totalCount.toLocaleString()} Total Records</div>
          <div style="font-size: 10px; color: #64748B;">System AI Dataset</div>
        </div>
      </div>

      <div class="summary">
        <div class="badge-box">
          <div class="badge-num" style="color: #0F172A;">${totalCount.toLocaleString()}</div>
          <div class="badge-label">Total Samples</div>
        </div>
        <div class="badge-box">
          <div class="badge-num" style="color: #DC2626;">${highCount.toLocaleString()}</div>
          <div class="badge-label">High Priority</div>
        </div>
        <div class="badge-box">
          <div class="badge-num" style="color: #D97706;">${mediumCount.toLocaleString()}</div>
          <div class="badge-label">Medium Priority</div>
        </div>
        <div class="badge-box">
          <div class="badge-num" style="color: #059669;">${lowCount.toLocaleString()}</div>
          <div class="badge-label">Low Priority</div>
        </div>
      </div>

      ${
        isTruncated
          ? `<div class="note-box">
              <strong>Notice:</strong> Displaying first 1,000 sample records in PDF report for print performance. Download CSV to access all ${totalCount.toLocaleString()} records.
             </div>`
          : ''
      }

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">#</th>
            <th>Complaint Description</th>
            <th style="width: 110px; text-align: center;">Assigned Priority</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(pdfHtml);
    printWindow.document.close();
  }
};
