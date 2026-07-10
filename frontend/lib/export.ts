export function exportToCSV(data: any[], fileName: string, headers: string[], keys: string[]) {
  // Add UTF-8 BOM so Excel displays Vietnamese characters properly
  let csvContent = "\uFEFF";
  
  // Header row
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(";") + "\n";
  
  // Data rows
  data.forEach((row) => {
    const rowData = keys.map((key) => {
      let val = row[key] === undefined || row[key] === null ? "" : String(row[key]);
      
      // If the value consists purely of digits and is long (>=9 chars) or starts with '0' (like phone numbers, CCCD)
      // we wrap it as an Excel string formula (e.g. ="0709809093") to prevent scientific notation and preserve leading zeros
      if (/^\d+$/.test(val) && (val.length >= 9 || val.startsWith("0"))) {
        return `="${val}"`;
      }
      
      // Escape double quotes and wrap in quotes
      val = `"${val.replace(/"/g, '""')}"`;
      return val;
    });
    csvContent += rowData.join(";") + "\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
