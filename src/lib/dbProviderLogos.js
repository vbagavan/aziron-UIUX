import { getDatabaseProvider } from "@/data/addSourceCatalog";

/** Brand logo paths for database providers (served from /public). */
export const DB_PROVIDER_LOGOS = {
  postgresql: "/logos/providers/postgresql.svg",
  mysql: "/logos/providers/mysql.svg",
  mongodb: "/logos/providers/mongodb.svg",
  sqlserver: "/logos/providers/sqlserver.svg",
  oracle: "/logos/providers/oracle.svg",
  snowflake: "/logos/providers/snowflake.svg",
  redshift: "/logos/providers/redshift.svg",
  databricks: "/logos/providers/databricks.svg",
  bigquery: "/logos/providers/bigquery.svg",
};

export function getDbProviderLogo(providerId) {
  return DB_PROVIDER_LOGOS[providerId] ?? null;
}

export function getDbProviderMeta(providerId) {
  return getDatabaseProvider(providerId);
}
