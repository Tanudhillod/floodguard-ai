export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL' | 'WARNING' | 'OPEN' | 'NEAR CAPACITY' | 'FULL' | 'EMERGENCY'
export type View = 'Dashboard' | 'Drone Intelligence' | 'SOS Requests' | 'Shelters' | 'Risk Analysis' | 'Budget'

export const navItems: { label: View; icon: string }[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard' },
  { label: 'Drone Intelligence', icon: 'ScanLine' },
  { label: 'SOS Requests', icon: 'Siren' },
  { label: 'Shelters', icon: 'House' },
  { label: 'Risk Analysis', icon: 'Activity' },
  { label: 'Budget', icon: 'WalletCards' },
]

export const kpis = [
  { label: 'Flood Risk', value: '82%', meta: 'High risk', tone: 'critical', icon: 'Waves' },
  { label: 'Active SOS', value: '34', meta: '8 critical', tone: 'high', icon: 'Siren' },
  { label: 'People Detected', value: '127', meta: '+18 today', tone: 'medium', icon: 'Users' },
  { label: 'Rescue Teams', value: '08', meta: '6 responding', tone: 'good', icon: 'ShieldPlus' },
  { label: 'Available Shelters', value: '12', meta: '3 near capacity', tone: 'neutral', icon: 'House' },
  { label: 'Critical Alerts', value: '05', meta: '+2 this hour', tone: 'warning', icon: 'BellRing' },
]

export const sensors = [
  { name: 'Water Level', value: '1.82', unit: 'm', status: 'HIGH', data: [18, 24, 20, 34, 31, 48, 62, 72] },
  { name: 'Rainfall', value: '72', unit: 'mm', status: 'WARNING', data: [22, 28, 34, 29, 45, 42, 61, 72] },
  { name: 'Temperature', value: '28', unit: '°C', status: 'NORMAL', data: [62, 58, 61, 56, 59, 57, 55, 58] },
  { name: 'Humidity', value: '91', unit: '%', status: 'HIGH', data: [70, 74, 76, 78, 83, 86, 88, 91] },
  { name: 'Water Flow', value: '3.4', unit: 'm/s', status: 'CRITICAL', data: [20, 24, 30, 28, 41, 52, 64, 80] },
]

export const sos = [
  { id: 'SOS-1024', location: 'Yamuna Bank', people: 5, priority: 'CRITICAL', time: '2 min ago', status: 'Pending', factors: 'Rising water · Elderly person' },
  { id: 'SOS-1025', location: 'Laxmi Nagar', people: 2, priority: 'HIGH', time: '5 min ago', status: 'Rescue Assigned', factors: 'No safe exit route' },
  { id: 'SOS-1026', location: 'Mayur Vihar', people: 1, priority: 'MEDIUM', time: '8 min ago', status: 'Pending', factors: 'Water at 1.4m' },
  { id: 'SOS-1027', location: 'Shahdara', people: 7, priority: 'HIGH', time: '11 min ago', status: 'Responding', factors: 'Family trapped' },
  { id: 'SOS-1028', location: 'Preet Vihar', people: 4, priority: 'CRITICAL', time: '16 min ago', status: 'Pending', factors: 'Electrical hazard nearby' },
]

export const alerts = [
  { severity: 'CRITICAL', title: 'Rapid water-level increase detected', location: 'Yamuna Bank', time: '2 min ago', action: 'Deploy rescue team to affected zone.' },
  { severity: 'HIGH', title: 'Heavy rainfall detected', location: 'East Delhi sensor grid', time: '8 min ago', action: 'Review flood-risk assessment.' },
  { severity: 'WARNING', title: 'Shelter approaching capacity', location: 'Community Shelter A', time: '14 min ago', action: 'Prepare overflow shelter B.' },
]

export const shelters = [
  { name: 'Community Shelter A', location: 'Mayur Vihar', capacity: 500, occupancy: 372, status: 'OPEN', availableResources: 'Water, food, medical kits', requiredResources: 'Blankets, power backup' },
  { name: 'Relief Center B', location: 'Laxmi Nagar', capacity: 300, occupancy: 284, status: 'NEAR CAPACITY', availableResources: 'Food, cots', requiredResources: 'Fuel, extra tents' },
  { name: 'School Shelter C', location: 'Shahdara', capacity: 250, occupancy: 250, status: 'FULL', availableResources: 'Medical set, sanitation', requiredResources: 'Emergency transport' },
  { name: 'Emergency Hub D', location: 'Yamuna Bank', capacity: 180, occupancy: 42, status: 'EMERGENCY', availableResources: 'Boats, first aid', requiredResources: 'Drone support, supplies' },
]

export const resources = [
  ['Drinking Water', '1,200 L', '2,500 L', 'SHORTAGE'],
  ['Food Packets', '850', '1,800', 'SHORTAGE'],
  ['Blankets', '2,400', '2,000', 'HEALTHY'],
  ['Medical Kits', '75', '160', 'LOW'],
  ['Rescue Equipment', '48', '40', 'HEALTHY'],
]

export const budget = [
  { category: 'Rescue operations', allocated: 42000, spent: 28700, status: 'On track' },
  { category: 'Drone deployment', allocated: 26000, spent: 21850, status: 'Monitoring' },
  { category: 'Medical supplies', allocated: 18000, spent: 14650, status: 'Stable' },
  { category: 'Shelter logistics', allocated: 22000, spent: 19400, status: 'At risk' },
  { category: 'Emergency transport', allocated: 14000, spent: 6100, status: 'Healthy' },
]

export const chart = [38, 45, 42, 55, 48, 64, 61, 72, 68, 82]
export const missions = [
  ['DG-024', 'Yamuna Flood Zone', 'Completed', '23'],
  ['DG-023', 'East Delhi', 'Processing', '17'],
  ['DG-022', 'Shahdara District', 'Completed', '31'],
]

export const riskIndicators = [
  { label: 'Rising water level', value: '1.82m', tone: 'critical' },
  { label: 'Heavy rainfall', value: '72 mm/h', tone: 'warning' },
  { label: 'Flow rate', value: '3.4 m/s', tone: 'high' },
  { label: 'Drainage capacity', value: '61%', tone: 'medium' },
]

export const droneAnalysis = {
  confidence: 96,
  peopleDetected: 23,
  critical: 8,
  high: 7,
  medium: 5,
  recommendation: 'Prioritize rescue route via YB-12 corridor.',
}
