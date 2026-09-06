function numberToWordsIndian(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  num = Math.floor(Number(num));
  if (num === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 10) return single[n];
    if (n >= 10 && n < 20) return double[n - 10];
    const tensDigit = Math.floor(n / 10);
    const unitDigit = n % 10;
    return (tens[tensDigit] + (unitDigit ? ' ' + single[unitDigit] : '')).trim();
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred > 0) {
      str += single[hundred] + ' Hundred';
    }
    if (rest > 0) {
      if (str !== '') str += ' ';
      str += convertTwoDigits(rest);
    }
    return str;
  }

  let result = '';

  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  if (crore > 0) {
    result += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertThreeDigits(remainder);
  }

  return (result.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

module.exports = { numberToWordsIndian };
