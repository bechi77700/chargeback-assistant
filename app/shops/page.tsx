'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { notifyShopsChanged, shopColor, type ShopSummary, type ShopsResponse } from '@/lib/shops';

export default function ShopsPage() {
  const [shops, setShops] = useState<ShopSummary[] | null>(null);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch('/api/shops')
      .then((r) => r.json())
      .then((d: ShopsResponse) => setShops(d.shops));
  }

  useEffect(load, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError(null);
    const res = await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not add shop');
      return;
    }
    setNewName('');
    load();
    notifyShopsChanged();
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <p className="text-accent-violet text-xs font-semibold uppercase tracking-widest mb-2">● Settings</p>
        <h1 className="text-text-primary text-3xl md:text-4xl font-bold tracking-tight">Shops</h1>
        <p className="text-text-muted mt-2 mb-8">
          Every dispute belongs to one shop, so you always know where a chargeback comes from.
        </p>

        <form onSubmit={handleAdd} className="card p-4 mb-6">
          <label className="block text-text-primary text-sm font-semibold mb-2">Add a shop</label>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="e.g. My Store US"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button type="submit" disabled={!newName.trim() || adding} className="btn-primary">
              {adding ? 'Adding…' : 'Add shop'}
            </button>
          </div>
          {error && <p className="text-accent-red text-xs mt-2">{error}</p>}
        </form>

        {shops === null ? (
          <div className="card h-40 shimmer" />
        ) : shops.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-text-primary font-medium">No shops yet</p>
            <p className="text-text-muted text-sm mt-1">Add your first shop above to start logging disputes.</p>
          </div>
        ) : (
          <div className="card divide-y divide-bg-border">
            {shops.map((s) => (
              <ShopRow key={s.id} shop={s} onChanged={() => { load(); notifyShopsChanged(); }} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ShopRow({ shop, onChanged }: { shop: ShopSummary; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(shop.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === shop.name) {
      setName(shop.name);
      setEditing(false);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/shops/${shop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not rename shop');
      return;
    }
    setEditing(false);
    onChanged();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/shops/${shop.id}`, { method: 'DELETE' });
    const data = await res.json();
    setBusy(false);
    setConfirmDelete(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not delete shop');
      return;
    }
    onChanged();
  }

  const color = shopColor(shop);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

        {editing ? (
          <input
            className="input-field flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') { setName(shop.name); setEditing(false); }
            }}
            autoFocus
          />
        ) : (
          <div className="flex-1 min-w-0">
            <Link href={`/?shop=${shop.id}`} className="text-text-primary font-semibold hover:text-accent-violet truncate block">
              {shop.name}
            </Link>
            <p className="text-text-muted text-xs mt-0.5">
              {shop.caseCount} dispute{shop.caseCount !== 1 ? 's' : ''}
              {shop.pendingCount > 0 && ` · ${shop.pendingCount} pending`}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={() => { setName(shop.name); setEditing(false); }} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
              <button onClick={save} disabled={busy} className="btn-primary text-xs px-3 py-1.5">
                Save
              </button>
            </>
          ) : confirmDelete ? (
            <>
              <span className="text-text-muted text-xs">Delete?</span>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs px-3 py-1.5">No</button>
              <button onClick={remove} disabled={busy} className="btn-danger">Yes, delete</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">Rename</button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={shop.caseCount > 0}
                title={shop.caseCount > 0 ? 'Move or delete its disputes first' : 'Delete shop'}
                className="btn-danger disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-accent-red text-xs mt-2 ml-5">{error}</p>}
    </div>
  );
}
