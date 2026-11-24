import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, CircleAlert, CircleX, FileUp, Info, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox, Confirm, Input, Switch, Tabs, TabsList, TabsTrigger, Textarea, Tooltip } from '@/components/ui/controls';
import { Dialog, DialogContent, DialogTrigger, SheetContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimBadge } from '@/components/panels/parts';
import { useApp } from '@/state/app-state';
import { ARMS, QA, QB, SECTIONS_A, SECTIONS_B, type Question } from '@/lib/questions';
import { has, SOURCE_NAME, type Form, type Row, type Site } from '@/lib/survey';
import { answerText, importCSV, type ImportResult } from '@/lib/csv';
import { cn } from '@/lib/utils';
import { Empty, PageHeader } from './section-page';

const PAGE = 20;
const FORM_NAME: Record<Form, string> = { A: 'Form A, operators', B: 'Form B, road users' };

function ImportDialog({ form: initial }: { form: Form }) {
  const { updateMine, mine, setSource } = useApp();
  const [open, setOpen] = useState(false), [form, setForm] = useState<Form>(initial), [site, setSite] = useState<Site | 'file'>('file'), [replace, setReplace] = useState(true), [text, setText] = useState(''), [over, setOver] = useState(false), [result, setResult] = useState<ImportResult | null>(null);
  const run = (csv: string) => {
    const r = importCSV(csv, form, site === 'file' ? '' : site);
    setResult(r);
    if (!r.ok) return;
    updateMine(form, replace ? r.rows : [...mine[form], ...r.rows]);
    setSource('mine');
    toast.success(`${r.rows.length} responses imported and analysed`, { description: `Form ${form}: matched ${r.matched} of ${r.total} questions` });
  };
  const read = (f?: File) => { if (!f) return; const rd = new FileReader(); rd.onload = () => run(String(rd.result)); rd.readAsText(f); };
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setForm(initial); setResult(null); } }}>
      <DialogTrigger asChild><Button><Upload />Import CSV</Button></DialogTrigger>
      <DialogContent title="Import Google Forms responses" description="In the form open Responses, then the three-dot menu, then Download responses (.csv).">
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">Form
              <Select value={form} onValueChange={(v) => { setForm(v as Form); setResult(null); }}><SelectTrigger aria-label="Form"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">Form A, operators</SelectItem><SelectItem value="B">Form B, road users</SelectItem></SelectContent></Select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">Site for these rows
              <Select value={site} onValueChange={(v) => setSite(v as Site | 'file')}><SelectTrigger aria-label="Site"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="file">Read from file</SelectItem><SelectItem value="U1">All rows are U1</SelectItem><SelectItem value="U2">All rows are U2</SelectItem></SelectContent></Select>
            </label>
          </div>
          <label className="flex items-center gap-3 text-sm"><Switch checked={replace} onCheckedChange={setReplace} />Replace the Form {form} responses already imported ({mine[form].length})</label>
          <label
            onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files[0]); }}
            className={cn('flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-input px-6 py-8 text-center text-sm transition-colors focus-within:border-ring hover:bg-muted', over && 'border-ring bg-primary-soft')}
          >
            <FileUp className="size-7 text-primary" /><span><b className="font-semibold">Choose a CSV file</b> or drop it here</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { read(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Paste CSV text instead</summary><Textarea className="mt-2 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} aria-label="CSV text" /><Button size="sm" className="mt-2" disabled={!text.trim()} onClick={() => run(text)}>Import pasted text</Button></details>
          {result && (
            <ul className="flex flex-col gap-1.5 rounded-lg bg-muted p-3 text-[13px]" aria-live="polite">
              {result.ok && <li className="flex gap-2 font-medium"><Info className="mt-0.5 size-4 shrink-0 text-success" />{result.rows.length} responses imported; matched {result.matched} of {result.total} questions.</li>}
              {result.messages.map((m) => <li key={m.text} className="flex gap-2">{m.level === 'error' ? <CircleX className="mt-0.5 size-4 shrink-0 text-danger" /> : m.level === 'warn' ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" /> : <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}{m.text}</li>)}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const NONE = '-';
function RowEditor({ form, row, onSave, onClose }: { form: Form; row: Row; onSave: (r: Row) => void; onClose: () => void }) {
  const [d, setD] = useState<Row>({ ...row }), Q = (form === 'A' ? QA : QB).filter((q) => !q.hide), names = form === 'A' ? SECTIONS_A : SECTIONS_B;
  const set = (k: string, v: unknown) => setD((p) => { const n = { ...p }; if (v === undefined || v === '') delete n[k]; else n[k] = v; return n; });
  const pick = (id: string, label: string, value: string | undefined, options: [string, string][], on: (v: string | undefined) => void) => (
    <Select value={value ?? NONE} onValueChange={(v) => on(v === NONE ? undefined : v)}><SelectTrigger aria-label={label} id={id} className="w-full font-normal"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>No answer</SelectItem>{options.map(([v, t]) => <SelectItem key={v} value={v}>{t}</SelectItem>)}</SelectContent></Select>
  );
  const control = (q: Question) =>
    q.multi ? (
      <div className="flex flex-col gap-1.5 font-normal">{q.o!.map((o, i) => { const v: number[] = d[q.id] ?? []; return <label key={o} className="flex items-center gap-2 text-sm"><Checkbox checked={v.includes(i)} onCheckedChange={(c) => set(q.id, c ? [...v, i].sort((a, b) => a - b) : v.filter((x) => x !== i))} />{o}</label>; })}</div>
    ) : q.num ? <Input type="number" min={0} value={d[q.id] ?? ''} aria-label={q.s} onChange={(e) => set(q.id, e.target.value === '' ? undefined : Number(e.target.value))} />
      : q.txt ? <Textarea value={d[q.id] ?? ''} aria-label={q.s} onChange={(e) => set(q.id, e.target.value)} />
        : pick(q.id, q.s, has(d[q.id]) ? String(d[q.id]) : undefined, q.o!.map((o, i) => [String(i), o]), (v) => set(q.id, v === undefined ? undefined : Number(v)));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={`${Object.keys(row).length ? 'Edit' : 'Add'} response`} description={FORM_NAME[form]}>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-5 grid grid-cols-2 gap-3 text-sm font-medium">
            <div className="flex flex-col gap-1.5">Site{pick('site', 'Site', d.site, [['U1', 'U1'], ['U2', 'U2']], (v) => set('site', v))}</div>
            <div className="flex flex-col gap-1.5">Arm{pick('arm', 'Arm', has(d.arm) ? String(d.arm) : undefined, ARMS.map((a, i) => [String(i), a]), (v) => set('arm', v === undefined ? undefined : Number(v)))}</div>
          </div>
          {Object.entries(names).map(([k, t]) => (
            <fieldset key={k} className="mb-6"><legend className="mb-3 text-[13px] font-medium text-primary">{t}</legend>
              <div className="flex flex-col gap-4">{Q.filter((q) => q.sec === k).map((q) => <div key={q.id} className="flex flex-col gap-1.5 text-sm font-medium"><span><span className="text-muted-foreground">Q{q.n}</span> {q.t}</span>{control(q)}</div>)}</div>
            </fieldset>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(d)}>Save response</Button></div>
      </SheetContent>
    </Dialog>
  );
}

export function ResponsesPage() {
  const { source, responses, mine, updateMine, clearMine, analysis: a } = useApp();
  const [form, setForm] = useState<Form>('A'), [find, setFind] = useState(''), [page, setPage] = useState(0), [sort, setSort] = useState<{ id: string; dir: 1 | -1 } | null>(null), [edit, setEdit] = useState<number | null>(null);
  const editable = source === 'mine', Q = (form === 'A' ? QA : QB).filter((q) => !q.hide), all = responses[form];
  const rows = useMemo(() => {
    const needle = find.trim().toLowerCase();
    let list = all.map((r, i) => ({ r, i }));
    if (needle) list = list.filter(({ r }) => `${r.rid ?? ''} ${r.site ?? ''} ${Q.map((q) => answerText(q, r)).join(' ')}`.toLowerCase().includes(needle));
    if (sort) { const key = ({ r, i }: { r: Row; i: number }) => (sort.id === '#' ? i : sort.id === 'site' ? (r.site ?? '') : Array.isArray(r[sort.id]) ? r[sort.id].length : (r[sort.id] ?? -1)); list = [...list].sort((x, y) => { const p = key(x), q = key(y); return (p < q ? -1 : p > q ? 1 : x.i - y.i) * sort.dir; }); }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, find, sort, form]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE)), at = Math.min(page, pages - 1), view = rows.slice(at * PAGE, at * PAGE + PAGE);
  const head = (id: string, label: string, tip?: string) => {
    const on = sort?.id === id, Icon = on ? (sort.dir === 1 ? ArrowUp : ArrowDown) : ChevronsUpDown;
    const btn = <button type="button" onClick={() => { setSort(on ? (sort.dir === 1 ? { id, dir: -1 } : null) : { id, dir: 1 }); setPage(0); }} className="flex items-center gap-1 font-medium hover:text-foreground">{label}<Icon className={cn('size-3', on ? 'text-primary' : 'opacity-50')} /></button>;
    return <th key={id} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className="sticky top-0 z-10 border-b bg-muted px-3 py-2 text-left text-xs whitespace-nowrap text-muted-foreground">{tip ? <Tooltip content={tip}>{btn}</Tooltip> : btn}</th>;
  };
  const save = (r: Row) => { const next = [...mine[form]]; if (edit! >= next.length) next.push({ consent: 0, ...r }); else next[edit!] = r; updateMine(form, next); setEdit(null); toast.success('Response saved'); };
  const cell = 'border-b px-3 py-2 whitespace-nowrap';
  return (
    <>
      <PageHeader route="responses" actions={<>
        {editable && (mine.A.length > 0 || mine.B.length > 0) && <Confirm trigger={<Button variant="outline"><Trash2 />Clear my responses</Button>} title="Delete all of my responses?" description="This removes every imported and typed response from this browser. Sets 1 and 2 are not affected." action="Delete all" onConfirm={() => { clearMine(); toast.success('My responses cleared'); }} />}
        {editable && <Button variant="outline" onClick={() => setEdit(mine[form].length)}><Plus />Add response</Button>}
        <ImportDialog form={form} />
      </>} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={form} onValueChange={(v) => { setForm(v as Form); setPage(0); setSort(null); }}><TabsList><TabsTrigger value="A">Form A <Badge>{responses.A.length}</Badge></TabsTrigger><TabsTrigger value="B">Form B <Badge>{responses.B.length}</Badge></TabsTrigger></TabsList></Tabs>
        <label className="relative w-72 max-w-full"><span className="sr-only">Search responses</span><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search answers and comments" value={find} onChange={(e) => { setFind(e.target.value); setPage(0); }} /></label>
      </div>
      {!all.length ? (
        <Empty title={`No Form ${form} responses`} text={editable ? 'Import the CSV that Google Forms exports, or add a response by hand. Your responses stay in this browser.' : 'This set has no responses for this form.'} action={editable ? <ImportDialog form={form} /> : undefined} />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5 text-[13px] text-muted-foreground"><span>{SOURCE_NAME[source]}, {FORM_NAME[form]}.</span><span>{editable ? 'Editable.' : 'Read-only.'} Hover a heading to see the question; click to sort.</span>{a.sim && <span className="ml-auto"><SimBadge /></span>}</div>
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead><tr>{head('#', '#')}{!editable && head('rid', 'Record')}{head('site', 'Site')}{Q.map((q) => head(q.id, `Q${q.n} ${q.s}`, q.t))}{head('consent', 'Consent')}{editable && <th className="sticky top-0 right-0 z-20 border-b bg-muted" aria-label="Actions" />}</tr></thead>
              <tbody>
                {view.map(({ r, i }) => (
                  <tr key={i} className="hover:bg-muted/60">
                    <td className={cn(cell, 'tnum text-muted-foreground')}>{i + 1}</td>{!editable && <td className={cn(cell, 'font-mono text-xs')}>{r.rid}</td>}<td className={cell}>{r.site ?? '–'}</td>
                    {Q.map((q) => <td key={q.id} className={cn(cell, 'max-w-72 truncate')} title={answerText(q, r)}>{answerText(q, r) || <span className="text-muted-foreground">–</span>}</td>)}
                    <td className={cell}>{r.consent === 1 ? <Badge variant="warning">Declined</Badge> : 'Yes'}</td>
                    {editable && <td className="sticky right-0 border-b bg-card px-2"><span className="flex"><Button variant="ghost" size="icon-sm" aria-label={`Edit response ${i + 1}`} onClick={() => setEdit(i)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Delete response ${i + 1}`} onClick={() => { updateMine(form, mine[form].filter((_, k) => k !== i)); toast.success('Response deleted'); }}><Trash2 /></Button></span></td>}
                  </tr>
                ))}
                {!view.length && <tr><td colSpan={Q.length + 5} className="px-4 py-10 text-center text-muted-foreground">No response matches “{find}”.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] text-muted-foreground">
            <span className="tnum">{rows.length ? `${at * PAGE + 1}–${Math.min(rows.length, (at + 1) * PAGE)} of ${rows.length}` : '0 responses'}</span>
            <div className="flex items-center gap-1.5"><Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={at === 0} onClick={() => setPage(at - 1)}><ChevronLeft /></Button><span className="tnum px-1">Page {at + 1} of {pages}</span><Button variant="outline" size="icon-sm" aria-label="Next page" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}><ChevronRight /></Button></div>
          </div>
        </Card>
      )}
      {edit != null && editable && <RowEditor form={form} row={mine[form][edit] ?? {}} onSave={save} onClose={() => setEdit(null)} />}
    </>
  );
}
