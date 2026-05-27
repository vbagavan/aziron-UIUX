/** Small presentational pieces shared by kudos UI and blocks (avoids import cycles). */

export function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, color, size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: size * 0.35,
        fontWeight: 600,
        color: "var(--primary-foreground)",
        userSelect: "none",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export function SparkLogo({ size = 18 }) {
  const s = size;
  return (
    <svg
      width={s}
      height={Math.round(s * 1.09)}
      viewBox="0 0 22 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path d="M0 14L9 8.5V19.5L0 14Z" fill="var(--primary)" />
      <path d="M13 0L22 5.5V14.5L13 9V0Z" fill="var(--primary)" />
      <path d="M13 15L22 9.5V20.5L13 15Z" fill="var(--chart-chart-2)" />
    </svg>
  );
}
