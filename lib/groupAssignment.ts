export type GroupStudent = {id: string; name: string};

export type Group = {memberIds: string[]; memberNames: string[]};

export type GroupAssignmentOptions = {minSize?: number; maxSize?: number};

function djb2Hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (((h << 5) + h) ^ input.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function computeBalancedSplit(total: number, minSize: number, maxSize: number): number[] {
  if (total <= maxSize) return [total];

  const minChunks = Math.ceil(total / maxSize);
  const maxChunks = Math.ceil(total / minSize);

  let bestSplit: number[] | null = null;
  let bestImbalance = Infinity;

  for (let n = minChunks; n <= maxChunks + 4 && n * maxSize >= total; n++) {
    const baseSize = Math.floor(total / n);
    const remainder = total % n;
    const sizes: number[] = [];
    for (let i = 0; i < remainder; i++) sizes.push(baseSize + 1);
    for (let i = remainder; i < n; i++) sizes.push(baseSize);

    const minIn = Math.min(...sizes);
    const maxIn = Math.max(...sizes);
    if (minIn < minSize || maxIn > maxSize) continue;

    const imbalance = maxIn - minIn;
    if (imbalance < bestImbalance) {
      bestImbalance = imbalance;
      bestSplit = sizes;
    }
  }

  return bestSplit ?? [total];
}

function computeMutuals(ids: string[], preferMap: Record<string, string[]>): Map<string, string[]> {
  const mutuals = new Map<string, string[]>();
  for (const id of ids) mutuals.set(id, []);

  const peerSet = new Set(ids);
  for (const id of ids) {
    const myPicks = (preferMap[id] || []).filter((p) => peerSet.has(p) && p !== id);
    const mutualList: string[] = [];
    for (const peer of myPicks) {
      const peerPicks = preferMap[peer] || [];
      if (peerPicks.includes(id)) mutualList.push(peer);
    }
    mutuals.set(id, mutualList);
  }
  return mutuals;
}

export function computeGroupAssignments(
  students: GroupStudent[],
  preferMap: Record<string, string[]>,
  sessionId: string,
  opts: GroupAssignmentOptions | number = {minSize: 3, maxSize: 5},
): Group[] {
  let minSize = 3;
  let maxSize = 5;
  if (typeof opts === 'number') {
    maxSize = opts;
  } else {
    minSize = opts.minSize ?? 3;
    maxSize = opts.maxSize ?? 5;
  }

  if (!students || students.length === 0) return [];

  const ids = students
    .map((s) => s.id)
    .slice()
    .sort();
  const nameMap = new Map<string, string>();
  for (const s of students) nameMap.set(s.id, s.name);

  const n = ids.length;
  if (n === 1) {
    const id = ids[0]!;
    return [{memberIds: [id], memberNames: [nameMap.get(id) || id]}];
  }

  const rng = makeRng(djb2Hash(sessionId));

  const targetSizes = computeBalancedSplit(n, minSize, maxSize);
  const numGroups = targetSizes.length;

  const mutuals = computeMutuals(ids, preferMap);

  const groups: string[][] = Array.from({length: numGroups}, () => []);
  const groupCapacity: number[] = [...targetSizes];

  const studentOrder = shuffle(ids, rng);

  for (const student of studentOrder) {
    let chosen = -1;

    for (const peer of mutuals.get(student) || []) {
      for (let g = 0; g < numGroups; g++) {
        if (groupCapacity[g]! > 0 && groups[g]!.includes(peer)) {
          chosen = g;
          break;
        }
      }
      if (chosen >= 0) break;
    }

    if (chosen < 0) {
      const picks = (preferMap[student] || []).filter((p) => ids.includes(p) && p !== student);
      let bestCount = -1;
      for (let g = 0; g < numGroups; g++) {
        if (groupCapacity[g]! === 0) continue;
        let count = 0;
        for (const peer of picks) {
          if (mutuals.get(student)?.includes(peer)) continue;
          if (groups[g]!.includes(peer)) count++;
        }
        if (count > bestCount) {
          bestCount = count;
          chosen = g;
        }
      }
    }

    if (chosen < 0) {
      let maxRoom = -1;
      for (let g = 0; g < numGroups; g++) {
        if (groupCapacity[g]! > maxRoom) {
          maxRoom = groupCapacity[g]!;
          chosen = g;
        }
      }
    }

    if (chosen >= 0 && chosen < numGroups && groupCapacity[chosen]! > 0) {
      groups[chosen]!.push(student);
      groupCapacity[chosen]! -= 1;
    } else if (groups.length > 0) {
      groups[0]!.push(student);
    }
  }

  return groups
    .filter((g) => g.length > 0)
    .map((memberIds) => ({
      memberIds,
      memberNames: memberIds.map((id) => nameMap.get(id) || id),
    }));
}

export function findGroupForStudent(groups: Group[], studentId: string): Group | null {
  for (const g of groups) {
    if (g.memberIds.includes(studentId)) return g;
  }
  return null;
}
