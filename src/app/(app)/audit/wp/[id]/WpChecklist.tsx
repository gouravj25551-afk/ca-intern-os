'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import {
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from '../../actions';

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
}

export function WpChecklist({
  workingPaperId,
  items,
}: {
  workingPaperId: string;
  items: ChecklistItem[];
}) {
  const router = useRouter();
  const [text, setText] = React.useState('');
  const [pending, setPending] = React.useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPending(true);
    const res = await addChecklistItem(workingPaperId, text);
    setPending(false);
    if (!res.ok) return toast.error(res.error);
    setText('');
    router.refresh();
  }

  async function toggle(id: string, checked: boolean) {
    const res = await toggleChecklistItem(id, checked);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await deleteChecklistItem(id);
    if (!res.ok) return toast.error(res.error);
    router.refresh();
  }

  const done = items.filter((i) => i.isChecked).length;

  return (
    <div>
      {items.length > 0 && (
        <p className="mb-3 text-xs text-ink-500">{done} of {items.length} complete</p>
      )}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-ink-50">
            <input
              type="checkbox"
              checked={item.isChecked}
              onChange={(e) => toggle(item.id, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className={`flex-1 text-sm ${item.isChecked ? 'text-ink-400 line-through' : 'text-ink-700'}`}>
              {item.text}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="text-ink-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-ink-400">No checklist items yet.</li>
        )}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a checklist item…" />
        <Button type="submit" size="sm" loading={pending}><Plus className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
