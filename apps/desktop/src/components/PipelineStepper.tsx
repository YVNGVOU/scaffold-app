const PASSTHROUGH_STAGES = new Set(['critiquePassthrough', 'conflictPassthrough']);

interface Props {
  stageNames: readonly string[];
  activeIndex: number; // -1 = idle, >= stageNames.length = done
  running: boolean;
}

export function PipelineStepper({ stageNames, activeIndex, running }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 var(--sv-space-4)', gap: 0 }}>
      {stageNames.map((name, i) => {
        const isPassthrough = PASSTHROUGH_STAGES.has(name);
        const isDone = i < activeIndex || (!running && activeIndex >= stageNames.length);
        const isActive = running && i === activeIndex;
        let color = 'var(--sv-hairline-strong)';
        if (isPassthrough) color = 'var(--sv-ink-soft)';
        if (isDone) color = isPassthrough ? 'var(--sv-ink-soft)' : 'var(--sv-ink)';
        if (isActive) color = 'var(--sv-burgundy)';

        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: isDone || isActive ? color : 'transparent',
                  border: `1px solid ${color}`,
                  transition: 'background 150ms ease, border-color 150ms ease',
                  boxShadow: isActive ? `0 0 0 3px color-mix(in srgb, ${color} 25%, transparent)` : 'none',
                }}
              />
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color,
                  fontStyle: isPassthrough ? 'italic' : 'normal',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {name}
              </div>
            </div>
            {i < stageNames.length - 1 && (
              <div style={{ flex: 1, height: 1, background: 'var(--sv-hairline)', margin: '0 6px 14px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
