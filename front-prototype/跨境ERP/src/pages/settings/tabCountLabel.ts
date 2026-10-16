/** Demo 列表 Tab 计数：>99 显示 99+ */
export function tabCountLabel(count: number): string {
  return count > 99 ? '99+' : String(count)
}
