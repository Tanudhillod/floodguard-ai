export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL' | 'WARNING'
export type View = 'Dashboard' | 'Live Monitoring' | 'Drone Intelligence' | 'SOS & Rescue' | 'Shelters' | 'Resources' | 'Alerts' | 'Analytics'

export const navItems: { label: View; icon: string }[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard' }, { label: 'Live Monitoring', icon: 'Activity' },
  { label: 'Drone Intelligence', icon: 'ScanLine' }, { label: 'SOS & Rescue', icon: 'Siren' },
  { label: 'Shelters', icon: 'House' }, { label: 'Resources', icon: 'Boxes' },
  { label: 'Alerts', icon: 'BellRing' }, { label: 'Analytics', icon: 'ChartNoAxesCombined' },
]
export const kpis = [
  ['Flood Risk', '82%', 'HIGH', 'Trending up', 'Waves'], ['Active SOS', '34', '8 critical', '12% today', 'Siren'],
  ['People Detected', '127', 'Drone analysis', '+18 today', 'Users'], ['Rescue Operations', '8', '6 responding', '2 completed', 'Radio'],
  ['Available Shelters', '12', '3 near capacity', '86% network', 'House'], ['Critical Alerts', '5', 'Needs action', '+2 this hour', 'BellRing'],
]
export const sensors = [
  { name: 'Water Level', value: '1.82', unit: 'm', status: 'HIGH', data: [40, 44, 42, 52, 48, 63, 72, 82] },
  { name: 'Rainfall', value: '72', unit: 'mm', status: 'WARNING', data: [22, 28, 34, 29, 45, 42, 61, 72] },
  { name: 'Temperature', value: '28', unit: '°C', status: 'NORMAL', data: [62, 58, 61, 56, 59, 57, 55, 58] },
  { name: 'Humidity', value: '91', unit: '%', status: 'HIGH', data: [70, 74, 76, 78, 83, 86, 88, 91] },
  { name: 'Water Flow', value: '3.4', unit: 'm/s', status: 'CRITICAL', data: [20, 24, 30, 28, 41, 52, 64, 80] },
]
export const sos = [
  { id: 'SOS-1024', location: 'Yamuna Bank', people: 5, priority: 'CRITICAL', time: '2 min ago', status: 'Pending', factors: 'Rising water · Elderly person' },
  { id: 'SOS-1025', location: 'Laxmi Nagar', people: 2, priority: 'HIGH', time: '5 min ago', status: 'Rescue Assigned', factors: 'No safe exit' },
  { id: 'SOS-1026', location: 'Mayur Vihar', people: 1, priority: 'MEDIUM', time: '8 min ago', status: 'Pending', factors: 'Water at 1.4m' },
  { id: 'SOS-1027', location: 'Shahdara', people: 7, priority: 'HIGH', time: '11 min ago', status: 'Responding', factors: 'Family trapped' },
]
export const alerts = [
  { severity: 'CRITICAL', title: 'Rapid water-level increase detected', location: 'Yamuna Bank', time: '2 min ago', action: 'Deploy rescue team to affected zone.' },
  { severity: 'HIGH', title: 'Heavy rainfall detected', location: 'East Delhi sensor grid', time: '8 min ago', action: 'Review flood-risk assessment.' },
  { severity: 'WARNING', title: 'Shelter approaching capacity', location: 'Community Shelter A', time: '14 min ago', action: 'Prepare overflow shelter B.' },
]
export const shelters = [
  { name: 'Community Shelter A', location: 'Mayur Vihar', capacity: 500, occupancy: 372, status: 'OPEN' },
  { name: 'Relief Center B', location: 'Laxmi Nagar', capacity: 300, occupancy: 284, status: 'NEAR CAPACITY' },
  { name: 'School Shelter C', location: 'Shahdara', capacity: 250, occupancy: 250, status: 'FULL' },
  { name: 'Emergency Hub D', location: 'Yamuna Bank', capacity: 180, occupancy: 42, status: 'EMERGENCY' },
]
export const resources = [
  ['Drinking Water', '1,200 L', '2,500 L', 'SHORTAGE'], ['Food Packets', '850', '1,800', 'SHORTAGE'], ['Blankets', '2,400', '2,000', 'HEALTHY'], ['Medical Kits', '75', '160', 'LOW'], ['Rescue Equipment', '48', '40', 'HEALTHY']
]
export const chart = [38, 45, 42, 55, 48, 64, 61, 72, 68, 82]
export const missions = [['DG-024', 'Yamuna Flood Zone', 'Completed', '23'], ['DG-023', 'East Delhi', 'Processing', '17'], ['DG-022', 'Shahdara District', 'Completed', '31']]
