/**
 * Convert numbers into words for formal receipt & invoice issuance (Sri Lankan / Commonwealth format)
 * e.g. 12500 -> "Twelve Thousand Five Hundred Rupees Only"
 */
export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertChunk(num: number): string {
    let str = '';
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += units[num] + ' ';
    }
    return str.trim();
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';

  let result = '';

  const crores = Math.floor(integerPart / 10000000);
  const remainderAfterCrore = integerPart % 10000000;
  const lakhs = Math.floor(remainderAfterCrore / 100000);
  const remainderAfterLakh = remainderAfterCrore % 100000;
  const thousands = Math.floor(remainderAfterLakh / 1000);
  const hundreds = remainderAfterLakh % 1000;

  if (crores > 0) {
    result += convertChunk(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    result += convertChunk(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    result += convertChunk(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    result += convertChunk(hundreds) + ' ';
  }

  result = result.trim() + ' Rupees';

  if (decimalPart > 0) {
    result += ' and ' + convertChunk(decimalPart) + ' Cents';
  }

  result += ' Only';

  return result.replace(/\s+/g, ' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
