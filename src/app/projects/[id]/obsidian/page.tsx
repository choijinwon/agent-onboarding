import { ObsidianVaultClient } from "./vault-client";

export default async function ObsidianProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ObsidianVaultClient projectId={id} />;
}
