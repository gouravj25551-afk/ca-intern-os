'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { exportWorkingPaperPdf, type WpSummaryData } from '@/lib/pdf';
import { WorkingPaperForm, type WpValues, type UserOption } from '../../WorkingPaperForm';
import { deleteWorkingPaper } from '../../actions';

export function WpActions({
  wp,
  users,
  pdfData,
}: {
  wp: WpValues & { id: string; auditId: string };
  users: UserOption[];
  pdfData: WpSummaryData;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function onDelete() {
    setDeleting(true);
    const res = await deleteWorkingPaper(wp.id);
    setDeleting(false);
    if (!res.ok) return toast.error(res.error);
    toast.success('Working paper deleted.');
    router.push('/audit');
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/api/audit/export?workingPaperId=${wp.id}`}>
        <Button variant="outline" size="sm"><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
      </a>
      <Button variant="outline" size="sm" onClick={() => exportWorkingPaperPdf(pdfData)}>
        <FileDown className="h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit working paper" size="xl">
        <WorkingPaperForm
          initial={wp}
          audits={[]}
          users={users}
          lockedAuditId={wp.auditId}
          onDone={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete working paper?"
        message="This permanently deletes the working paper and its checklist. This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={onDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
