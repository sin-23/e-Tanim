// "09:41 today" or "09:41, Nov 2" in the viewer's own time zone.
export function formatDateTime(ms, { seconds = false } = {}) {
  const d = new Date(ms)
  const time = d.toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', ...(seconds && { second: '2-digit' }),
  })
  return d.toDateString() === new Date().toDateString()
    ? `${time} today`
    : `${time}, ${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
}