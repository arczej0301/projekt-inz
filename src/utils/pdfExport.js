// src/utils/pdfExport.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToPDF = (data, title = 'Raport Generalny') => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd.MM.yyyy');

  // Nagłówek raportu
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`Data generowania: ${dateStr}`, 14, 30);

  let currentY = 40;

  // Iterujemy przez kategorie danych
  Object.keys(data).forEach((category) => {
    const items = data[category];

    if (items && items.length > 0) {
      // Tytuł sekcji
      doc.setFontSize(14);
      doc.text(category, 14, currentY);
      currentY += 5;

      // Przygotowanie kolumn (pobieramy klucze z pierwszego obiektu)
      const headers = Object.keys(items[0]).map(key => key.toUpperCase());
      const body = items.map(item => Object.values(item));

      // Generowanie tabeli
      doc.autoTable({
        head: [headers],
        body: body,
        startY: currentY,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }, // Niebieski nagłówek
        margin: { top: 10 },
      });

      // Aktualizacja pozycji Y dla następnej tabeli
      currentY = doc.lastAutoTable.finalY + 15;
      
      // Jeśli brakuje miejsca, dodaj nową stronę
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    }
  });

  doc.save(`${title}_${dateStr}.pdf`);
};