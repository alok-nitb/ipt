import { ArrowLeftRight, ClipboardCheck, Database, FileText, Flag, Footprints, LayoutDashboard, Lightbulb, MapPinned, Route as RoadIcon, Sigma, ThumbsUp, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { Route } from '@/state/use-route';
export interface NavItem { route: Route; label: string; icon: LucideIcon; num?: number; heading: string; intro: string }
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Analysis', items: [
    { route: 'overview', label: 'Overview', icon: LayoutDashboard, heading: 'Overview', intro: 'Choose a data set. Everything on every page is analysed from the set you load.' },
    { route: 'conclusions', label: 'Conclusions', icon: Flag, heading: 'Conclusions', intro: 'Written findings by thesis objective, generated from the loaded responses.' },
    { route: 'compare', label: 'U1 and U2', icon: ArrowLeftRight, heading: 'Site comparison', intro: 'The two unsignalised study sites side by side.' },
  ] },
  { group: 'Objectives', items: [
    { route: 'stopping', label: 'Stopping', icon: MapPinned, num: 1, heading: 'Stopping characteristics', intro: 'Where, why and for how long IPT vehicles stop for passengers.' },
    { route: 'impact', label: 'Impact', icon: TriangleAlert, num: 2, heading: 'Traffic and pedestrian impact', intro: 'What stopping does to following traffic, walking and safety.' },
    { route: 'distance', label: 'Critical distance', icon: RoadIcon, num: 3, heading: 'Critical stopping distance', intro: 'How far from the junction operators and road users would accept a bay.' },
    { route: 'strategies', label: 'Strategies', icon: Lightbulb, num: 4, heading: 'Management strategies', intro: 'The measures operators and road users prefer.' },
    { route: 'acceptance', label: 'Acceptance', icon: ThumbsUp, num: 5, heading: 'Acceptance for decision support', intro: 'Support for a designated-bay rule and what it depends on.' },
  ] },
  { group: 'Evidence', items: [
    { route: 'form-a', label: 'Form A, operators', icon: FileText, heading: 'Form A: IPT operators', intro: 'Every question, with the distribution of answers.' },
    { route: 'form-b', label: 'Form B, road users', icon: Footprints, heading: 'Form B: road users and pedestrians', intro: 'Every question, with the distribution of answers.' },
    { route: 'tests', label: 'Statistical tests', icon: Sigma, heading: 'Statistical tests', intro: 'Associations, models, site tests and reliability in full.' },
    { route: 'checks', label: 'Data checks', icon: ClipboardCheck, heading: 'Data checks', intro: 'Consent, routing, missing answers and item quality.' },
    { route: 'responses', label: 'Responses', icon: Database, heading: 'Responses', intro: 'Browse the records, or import your own Google Forms export.' },
  ] },
];
export const NAV_ITEMS = NAV.flatMap((g) => g.items);
