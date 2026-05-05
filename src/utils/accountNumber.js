export function generateAccountNumber() {
  // Generate 10-digit account number starting with any digit 1-9
  // Format: random 10 digits
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}
