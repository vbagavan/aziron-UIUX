import { CloudAddFilesDialog } from "@/components/features/knowledge/cloud/CloudAddFilesDialog";

export function GoogleDriveAddFilesDialog(props) {
  return <CloudAddFilesDialog provider="google-drive" {...props} />;
}
