// Question definitions. They follow the two live Google Forms, except Form A Q15 (report wording)
// and Form B Q6–Q11 (printed questionnaire), which the live forms cannot supply at unsignalised sites.
export interface Question {
  id: string;
  /** question number on the form */
  n?: number;
  /** form section */
  sec: string;
  /** short name */
  s: string;
  /** full question text */
  t: string;
  /** answer options */
  o?: string[];
  /** alternative option wording accepted on import */
  m?: string[];
  /** wording used to find the CSV column */
  h: RegExp;
  /** indices of options that point to obstruction, risk or delay */
  bad?: number[];
  ord?: 1;
  multi?: 1;
  num?: 1;
  txt?: 1;
  /** asked of IPT passengers and transfers only */
  ipt?: 1;
  /** has an "Other, please specify" column */
  x?: 1;
  /** optional on the form */
  opt?: 1;
  hide?: 1;
  note?: string;
}

export const QA: Question[] = [
 {id:'A1',n:1,sec:'A',s:'IPT vehicle type',t:'Type of IPT vehicle you operate',o:['Auto-rickshaw','Shared auto','E-rickshaw','Taxi / cab','App-based auto / cab','Other'],h:/type of ipt vehicle/i,x:1},
 {id:'A2',n:2,sec:'A',s:'Service type',t:'Type of service you usually provide',o:['Shared, fixed route','Hired, point-to-point','App bookings','Mixed'],h:/type of service/i},
 {id:'A3',n:3,sec:'A',s:'Experience',t:'Experience as an IPT operator',o:['Less than 1 year','1–3 years','4–6 years','7–10 years','More than 10 years'],h:/experience/i,ord:1},
 {id:'A4',n:4,sec:'A',s:'Operating hours',t:'Operating hours per day',o:['Less than 6 hours','6–8 hours','8–10 hours','10–12 hours','More than 12 hours'],h:/operating hours/i,ord:1},
 {id:'A5',n:5,sec:'A',s:'Vehicle ownership',t:'Vehicle ownership',o:['Own','Rented / daily payment','Fleet / aggregator'],h:/ownership/i},
 {id:'A6',n:6,sec:'B',s:'Stop frequency near the intersection',t:'How often do you stop to pick up or drop off passengers near the intersection?',o:['Never','Rarely','Sometimes','Often','Very often'],h:/how often do you stop/i,ord:1,bad:[3,4]},
 {id:'A7',n:7,sec:'B',s:'Reasons for stopping',t:'Main reasons for stopping near the intersection (select all that apply)',o:['Boarding','Alighting','Calling / searching for passengers','Waiting to fill seats','Passenger request','Other'],h:/main reasons/i,multi:1,bad:[2,3],x:1},
 {id:'A8',n:8,sec:'B',s:'Usual stop location',t:'Where do you usually stop?',o:['Before the intersection (approach)','After the intersection (exit)','At the corner','Designated stop / stand','Wherever the passenger asks'],h:/where do you usually stop/i,bad:[2,4]},
 {id:'A9',n:9,sec:'B',s:'Stop distance',t:'Usual distance of your stop from the intersection',o:['Less than 25 m','25–50 m','50–100 m','More than 100 m','Not sure'],h:/usual distance/i,bad:[0,1]},
 {id:'A10',n:10,sec:'B',s:'Position while stopped',t:'Usual position of your vehicle while stopped',o:['Fully at kerb / road edge','Partly in traffic lane','Fully in traffic lane','Depends on space'],h:/usual position/i,bad:[1,2]},
 {id:'A11',n:11,sec:'B',s:'Duration of one stop',t:'Usual duration of one pick-up / drop-off stop',o:['Less than 10 seconds','10–20 seconds','21–30 seconds','31–60 seconds','More than 60 seconds'],h:/usual duration/i,ord:1,bad:[3,4]},
 {id:'A12',n:12,sec:'B',s:'Passengers boarding per stop',t:'Passengers usually boarding and alighting in one stop — Boarding (number of persons)',num:1,h:/usually boarding/i},
 {id:'A13',n:13,sec:'B',s:'Fare payment',t:'How is the fare usually paid?',o:['Cash at boarding','Cash at alighting','UPI / QR','App payment'],h:/fare/i},
 {id:'A14',n:14,sec:'B',s:'Waiting for passengers',t:'When seats are empty, how long do you wait near the intersection for passengers?',o:['Do not wait','Less than 30 seconds','30–60 seconds','1–2 minutes','More than 2 minutes'],h:/seats are empty/i,ord:1,bad:[2,3,4]},
 {id:'A15',n:15,sec:'B',s:'Shifts stop in heavy traffic',t:'When traffic is heavy, do you shift your stop further away from the junction?',o:['Never','Rarely','Sometimes','Often','Always'],h:/traffic is heavy|shift your stop/i,ord:1,note:'Report wording. The live form asks about stopping at a red signal.'},
 {id:'A16',n:16,sec:'B',s:'Peak-hour stop duration',t:'During peak hours, your stopping duration usually',o:['Decreases','No change','Increases','Depends on demand'],h:/peak hours/i,bad:[2]},
 {id:'A17',n:17,sec:'C',s:'Effect on vehicles behind',t:'Does your stopping near the intersection affect vehicles behind you?',o:['Not at all','Slightly','Moderately','Highly','Very highly'],h:/affect vehicles behind/i,ord:1,bad:[3,4]},
 {id:'A18',n:18,sec:'C',s:'What happens behind',t:'What usually happens to vehicles behind you?',o:['No effect','They slow down','They change lane / overtake','A short queue forms','Queue reaches the intersection'],h:/what usually happens/i,ord:1,bad:[3,4]},
 {id:'A19',n:19,sec:'C',s:'Fined or warned',t:'Have you been fined or warned by traffic police for stopping here?',o:['Never','Once or twice','Many times'],h:/fined|warned/i,ord:1},
 {id:'A20',n:20,sec:'C',s:'No proper stopping place',t:'“Lack of a proper stopping place forces IPT vehicles to stop in the traffic lane.”',o:['Strongly disagree','Disagree','Neutral','Agree','Strongly agree'],h:/lack of a proper/i,ord:1,bad:[3,4]},
 {id:'A21',n:21,sec:'D',s:'Designated stand nearby',t:'Is there a designated IPT stopping place / stand near the intersection?',o:['Yes','No','Not sure'],h:/is there a designated/i,bad:[1]},
 {id:'A22',n:22,sec:'D',s:'Support for a designated-bay rule',t:'Would you support a rule to stop only at a designated IPT bay?',o:['Strongly oppose','Oppose','Neutral','Support','Strongly support'],h:/support a rule/i,ord:1},
 {id:'A23',n:23,sec:'D',s:'Acceptable bay distance',t:'Maximum distance from the intersection at which a designated bay is acceptable to you',o:['Less than 25 m','25–50 m','50–75 m','75–100 m','More than 100 m'],h:/maximum distance/i,ord:1},
 {id:'A24',n:24,sec:'D',s:'Most practical arrangement',t:'Most practical arrangement to reduce obstruction near the intersection',o:['Marked IPT bay','Shift stop away from junction','No-stopping zone near junction','Time limit on stopping','Better enforcement / signage','Other'],h:/most practical/i,x:1},
 {id:'A25',n:25,sec:'D',s:'Difficulty or suggestion',t:'Main difficulty, or your suggestion, if stopping is shifted away from the intersection',txt:1,h:/main difficulty/i}];

