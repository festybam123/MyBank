export function generateAccountNumber() {
  // Nigerian account numbers are 10 digits, starting with 10 for demo
  return '10' + Math.floor(100000000 + Math.random() * 900000000);
}
