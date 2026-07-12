// Developer 2: Allocation & Transfer data layer.
//
// This is a self-contained in-memory mock that mirrors the Prisma schema
// (User / Department / Asset / AllocationLog + a client-side Transfer concept).
// It lets the Allocation & Transfer screen run and be demoed before the
// backend controllers are implemented.
//
// To go live, replace the bodies of the exported functions with `fetch`
// calls to /api/assets, /api/allocations, /api/transfers — the shapes the
// component consumes stay identical, so the UI does not change.

const LATENCY = 250; // simulate network so loading states are exercised

// --- Seed data ---------------------------------------------------------------

const departments = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Design' },
  { id: 3, name: 'Operations' },
];

const users = [
  { id: 1, name: 'Priya Sharma', email: 'priya@assetflow.io', role: 'EMPLOYEE', departmentId: 1 },
  { id: 2, name: 'Raj Verma', email: 'raj@assetflow.io', role: 'EMPLOYEE', departmentId: 1 },
  { id: 3, name: 'Aditi Rao', email: 'aditi@assetflow.io', role: 'MANAGER', departmentId: 1 },
  { id: 4, name: 'Karan Mehta', email: 'karan@assetflow.io', role: 'EMPLOYEE', departmentId: 2 },
];

// AssetStatus mirrors the Prisma enum: AVAILABLE | ALLOCATED | MAINTENANCE | RETIRED
const assets = [
  { id: 114, tag: 'AF-0114', name: 'MacBook Pro 14"', category: 'Laptop', status: 'ALLOCATED', departmentId: 1 },
  { id: 115, tag: 'AF-0115', name: 'Dell UltraSharp 27"', category: 'Monitor', status: 'ALLOCATED', departmentId: 1 },
  { id: 116, tag: 'AF-0116', name: 'ThinkPad X1 Carbon', category: 'Laptop', status: 'AVAILABLE', departmentId: 1 },
  { id: 117, tag: 'AF-0117', name: 'iPad Pro 12.9"', category: 'Tablet', status: 'AVAILABLE', departmentId: 2 },
  { id: 118, tag: 'AF-0118', name: 'Logitech MX Keys', category: 'Peripheral', status: 'AVAILABLE', departmentId: 3 },
  { id: 119, tag: 'AF-0119', name: 'Projector Epson EB', category: 'AV', status: 'MAINTENANCE', departmentId: 3 },
];

// AllocationLog extended with the fields this screen needs:
//   expectedReturnAt, returnCondition, returnNotes.
// holderType lets an asset be allocated to a USER or a whole DEPARTMENT.
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

let allocations = [
  {
    id: 1,
    assetId: 114,
    holderType: 'USER',
    holderId: 1, // Priya holds Laptop AF-0114 (the spec's example)
    allocatedAt: daysFromNow(-20),
    expectedReturnAt: daysFromNow(15),
    returnedAt: null,
    returnCondition: null,
    returnNotes: null,
  },
  {
    id: 2,
    assetId: 115,
    holderType: 'USER',
    holderId: 4, // Karan holds a monitor — already past its expected return -> OVERDUE
    allocatedAt: daysFromNow(-40),
    expectedReturnAt: daysFromNow(-5),
    returnedAt: null,
    returnCondition: null,
    returnNotes: null,
  },
];

// Client-side transfer requests: REQUESTED -> APPROVED | REJECTED.
let transfers = [];

// --- ID helpers --------------------------------------------------------------

let allocationSeq = allocations.length;
let transferSeq = 0;
const nextAllocationId = () => ++allocationSeq;
const nextTransferId = () => ++transferSeq;

// --- Utilities ---------------------------------------------------------------

const clone = (v) => JSON.parse(JSON.stringify(v));
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(clone(value)), LATENCY));

const userById = (id) => users.find((u) => u.id === id) || null;
const departmentById = (id) => departments.find((d) => d.id === id) || null;
const assetById = (id) => assets.find((a) => a.id === id) || null;

const holderLabel = (holderType, holderId) => {
  if (holderType === 'DEPARTMENT') return departmentById(holderId)?.name ?? 'Unknown dept.';
  return userById(holderId)?.name ?? 'Unknown user';
};

// The single active (not-yet-returned) allocation for an asset, if any.
const activeAllocationFor = (assetId) =>
  allocations.find((a) => a.assetId === assetId && !a.returnedAt) || null;

const isOverdue = (allocation) =>
  !allocation.returnedAt &&
  allocation.expectedReturnAt &&
  new Date(allocation.expectedReturnAt) < new Date();

// Enrich an allocation with the joined data the UI renders.
const decorate = (allocation) => ({
  ...allocation,
  asset: assetById(allocation.assetId),
  holderName: holderLabel(allocation.holderType, allocation.holderId),
  overdue: isOverdue(allocation),
});

const decorateTransfer = (t) => ({
  ...t,
  asset: assetById(t.assetId),
  fromHolderName: holderLabel(t.fromHolderType, t.fromHolderId),
  toHolderName: holderLabel(t.toHolderType, t.toHolderId),
  requestedByName: userById(t.requestedById)?.name ?? 'Unknown',
});

// --- Read API ----------------------------------------------------------------

