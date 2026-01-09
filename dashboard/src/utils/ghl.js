// GHL Configuration
export const GHL_LOCATION_ID = 'QcGz8iRwxjyvu5d2UfVk';
export const GHL_BASE_URL = `https://app.gohighlevel.com/v2/location/${GHL_LOCATION_ID}/contacts/detail`;

/**
 * Generate GoHighLevel contact detail URL
 * @param {string} contactId - The GHL contact ID
 * @returns {string} Full URL to open contact in GHL
 */
export const getGhlContactUrl = (contactId) => {
  return `${GHL_BASE_URL}/${contactId}`;
};
