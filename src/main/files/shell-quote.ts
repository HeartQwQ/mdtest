/** adb/hdc shell 路径引号 */
export function shellQuote(path: string): string {
  if (!/[\s'"\\$`!]/.test(path)) return path
  return `'${path.replace(/'/g, `'\\''`)}'`
}
