import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Funkcja czyszcząca tekst:
// 1. Usuwa Emoji (powodują błędy w PDF)
// 2. Zamienia polskie znaki na łacińskie (standardowe czcionki PDF nie mają 'ą', 'ę' itp.)
const cleanText = (str) => {
  if (typeof str !== 'string') return str;

  // 1. Mapa polskich znaków
  const plMap = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };

  // 2. Zamiana polskich znaków
  let clean = str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => plMap[match] || match);

  // 3. Usunięcie Emoji i dziwnych symboli
  clean = clean.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  return clean.trim();
};

export const exportToPDF = (data, title = 'Raport Generalny') => {
  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd.MM.yyyy');

  // --- USTAWIENIE CZCIONKI GŁÓWNEJ ---
  // Dostępne standardowe: 'times', 'helvetica', 'courier'
  const fontName = 'times'; 
  doc.setFont(fontName, 'normal');

  // Nagłówek raportu
  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80); // Ciemny granat
  doc.text(cleanText(title), 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(cleanText(`Data generowania: ${dateStr}`), 14, 30);
  doc.setTextColor(0);

  let currentY = 40;

  // Iterujemy przez kategorie danych
  Object.keys(data).forEach((category) => {
    const items = data[category];

    if (items && items.length > 0) {
      // Tytuł sekcji (np. FINANSE)
      doc.setFont(fontName, 'bold'); // Pogrubienie dla nagłówka
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // Niebieski
      doc.text(cleanText(category.toUpperCase()), 14, currentY);
      
      doc.setFont(fontName, 'normal'); // Powrót do normalnej czcionki
      currentY += 5;

      // Przygotowanie nagłówków i danych
      const headers = Object.keys(items[0]).map(key => cleanText(key.toUpperCase()));
      const body = items.map(item => 
        Object.values(item).map(val => cleanText(String(val)))
      );

      // Generowanie tabeli z ustawioną czcionką
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: currentY,
        theme: 'grid',
        styles: { 
          font: fontName, // <--- WAŻNE: Ustawienie czcionki w tabeli
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255,
          fontStyle: 'bold',
          font: fontName // Czcionka nagłówka tabeli
        },
        columnStyles: {
          // Opcjonalne formatowanie kolumn
        },
        margin: { top: 10 },
      });

      // Aktualizacja pozycji Y dla następnej tabeli
      currentY = doc.lastAutoTable.finalY + 15;
      
      // Nowa strona jeśli brakuje miejsca
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    }
  });

  doc.save(`${cleanText(title)}_${dateStr}.pdf`);
};