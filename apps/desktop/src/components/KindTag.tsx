import type { RequirementKind } from '@lucid/schema';

export function KindTag({ kind }: { kind: RequirementKind }) {
  return <span className={`sv-kind-tag sv-kind-${kind}`}>{kind}</span>;
}
