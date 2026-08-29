'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileSpreadsheet, Play, Download, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input, Field } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

function FileDrop({
  label,
  file,
  onFile,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-700">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
      >
        {file ? (
          <>
            <FileSpreadsheet className="mb-2 h-6 w-6 text-brand-600" />
            <span className="text-sm font-medium text-ink-800">{file.name}</span>
            <span className="text-xs text-ink-400">{(file.size / 1024).toFixed(0)} KB · click to replace</span>
          </>
        ) : (
          <>
            <UploadCloud className="mb-2 h-6 w-6 text-ink-400" />
            <span className="text-sm text-ink-600">Click to upload CSV or Excel</span>
            <span className="text-xs text-ink-400">.csv, .xls, .xlsx · max 5 MB</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function ReconRunner({ reconciliationId, hasResults }: { reconciliationId: string; hasResults: boolean }) {
  const router = useRouter();
  const [books, setBooks] = React.useState<File | null>(null);
  const [gstr2b, setGstr2b] = React.useState<File | null>(null);
  const [showConfig, setShowConfig] = React.useState(false);
  const [taxableTol, setTaxableTol] = React.useState('1');
  const [taxTol, setTaxTol] = React.useState('1');
  const [dateTol, setDateTol] = React.useState('0');
  const [running, setRunning] = React.useState(false);

  async function run() {
    if (!books || !gstr2b) {
      toast.error('Please upload both the Purchase Register and GSTR-2B files.');
      return;
    }
    setRunning(true);
    const fd = new FormData();
    fd.append('books', books);
    fd.append('gstr2b', gstr2b);
    fd.append('taxableTolerance', taxableTol);
    fd.append('taxTolerance', taxTol);
    fd.append('dateToleranceDays', dateTol);
    try {
      const res = await fetch(`/api/gst/${reconciliationId}/reconcile`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Reconciliation failed.');
        setRunning(false);
        return;
      }
      toast.success(`Done — ${data.summary.matched} matched, ${data.summary.totalBook + data.summary.totalB2B} rows processed.`);
      setRunning(false);
      router.refresh();
    } catch {
      toast.error('Network error while running the reconciliation.');
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{hasResults ? 'Re-run reconciliation' : 'Upload & reconcile'}</CardTitle>
        <div className="flex gap-2 text-xs">
          <a href="/templates/purchase-register-template.csv" download className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
            <Download className="h-3.5 w-3.5" /> Purchase Register template
          </a>
          <a href="/templates/gstr-2b-template.csv" download className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
            <Download className="h-3.5 w-3.5" /> GSTR-2B template
          </a>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FileDrop label="Purchase Register (Books)" file={books} onFile={setBooks} />
          <FileDrop label="GSTR-2B" file={gstr2b} onFile={setGstr2b} />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowConfig((s) => !s)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
          >
            <Settings2 className="h-4 w-4" /> Matching tolerances {showConfig ? '▲' : '▼'}
          </button>
          {showConfig && (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-ink-50 p-3 sm:grid-cols-3">
              <Field label="Taxable tolerance (₹)" htmlFor="tt">
                <Input id="tt" type="number" min="0" step="0.01" value={taxableTol} onChange={(e) => setTaxableTol(e.target.value)} />
              </Field>
              <Field label="Tax tolerance (₹)" htmlFor="xt">
                <Input id="xt" type="number" min="0" step="0.01" value={taxTol} onChange={(e) => setTaxTol(e.target.value)} />
              </Field>
              <Field label="Date tolerance (days)" htmlFor="dt">
                <Input id="dt" type="number" min="0" step="1" value={dateTol} onChange={(e) => setDateTol(e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-400">
            Expected columns: GSTIN, Vendor, Invoice No, Invoice Date, Taxable Value, IGST, CGST, SGST, Total Tax.
          </p>
          <Button onClick={run} loading={running}>
            <Play className="h-4 w-4" /> Run reconciliation
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
