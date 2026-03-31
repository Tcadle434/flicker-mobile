import { supabase } from './supabase';
import type { TentSurfaceType } from '../../types/tent';

type TentSurfaceCommitErrorCode =
  | 'auth_required'
  | 'invalid_surface_type'
  | 'insufficient_funds'
  | 'unknown_error';

interface CommitTentSurfaceStyleRpcRow {
  ok: boolean;
  error_code: string | null;
  purchased: boolean;
  floor_style_id: string | null;
  wall_style_id: string | null;
  light_balance: number | null;
}

interface CommitTentSurfaceStyleInput {
  roomId: string;
  surfaceType: TentSurfaceType;
  styleId: string;
  price: number;
}

export interface CommitTentSurfaceStyleResult {
  ok: boolean;
  errorCode?: TentSurfaceCommitErrorCode;
  purchased?: boolean;
  floorStyleId?: string | null;
  wallStyleId?: string | null;
  lightBalance?: number | null;
}

function normalizeErrorCode(value: string | null | undefined): TentSurfaceCommitErrorCode {
  switch (value) {
    case 'auth_required':
    case 'invalid_surface_type':
    case 'insufficient_funds':
      return value;
    default:
      return 'unknown_error';
  }
}

export async function commitTentSurfaceStyle(
  input: CommitTentSurfaceStyleInput,
): Promise<CommitTentSurfaceStyleResult> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return { ok: false, errorCode: 'auth_required' };
    }

    const { data, error } = await supabase.rpc('commit_tent_surface_style', {
      p_room_id: input.roomId,
      p_surface_type: input.surfaceType,
      p_style_id: input.styleId,
      p_price: input.price,
    });

    if (error) {
      return { ok: false, errorCode: 'unknown_error' };
    }

    const row = (Array.isArray(data) ? data[0] : data) as CommitTentSurfaceStyleRpcRow | null;
    if (!row) {
      return { ok: false, errorCode: 'unknown_error' };
    }

    if (!row.ok) {
      return {
        ok: false,
        errorCode: normalizeErrorCode(row.error_code),
      };
    }

    return {
      ok: true,
      purchased: !!row.purchased,
      floorStyleId: row.floor_style_id,
      wallStyleId: row.wall_style_id,
      lightBalance: row.light_balance,
    };
  } catch {
    return { ok: false, errorCode: 'unknown_error' };
  }
}
