/** Demo 简化省市区级联 */
export const REGION_TREE: Record<string, Record<string, string[]>> = {
  广东省: {
    深圳市: ['南山区', '福田区', '宝安区'],
    东莞市: ['南城街道', '东城街道'],
    广州市: ['天河区', '越秀区'],
  },
  北京市: {
    北京市: ['朝阳区', '海淀区', '丰台区'],
  },
  四川省: {
    成都市: ['武侯区', '锦江区'],
  },
}

export const PROVINCES = Object.keys(REGION_TREE)

export function citiesOfProvince(province: string): string[] {
  if (!province || !REGION_TREE[province]) return []
  return Object.keys(REGION_TREE[province])
}

export function districtsOf(province: string, city: string): string[] {
  if (!province || !city) return []
  return REGION_TREE[province]?.[city] ?? []
}