// One call returns everything the screen needs, already joined + flagged.
export function fetchAllocationState() {
  const activeAllocations = allocations.filter((a) => !a.returnedAt).map(decorate);
  const history = allocations
    .filter((a) => a.returnedAt)
    .map(decorate)
    .sort((a, b) => new Date(b.returnedAt) - new Date(a.returnedAt));

  return delay({
    users: users.map(clone),
    departments: departments.map(clone),
    assets: assets.map(clone),
    activeAllocations,
    history,
    transfers: transfers.map(decorateTransfer),
    overdue: activeAllocations.filter((a) => a.overdue),
  });
}

// --- Conflict-aware allocation ----------------------------------------------

export class ConflictError extends Error {
  constructor(message, heldBy) {
    super(message);
    this.name = 'ConflictError';
    this.heldBy = heldBy; // { holderName, since }
  }
}

// Allocate an AVAILABLE asset. If it is already held, throw ConflictError so
// the UI can block and offer a Transfer Request instead.
export function allocateAsset({ assetId, holderType, holderId, expectedReturnAt }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const asset = assetById(assetId);
      if (!asset) return reject(new Error('Asset not found'));

      const existing = activeAllocationFor(assetId);
      if (existing) {
        return reject(
          new ConflictError(`Asset is currently held by ${holderLabel(existing.holderType, existing.holderId)}`, {
            holderName: holderLabel(existing.holderType, existing.holderId),
            since: existing.allocatedAt,
          }),
        );
      }
      if (asset.status !== 'AVAILABLE') {
        return reject(new Error(`Asset is ${asset.status.toLowerCase()} and cannot be allocated`));
      }

      const record = {
        id: nextAllocationId(),
        assetId,
        holderType,
        holderId,
        allocatedAt: new Date().toISOString(),
        expectedReturnAt: expectedReturnAt || null,
        returnedAt: null,
        returnCondition: null,
        returnNotes: null,
      };
      allocations.push(record);
      asset.status = 'ALLOCATED';
      resolve(clone(decorate(record)));
    }, LATENCY);
  });
}

// --- Transfer workflow -------------------------------------------------------

// Requested: someone wants an asset that is currently held by another holder.
export function requestTransfer({ assetId, toHolderType, toHolderId, expectedReturnAt, requestedById, note }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const current = activeAllocationFor(assetId);
      if (!current) return reject(new Error('Asset is not currently allocated — allocate it directly instead'));

      const record = {
        id: nextTransferId(),
        assetId,
        fromAllocationId: current.id,
        fromHolderType: current.holderType,
        fromHolderId: current.holderId,
        toHolderType,
        toHolderId,
        expectedReturnAt: expectedReturnAt || null,
        requestedById,
        note: note || '',
        status: 'REQUESTED',
        requestedAt: new Date().toISOString(),
        decidedAt: null,
        decidedById: null,
      };
      transfers.push(record);
      resolve(clone(decorateTransfer(record)));
    }, LATENCY);
  });
}

// Approved -> re-allocated automatically: close the old AllocationLog and open
// a new one for the incoming holder. Rejected just records the decision.
export function decideTransfer({ transferId, decision, decidedById }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const t = transfers.find((x) => x.id === transferId);
      if (!t) return reject(new Error('Transfer request not found'));
      if (t.status !== 'REQUESTED') return reject(new Error('Transfer already decided'));

      t.decidedAt = new Date().toISOString();
      t.decidedById = decidedById;

      if (decision === 'REJECTED') {
        t.status = 'REJECTED';
        return resolve(clone(decorateTransfer(t)));
      }

      // APPROVED: re-allocate.
      const previous = allocations.find((a) => a.id === t.fromAllocationId && !a.returnedAt);
      if (previous) {
        previous.returnedAt = new Date().toISOString();
        previous.returnCondition = 'Transferred';
        previous.returnNotes = `Re-allocated via transfer #${t.id}`;
      }

      const record = {
        id: nextAllocationId(),
        assetId: t.assetId,
        holderType: t.toHolderType,
        holderId: t.toHolderId,
        allocatedAt: new Date().toISOString(),
        expectedReturnAt: t.expectedReturnAt || null,
        returnedAt: null,
        returnCondition: null,
        returnNotes: null,
      };
      allocations.push(record);
      const asset = assetById(t.assetId);
      if (asset) asset.status = 'ALLOCATED';

      t.status = 'APPROVED';
      resolve(clone(decorateTransfer(t)));
    }, LATENCY);
  });
}

// --- Return flow -------------------------------------------------------------

// Mark returned, capture condition + check-in notes; asset reverts to AVAILABLE.
export function returnAsset({ allocationId, condition, notes }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const allocation = allocations.find((a) => a.id === allocationId);
      if (!allocation) return reject(new Error('Allocation not found'));
      if (allocation.returnedAt) return reject(new Error('Allocation already returned'));

      allocation.returnedAt = new Date().toISOString();
      allocation.returnCondition = condition;
      allocation.returnNotes = notes || '';

      const asset = assetById(allocation.assetId);
      if (asset && asset.status === 'ALLOCATED') asset.status = 'AVAILABLE';

      resolve(clone(decorate(allocation)));
    }, LATENCY);
  });
}
