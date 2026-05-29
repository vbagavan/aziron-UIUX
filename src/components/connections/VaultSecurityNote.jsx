import { ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function VaultSecurityNote() {
  return (
    <Alert>
      <ShieldCheck />
      <AlertTitle>Aziron Vault</AlertTitle>
      <AlertDescription>
        Credentials are encrypted at rest and in transit. They are never exposed to LLMs, logs, or agent prompts.
      </AlertDescription>
    </Alert>
  )
}
