/** Map validation error messages to metadata field keys */
const ERROR_TO_FIELD = {
  "Track Name is required.": "track_name",
  "Customer Name is required.": "customer_name",
  "Engagement Type is required.": "engagement_type",
  "SOW Start Date is required.": "sow_start_date",
  "SOW End Date is required.": "sow_end_date",
};

/**
 * @param {string[]} errors
 * @returns {Set<string>}
 */
export function invalidMetadataFieldKeys(errors) {
  const keys = new Set();
  for (const message of errors) {
    const key = ERROR_TO_FIELD[message];
    if (key) keys.add(key);
  }
  return keys;
}

/**
 * @param {string[]} errors
 * @param {Record<string, string>} values
 * @returns {Set<string>}
 */
export function invalidQuickFormFieldKeys(errors, values) {
  const keys = invalidMetadataFieldKeys(errors);
  if (errors.some((e) => e.includes("End Date must be"))) {
    keys.add("sow_start_date");
    keys.add("sow_end_date");
  }
  if (!values.track_name?.trim()) keys.add("track_name");
  if (!values.customer_name?.trim()) keys.add("customer_name");
  if (!values.engagement_type) keys.add("engagement_type");
  if (!values.sow_start_date) keys.add("sow_start_date");
  if (!values.sow_end_date) keys.add("sow_end_date");
  return keys;
}
