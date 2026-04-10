'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function NewRoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get('player');

  useEffect(() => {
    if (!playerId) { router.push('/'); return; }

    const create = async () => {
      const code = generateCode();
      const { data: newRoom, error } = await supabase.from('chess_rooms').insert({
        code,
        host_id: playerId,
        status: 'waiting',
        host_color: 'w',
      }).select('id').single();

      if (error || !newRoom) {
        // 코드 중복 등 에러 시 재시도
        const retryCode = generateCode();
        const { data: retryRoom, error: retryErr } = await supabase.from('chess_rooms').insert({
          code: retryCode,
          host_id: playerId,
          status: 'waiting',
          host_color: 'w',
        }).select('id').single();
        if (retryErr || !retryRoom) { router.push('/'); return; }

        await supabase.from('chess_room_players').insert({
          room_id: retryRoom.id,
          player_id: playerId,
          color: 'w',
        });
        router.replace(`/room/${retryCode}?player=${playerId}`);
        return;
      }

      await supabase.from('chess_room_players').insert({
        room_id: newRoom.id,
        player_id: playerId,
        color: 'w',
      });

      router.replace(`/room/${code}?player=${playerId}`);
    };

    create();
  }, [playerId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-2xl text-purple-400">방 만드는 중... ♟️</div>
    </div>
  );
}

export default function NewRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-2xl text-purple-400">로딩 중...</div></div>}>
      <NewRoomContent />
    </Suspense>
  );
}
