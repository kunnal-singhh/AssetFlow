import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  fetchAllocationState,
  allocateAsset,
  requestTransfer,
  decideTransfer,
  returnAsset,
} from '../api/allocationApi';
import './AssetAllocation.css';

// Developer 2: Asset Allocation & Transfer screen.
// Manages who holds what, with explicit conflict rules, a transfer approval
// workflow, a return/check-in flow, and overdue flagging that can feed the
// Dashboard + Notifications.

const RETURN_CONDITIONS = ['Good', 'Fair', 'Damaged', 'Needs Repair'];

// --- Small formatting helpers ------------------------------------------------

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const daysBetween = (iso) => Math.round((new Date(iso) - new Date()) / 86400000);

const overdueLabel = (iso) => {
  const days = Math.abs(daysBetween(iso));
  return `${days} day${days === 1 ? '' : 's'} overdue`;
};

// =============================================================================
// Main screen
// =============================================================================

const AssetAllocation = () => {
  const [state, setState] = useState(null); // full joined view from the API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // No auth wired yet: pick who is "acting" so approval gating can be demoed.
  const [actingUserId, setActingUserId] = useState(3); // Aditi Rao (MANAGER)

  const [returnTarget, setReturnTarget] = useState(null); // allocation being returned
  const [transferSeed, setTransferSeed] = useState(null); // { assetId, heldBy } prefilled

  // Fetch on mount. setState lives inside the async IIFE (after await), so it
  // never runs synchronously in the effect body; the `active` guard avoids
  // setting state if the screen unmounts mid-request.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchAllocationState();
        if (active) {
          setState(data);
          setError(null);
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const actingUser = useMemo(
    () => state?.users.find((u) => u.id === actingUserId) ?? null,
    [state, actingUserId],
  );
  const canApprove = actingUser?.role === 'MANAGER' || actingUser?.role === 'ADMIN';

  const refresh = useCallback(async () => {
    setState(await fetchAllocationState());
  }, []);

  if (loading) return <div className="allocation-screen"><p className="muted">Loading allocations…</p></div>;
  if (error) return <div className="allocation-screen"><p className="error-text">Failed to load: {error}</p></div>;

  return (
    <div className="allocation-screen">
      <header className="allocation-header">
        <div>
          <h2>Asset Allocation &amp; Transfer</h2>
          <p className="muted">Manage who holds what — with conflict rules, transfers, and returns.</p>
        </div>
        <label className="acting-as">
          <span>Acting as</span>
          <select value={actingUserId} onChange={(e) => setActingUserId(Number(e.target.value))}>
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.role}
              </option>
            ))}
          </select>
        </label>
      </header>

      <OverdueBanner overdue={state.overdue} />

      <div className="allocation-grid">
        <section className="panel">
          <h3>Allocate an asset</h3>
          <AllocateForm
            state={state}
            onAllocated={refresh}
            onRequestTransfer={(seed) => setTransferSeed(seed)}
          />
        </section>

        <section className="panel">
          <div className="panel-title-row">
            <h3>Transfer requests</h3>
            <span className="pill">{state.transfers.filter((t) => t.status === 'REQUESTED').length} pending</span>
          </div>
          <TransfersPanel
            transfers={state.transfers}
            canApprove={canApprove}
            actingUserId={actingUserId}
            onDecided={refresh}
          />
        </section>
      </div>

      <section className="panel">
        <h3>Current allocations</h3>
        <ActiveAllocationsTable
          allocations={state.activeAllocations}
          onReturn={(alloc) => setReturnTarget(alloc)}
          onTransfer={(alloc) =>
            setTransferSeed({ assetId: alloc.assetId, heldBy: alloc.holderName })
          }
        />
      </section>

      <section className="panel">
        <h3>Allocation history</h3>
        <HistoryTable history={state.history} />
      </section>

      {returnTarget && (
        <ReturnModal
          allocation={returnTarget}
          onClose={() => setReturnTarget(null)}
          onDone={async () => {
            setReturnTarget(null);
            await refresh();
          }}
        />
      )}

      {transferSeed && (
        <TransferModal
          seed={transferSeed}
          state={state}
          actingUserId={actingUserId}
          onClose={() => setTransferSeed(null)}
          onDone={async () => {
            setTransferSeed(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
};

// =============================================================================
// Overdue banner — surfaces the signal that feeds Dashboard + Notifications
// =============================================================================

const OverdueBanner = ({ overdue }) => {
  if (!overdue.length) return null;
  return (
    <div className="overdue-banner" role="alert">
      <span className="overdue-icon" aria-hidden="true">⚠</span>
      <div>
        <strong>{overdue.length} overdue allocation{overdue.length === 1 ? '' : 's'}</strong>
        <ul>
          {overdue.map((a) => (
            <li key={a.id}>
              <span className="mono">{a.asset?.tag}</span> {a.asset?.name} — held by {a.holderName},{' '}
              {overdueLabel(a.expectedReturnAt)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// =============================================================================
// Allocate form — enforces the conflict rule
// =============================================================================

const AllocateForm = ({ state, onAllocated, onRequestTransfer }) => {
  const [assetId, setAssetId] = useState('');
  const [holderType, setHolderType] = useState('USER');
  const [holderId, setHolderId] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Which asset is selected, and is it already held? Derived straight from
  // props — no local mirror state — so the conflict rule can never go stale.
  const selectedAsset = state.assets.find((a) => a.id === Number(assetId)) || null;
  const conflict = useMemo(() => {
    if (!selectedAsset) return null;
    const active = state.activeAllocations.find((a) => a.assetId === selectedAsset.id);
    return active ? { holderName: active.holderName, since: active.allocatedAt } : null;
  }, [selectedAsset, state.activeAllocations]);

  const holderOptions = holderType === 'USER' ? state.users : state.departments;
  const blocked = Boolean(conflict);

  const submit = async (e) => {
    e.preventDefault();
    if (!assetId || !holderId) {
      setFormError('Pick an asset and an assignee.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await allocateAsset({
        assetId: Number(assetId),
        holderType,
        holderId: Number(holderId),
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt).toISOString() : null,
      });
      // reset
      setAssetId('');
      setHolderId('');
      setExpectedReturnAt('');
      await onAllocated();
    } catch (err) {
      // Defensive: the submit button is disabled while `blocked`, so a
      // ConflictError from the API is unexpected — surface its message.
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="allocate-form" onSubmit={submit}>
      <label className="field">
        <span>Asset</span>
        <select
          value={assetId}
          onChange={(e) => {
            setAssetId(e.target.value);
            setFormError(null);
          }}
        >
          <option value="">Select an asset…</option>
          {state.assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.tag} · {a.name} ({a.status})
            </option>
          ))}
        </select>
      </label>

      {/* Conflict rule: an already-held asset can't be allocated — offer transfer instead. */}
      {blocked && (
        <div className="conflict-box" role="alert">
          <p>
            <strong>Currently held by {conflict?.holderName}</strong>
            {conflict?.since && <span className="muted"> · since {fmtDate(conflict.since)}</span>}
          </p>
          <p className="muted">You can't allocate an asset that's already taken.</p>
          <button
            type="button"
            className="btn btn-amber"
            onClick={() => onRequestTransfer({ assetId: selectedAsset.id, heldBy: conflict?.holderName })}
          >
            Request Transfer
          </button>
        </div>
      )}

      <div className="field-row">
        <label className="field">
          <span>Assign to</span>
          <select
            value={holderType}
            onChange={(e) => {
              setHolderType(e.target.value);
              setHolderId('');
            }}
          >
            <option value="USER">Employee</option>
            <option value="DEPARTMENT">Department</option>
          </select>
        </label>

        <label className="field">
          <span>{holderType === 'USER' ? 'Employee' : 'Department'}</span>
          <select value={holderId} onChange={(e) => setHolderId(e.target.value)} disabled={blocked}>
            <option value="">Select…</option>
            {holderOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Expected return date <em className="muted">(optional)</em></span>
        <input
          type="date"
          value={expectedReturnAt}
          onChange={(e) => setExpectedReturnAt(e.target.value)}
          disabled={blocked}
        />
      </label>

      {formError && <p className="error-text">{formError}</p>}

      <button type="submit" className="btn btn-primary" disabled={submitting || blocked}>
        {submitting ? 'Allocating…' : 'Allocate asset'}
      </button>
    </form>
  );
};

// =============================================================================
// Transfer requests panel — Requested -> Approved / Rejected
// =============================================================================

const TransfersPanel = ({ transfers, canApprove, actingUserId, onDecided }) => {
  const [busyId, setBusyId] = useState(null);

  if (!transfers.length) return <p className="muted">No transfer requests yet.</p>;

  const decide = async (transferId, decision) => {
    setBusyId(transferId);
    try {
      await decideTransfer({ transferId, decision, decidedById: actingUserId });
      await onDecided();
    } finally {
      setBusyId(null);
    }
  };

  const order = { REQUESTED: 0, APPROVED: 1, REJECTED: 2 };
  const sorted = [...transfers].sort((a, b) => order[a.status] - order[b.status]);

  return (
    <ul className="transfer-list">
      {sorted.map((t) => (
        <li key={t.id} className={`transfer-item status-${t.status.toLowerCase()}`}>
          <div className="transfer-main">
            <p>
              <span className="mono">{t.asset?.tag}</span> {t.asset?.name}
            </p>
            <p className="muted">
              {t.fromHolderName} → <strong>{t.toHolderName}</strong> · requested by {t.requestedByName}
            </p>
            {t.note && <p className="note">“{t.note}”</p>}
          </div>
          <div className="transfer-side">
            <StatusBadge status={t.status} />
            {t.status === 'REQUESTED' && canApprove && (
              <div className="btn-group">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busyId === t.id}
                  onClick={() => decide(t.id, 'APPROVED')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={busyId === t.id}
                  onClick={() => decide(t.id, 'REJECTED')}
                >
                  Reject
                </button>
              </div>
            )}
            {t.status === 'REQUESTED' && !canApprove && (
              <span className="muted small">Awaiting Manager / Dept. Head</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

// =============================================================================
// Current allocations table — overdue flag + return / transfer actions
// =============================================================================

const ActiveAllocationsTable = ({ allocations, onReturn, onTransfer }) => {
  if (!allocations.length) return <p className="muted">Nothing is allocated right now.</p>;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Held by</th>
            <th>Allocated</th>
            <th>Expected return</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a) => (
            <tr key={a.id} className={a.overdue ? 'row-overdue' : ''}>
              <td>
                <span className="mono">{a.asset?.tag}</span> {a.asset?.name}
              </td>
              <td>{a.holderName}</td>
              <td>{fmtDate(a.allocatedAt)}</td>
              <td>
                {fmtDate(a.expectedReturnAt)}
                {a.overdue && <span className="badge badge-red">{overdueLabel(a.expectedReturnAt)}</span>}
              </td>
              <td>
                <div className="btn-group">
                  <button className="btn btn-ghost btn-sm" onClick={() => onTransfer(a)}>
                    Transfer
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => onReturn(a)}>
                    Return
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// =============================================================================
// History table
// =============================================================================

const HistoryTable = ({ history }) => {
  if (!history.length) return <p className="muted">No returned or transferred allocations yet.</p>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Held by</th>
            <th>Period</th>
            <th>Condition</th>
            <th>Check-in notes</th>
          </tr>
        </thead>
        <tbody>
          {history.map((a) => (
            <tr key={a.id}>
              <td>
                <span className="mono">{a.asset?.tag}</span> {a.asset?.name}
              </td>
              <td>{a.holderName}</td>
              <td>
                {fmtDate(a.allocatedAt)} → {fmtDate(a.returnedAt)}
              </td>
              <td>{a.returnCondition || '—'}</td>
              <td className="muted">{a.returnNotes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// =============================================================================
// Return modal — capture condition + check-in notes
// =============================================================================

const ReturnModal = ({ allocation, onClose, onDone }) => {
  const [condition, setCondition] = useState(RETURN_CONDITIONS[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      await returnAsset({ allocationId: allocation.id, condition, notes });
      await onDone();
    } catch (e2) {
      setErr(e2.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Return / check-in asset" onClose={onClose}>
      <p className="muted">
        <span className="mono">{allocation.asset?.tag}</span> {allocation.asset?.name} — held by {allocation.holderName}
      </p>
      <form onSubmit={submit}>
        <label className="field">
          <span>Condition on check-in</span>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {RETURN_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Check-in notes</span>
          <textarea
            rows={3}
            value={notes}
            placeholder="e.g. Minor scuff on lid, charger included."
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {err && <p className="error-text">{err}</p>}
        <p className="muted small">On return the asset status reverts to AVAILABLE.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Confirm return'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =============================================================================
// Transfer request modal
// =============================================================================

const TransferModal = ({ seed, state, actingUserId, onClose, onDone }) => {
  const asset = state.assets.find((a) => a.id === seed.assetId) || null;
  const [toHolderType, setToHolderType] = useState('USER');
  const [toHolderId, setToHolderId] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const options = toHolderType === 'USER' ? state.users : state.departments;

  const submit = async (e) => {
    e.preventDefault();
    if (!toHolderId) {
      setErr('Pick who the asset should transfer to.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await requestTransfer({
        assetId: seed.assetId,
        toHolderType,
        toHolderId: Number(toHolderId),
        expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt).toISOString() : null,
        requestedById: actingUserId,
        note,
      });
      await onDone();
    } catch (e2) {
      setErr(e2.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Request transfer" onClose={onClose}>
      <p className="muted">
        <span className="mono">{asset?.tag}</span> {asset?.name}
        {seed.heldBy && <> — currently held by <strong>{seed.heldBy}</strong></>}
      </p>
      <form onSubmit={submit}>
        <div className="field-row">
          <label className="field">
            <span>Transfer to</span>
            <select
              value={toHolderType}
              onChange={(e) => {
                setToHolderType(e.target.value);
                setToHolderId('');
              }}
            >
              <option value="USER">Employee</option>
              <option value="DEPARTMENT">Department</option>
            </select>
          </label>
          <label className="field">
            <span>{toHolderType === 'USER' ? 'Employee' : 'Department'}</span>
            <select value={toHolderId} onChange={(e) => setToHolderId(e.target.value)}>
              <option value="">Select…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Expected return date <em className="muted">(optional)</em></span>
          <input type="date" value={expectedReturnAt} onChange={(e) => setExpectedReturnAt(e.target.value)} />
        </label>
        <label className="field">
          <span>Reason / note</span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {err && <p className="error-text">{err}</p>}
        <p className="muted small">
          A request is created as <strong>Requested</strong>; a Manager / Dept. Head approves it, then the asset is
          re-allocated and history updates automatically.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-amber" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit transfer request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// =============================================================================
// Shared bits
// =============================================================================

const StatusBadge = ({ status }) => (
  <span className={`badge badge-status status-${status.toLowerCase()}`}>{status}</span>
);

const Modal = ({ title, children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

export default AssetAllocation;