export const QB: Question[] = [
 {id:'B1',n:1,sec:'A',s:'Using the intersection as',t:'How are you using the intersection now?',o:['Pedestrian only','IPT passenger','Bus / BRTS + IPT transfer','Other road user (driver / rider)'],h:/how are you using/i},
 {id:'B2',n:2,sec:'A',s:'Age group',t:'Age group',o:['Less than 18','18–25','26–35','36–45','46–60','More than 60'],h:/age group/i,ord:1},
 {id:'B3',n:3,sec:'A',s:'Gender',t:'Gender (optional)',o:['Male','Female','Other','Prefer not to say'],h:/gender/i,opt:1},
 {id:'B4',n:4,sec:'A',s:'Trip purpose',t:'Purpose of the trip',o:['Work','Education','Shopping','Medical / personal','Social','Other'],h:/purpose of/i,x:1},
 {id:'B5',n:5,sec:'A',s:'Use of the intersection',t:'How often do you use the intersection?',o:['First time','Occasionally','1–2 days a week','3–5 days a week','Daily'],h:/how often do you use/i,ord:1},
 {id:'BR',hide:1,sec:'A',s:'Routing check',t:'Survey routing check (repeat your Q1 answer)',o:['Pedestrian only','IPT passenger','Bus / BRTS + IPT transfer','Other road user (driver / rider)'],h:/routing check/i},
 {id:'B6',n:6,sec:'B',s:'IPT type used',t:'IPT type used for this trip',o:['Auto-rickshaw','Shared auto','E-rickshaw','Taxi / cab','App-based auto / cab'],h:/ipt type/i,ipt:1},
 {id:'B7',n:7,sec:'B',s:'Boarding or alighting point',t:'Where did you board or alight?',o:['Before the intersection','After the intersection','At the corner','Designated stop / stand','In the middle of the road'],h:/where.*board/i,ipt:1,bad:[2,4]},
 {id:'B8',n:8,sec:'B',s:'Reason for that point',t:'Why did you board or alight there?',o:['Nearest to my destination',"Driver's choice",'No designated stop','Transfer to bus','Safer place','Other'],h:/why.*board/i,ipt:1,x:1},
 {id:'B9',n:9,sec:'B',s:'Waiting time for IPT',t:'How long did you wait to get an IPT vehicle?',o:['Less than 1 min','1–3 min','3–5 min','5–10 min','More than 10 min'],m:['< 1 min','1–3 min','3–5 min','5–10 min','> 10 min'],h:/wait to get|waiting time/i,ipt:1,ord:1},
 {id:'B10',n:10,sec:'B',s:'How long the vehicle stopped',t:'How long did the vehicle remain stopped for your boarding / alighting?',o:['Less than 10 s','10–20 s','21–30 s','31–60 s','More than 60 s','Not sure'],m:['< 10 s','10–20 s','21–30 s','31–60 s','> 60 s','Not sure'],h:/remain stopped|stays? stopped/i,ipt:1,bad:[3,4]},
 {id:'B11',n:11,sec:'B',s:'Stopped in the traffic lane',t:'Did the vehicle stop in the traffic lane?',o:['No, at the kerb','Yes, partly in lane','Yes, fully in lane','Not sure'],h:/stop in the traffic lane/i,ipt:1,bad:[1,2]},
 {id:'B12',n:12,sec:'C',s:'Crossed on foot today',t:'Did you cross the intersection on foot today?',o:['Yes','No'],h:/on foot/i},
 {id:'B13',n:13,sec:'C',s:'Usual crossing place',t:'Where do you usually cross?',o:['Marked zebra crossing','Corner of the intersection','Between vehicles','Away from the junction'],h:/usually cross/i,bad:[2]},
 {id:'B14',n:14,sec:'C',s:'Ease of crossing',t:'How easy is it to cross here?',o:['Very easy','Easy','Moderate','Difficult','Very difficult'],h:/how easy/i,ord:1,bad:[3,4]},
 {id:'B15',n:15,sec:'C',s:'Stopped IPTs block path or view',t:'Do stopped IPT vehicles block your walking path, crossing or view of traffic?',o:['Never','Rarely','Sometimes','Often','Always'],h:/block/i,ord:1,bad:[3,4]},
 {id:'B16',n:16,sec:'C',s:'Near-miss while crossing',t:'Have you had a near-miss with a vehicle while crossing here?',o:['Never','Rarely','Sometimes','Often'],h:/near.?miss/i,ord:1,bad:[2,3]},
 {id:'B17',n:17,sec:'C',s:'Most difficult movement',t:'Which movement causes pedestrians the most difficulty?',o:['Left-turning vehicles','Right-turning vehicles','Through traffic','IPT stopping / starting','Buses','Other'],h:/movement causes/i,bad:[3],x:1},
 {id:'B18',n:18,sec:'C',s:'Feeling of safety',t:'How safe do you feel walking and crossing?',o:['Very safe','Safe','Neutral','Unsafe','Very unsafe'],h:/how safe/i,ord:1,bad:[3,4]},
 {id:'B19',n:19,sec:'D',s:'Delay faced',t:'How much delay did you face at the intersection?',o:['None','Less than 1 minute','1–2 minutes','2–5 minutes','More than 5 minutes'],m:['None','< 1 min','1–2 min','2–5 min','> 5 min'],h:/how much delay/i,ord:1,bad:[3,4]},
 {id:'B20',n:20,sec:'D',s:'Main causes of delay',t:'Main causes of delay (select at least two)',o:['Heavy traffic','IPT stopping','Bus stopping','Pedestrians crossing','Turning conflicts','Signal waiting','Parking / encroachment'],h:/causes of delay/i,multi:1,bad:[1]},
 {id:'B21',n:21,sec:'D',s:'IPT stopping adds travel time',t:'Does IPT stopping near the intersection increase your travel time?',o:['No','Slightly','Moderately','Significantly','Cannot say'],h:/travel time/i,bad:[2,3]},
 {id:'B22',n:22,sec:'E',s:'Would use a designated IPT point',t:'Would you board / alight at a designated IPT point slightly away from the intersection?',o:['Yes','No','Depends on distance and safety'],h:/designated ipt point/i},
 {id:'B23',n:23,sec:'E',s:'Acceptable walking distance',t:'Maximum walking distance you would accept to reach such a point',o:['Less than 30 m','30–50 m','51–100 m','More than 100 m'],m:['< 30 m','30–50 m','51–100 m','> 100 m'],h:/walking distance/i,ord:1},
 {id:'B24',n:24,sec:'E',s:'Most needed improvement',t:'Most needed improvement at the intersection',o:['Safe pedestrian crossing','Designated IPT bay','No-stopping zone near junction','Better signal / traffic control','Clear footpath / encroachment','Other'],h:/needed improvement/i,multi:1,x:1},
 {id:'B25',n:25,sec:'E',s:'Other suggestions',t:'Any other suggestion',txt:1,h:/suggestion/i}];

export const QSA: Record<string, Question> = Object.fromEntries(QA.map((q) => [q.id, q]));
export const QSB: Record<string, Question> = Object.fromEntries(QB.map((q) => [q.id, q]));

export const SECTIONS_A: Record<string, string> = {
  A: 'Operator profile', B: 'Stopping and passenger service', C: 'Effect on traffic', D: 'Management options',
};
export const SECTIONS_B: Record<string, string> = {
  A: 'Respondent and travel profile', B: 'IPT use', C: 'Walking and safety', D: 'Delay and congestion', E: 'Preferred arrangements',
};
export const ARMS = ['North', 'South', 'East', 'West'];
