/**
 * Tent Service
 *
 * CRUD operations for tent_placements table.
 * Same patterns as existing Supabase services.
 */

import { supabase } from './supabase';
import type { TentPlacement, Direction } from '../../types/tent';
import { DEFAULT_ITEM_SCALE, normalizeItemScale } from '../tent/tentCatalog';

async function getUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchTentPlacements(): Promise<TentPlacement[] | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('tent_placements')
    .select('id, item_id, room_id, tile_x, tile_y, direction, scale, placed_at')
    .eq('user_id', userId);

  if (error || !data) return null;

  return data.map((row) => ({
    id: row.id,
    itemId: row.item_id,
    roomId: row.room_id,
    x: row.tile_x,
    y: row.tile_y,
    direction: (row.direction as Direction) || 'down',
    scale: normalizeItemScale(row.scale),
    placedAt: new Date(row.placed_at).getTime(),
  }));
}

export async function insertTentPlacement(placement: TentPlacement): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { error } = await supabase.from('tent_placements').insert({
    id: placement.id,
    user_id: userId,
    item_id: placement.itemId,
    room_id: placement.roomId,
    tile_x: placement.x,
    tile_y: placement.y,
    direction: placement.direction,
    scale: normalizeItemScale(placement.scale ?? DEFAULT_ITEM_SCALE),
  });

  return !error;
}

export async function updateTentPlacement(
  placementId: string,
  updates: { x?: number; y?: number; direction?: Direction; scale?: number },
): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const updateData: Record<string, unknown> = {};
  if (updates.x !== undefined) updateData.tile_x = updates.x;
  if (updates.y !== undefined) updateData.tile_y = updates.y;
  if (updates.direction !== undefined) updateData.direction = updates.direction;
  if (updates.scale !== undefined) updateData.scale = normalizeItemScale(updates.scale);

  const { error } = await supabase
    .from('tent_placements')
    .update(updateData)
    .eq('id', placementId)
    .eq('user_id', userId);

  return !error;
}

export async function deleteTentPlacement(placementId: string): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('tent_placements')
    .delete()
    .eq('id', placementId)
    .eq('user_id', userId);

  return !error;
}
