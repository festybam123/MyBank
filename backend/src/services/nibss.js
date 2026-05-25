export function verifyBVN(bvn) {
  if (!bvn || bvn.length !== 11) {
    return { success: false, message: 'Invalid BVN format' };
  }
  return { success: true, message: 'BVN verified' };
}

export function verifyNIN(nin) {
  if (!nin || nin.length !== 11) {
    return { success: false, message: 'Invalid NIN format' };
  }
  return { success: true, message: 'NIN verified' };
}