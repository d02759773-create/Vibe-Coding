/** 列表首次/刷新加载延迟，便于演示 Skeleton（Demo 列表 §2.7） */
const LIST_LOAD_DELAY_MS = 380

function hashQuery(): URLSearchParams {
  const hash = window.location.hash
  const qi = hash.indexOf('?')
  if (qi === -1) return new URLSearchParams()
  return new URLSearchParams(hash.slice(qi + 1))
}

/** 在 hash 路由加 `?listLoadError=1` 模拟接口失败 */
export function isSettingsListLoadErrorSimulated(): boolean {
  return hashQuery().get('listLoadError') === '1'
}

export async function withSettingsListLoading<T>(
  load: () => T,
): Promise<{ ok: true; value: T } | { ok: false }> {
  await new Promise((r) => setTimeout(r, LIST_LOAD_DELAY_MS))
  if (isSettingsListLoadErrorSimulated()) {
    return { ok: false }
  }
  return { ok: true, value: load() }
}
