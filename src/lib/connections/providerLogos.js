/** Brand logo paths for connection providers (served from /public). */
export const PROVIDER_LOGOS = {
  'google-drive': '/logos/connectors/google-drive.svg',
  slack: '/logos/providers/slack.svg',
  github: '/logos/providers/github.svg',
  notion: '/logos/providers/notion.svg',
  jira: '/logos/providers/jira.svg',
  hubspot: '/logos/providers/hubspot.svg',
  salesforce: '/logos/providers/salesforce.svg',
  openai: '/logos/providers/openai.svg',
  anthropic: '/logos/providers/anthropic.svg',
  'aws-s3': '/logos/providers/aws-s3.svg',
  pinecone: '/logos/providers/pinecone.svg',
  stripe: '/logos/providers/stripe.svg',
  datadog: '/logos/providers/datadog.svg',
  databricks: '/logos/providers/databricks.svg',
  'custom-mcp': '/logos/providers/custom-mcp.svg',
}

export function getProviderLogo(providerId) {
  return PROVIDER_LOGOS[providerId] ?? null
}
