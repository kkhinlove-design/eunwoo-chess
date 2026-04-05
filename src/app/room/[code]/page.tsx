'use client';

import { useState, useEffect, useCallback, useRef, Suspense, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ChessBoard from '@/components/ChessBoard';
import Timer from '@/components/Timer';
import Confetti from '@/components/Confetti';

interface Player { id: string; name: string; avatar_emoji: string; }
interface Room {
  id: string; code: string; host_id: string; fen: string;
  status: string; host_color: string; winner_id: string | null;
}
interface RoomPlayer { id: string; player_id: string; color: string; player?: Player; }

function RoomContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get('player');

  const [player, setPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [hostColor, setHostColor] = useState<'w' | 'b'>('w');
  const [gameStarted, setGameStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: 'w' | 'b' | 'draw'; reason: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const roomIdRef = useRef<string | null>(null);

  // 플레이어 로드
  useEffect(() => {
    if (!playerId) { router.push('/'); return; }
    supabase.from('players').select('*').eq('id', playerId).single().then(({ data }) => {
      if (data) setPlayer(data);
      else router.push('/');
    });
  }, [playerId, router]);

  // 참가자 로드
  const loadPlayers = useCallback(async (rId: string) => {
    const { data } = await supabase.from('chess_room_players').select('*').eq('room_id', rId);
    if (data) {
      const withPlayers = await Promise.all(
        data.map(async (rp) => {
          const { data: p } = await supabase.from('players').select('*').eq('id', rp.player_id).single();
          return { ...rp, player: p || undefined };
        })
      );
      setRoomPlayers(withPlayers);
    }
  }, []);

  // 방 생성 또는 참가
  useEffect(() => {
    if (!player) return;

    const setup = async () => {
      const { data: existingRoom } = await supabase
        .from('chess_rooms').select('*').eq('code', code.toUpperCase()).single();

      if (!existingRoom) {
        setError('방을 찾을 수 없어요!');
        return;
      }

      roomIdRef.current = existingRoom.id;
      setRoom(existingRoom);
      setIsHost(existingRoom.host_id === player.id);
      setHostColor(existingRoom.host_color as 'w' | 'b');
      if (existingRoom.status === 'playing') setGameStarted(true);

      // 참가자 등록
      if (existingRoom.host_id !== player.id) {
        const guestColor = existingRoom.host_color === 'w' ? 'b' : 'w';
        await supabase.from('chess_room_players').upsert(
          { room_id: existingRoom.id, player_id: player.id, color: guestColor },
          { onConflict: 'room_id,player_id' }
        );
      }

      await loadPlayers(existingRoom.id);
    };

    setup();
  }, [player, code, loadPlayers]);

  // 실시간 구독
  useEffect(() => {
    const rId = roomIdRef.current;
    if (!rId) return;

    const channel = supabase
      .channel(`chess-room-${rId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_room_players', filter: `room_id=eq.${rId}` },
        () => loadPlayers(rId))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chess_rooms', filter: `id=eq.${rId}` },
        (payload) => {
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.status === 'playing') setGameStarted(true);
          if (updated.status === 'finished') {
            setCompleted(true);
            loadPlayers(rId);
          }
        })
      .subscribe();

    // 폴링 백업
    const poll = setInterval(async () => {
      const { data } = await supabase.from('chess_rooms').select('*').eq('id', rId).single();
      if (data) {
        setRoom(data);
        if (data.status === 'playing') setGameStarted(true);
      }
      loadPlayers(rId);
    }, 2000);

    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdRef.current, loadPlayers]);

  // 게임 시작
  const handleStart = async () => {
    if (!room || !isHost || roomPlayers.length < 2) return;

    // 게스트 색상 업데이트
    const guestColor = hostColor === 'w' ? 'b' : 'w';
    const guest = roomPlayers.find(rp => rp.player_id !== player?.id);
    if (guest) {
      await supabase.from('chess_room_players').update({ color: guestColor }).eq('id', guest.id);
    }
    await supabase.from('chess_room_players').update({ color: hostColor }).eq('room_id', room.id).eq('player_id', player?.id);

    await supabase.from('chess_rooms').update({
      status: 'playing',
      host_color: hostColor,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      winner_id: null,
      started_at: new Date().toISOString(),
    }).eq('id', room.id);
  };

  // 수 두기
  const handleMove = useCallback(async (fen: string) => {
    if (!room) return;
    await supabase.from('chess_rooms').update({ fen }).eq('id', room.id);
  }, [room]);

  // 게임 종료
  const handleGameEnd = useCallback(async (result: { winner: 'w' | 'b' | 'draw'; reason: string }) => {
    setGameResult(result);
    setCompleted(true);
    if (!room || !player) return;

    let winnerId: string | null = null;
    if (result.winner !== 'draw') {
      const winnerRp = roomPlayers.find(rp => rp.color === result.winner);
      winnerId = winnerRp?.player_id || null;
    }

    await supabase.from('chess_rooms').update({ status: 'finished', winner_id: winnerId }).eq('id', room.id);

    // 통계 업데이트
    for (const rp of roomPlayers) {
      const isWinner = rp.player_id === winnerId;
      const { data: p } = await supabase.from('players').select('chess_games_played, chess_games_won, chess_total_score').eq('id', rp.player_id).single();
      if (p) {
        await supabase.from('players').update({
          chess_games_played: p.chess_games_played + 1,
          ...(isWinner ? { chess_games_won: p.chess_games_won + 1, chess_total_score: p.chess_total_score + 100 } : {}),
        }).eq('id', rp.player_id);
      }
    }
  }, [room, player, roomPlayers]);

  // 방 코드 복사
  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="game-card text-center max-w-md">
          <div className="text-4xl mb-4">😢</div>
          <p className="text-lg text-purple-700 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">돌아가기</button>
        </div>
      </div>
    );
  }

  if (!room || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-purple-400">방 준비 중... ♟️</div>
      </div>
    );
  }

  const myColor = roomPlayers.find(rp => rp.player_id === player.id)?.color as 'w' | 'b' || 'w';

  // 결과 화면
  if (completed && gameResult) {
    const winnerPlayer = gameResult.winner !== 'draw'
      ? roomPlayers.find(rp => rp.color === gameResult.winner)?.player
      : null;
    const iWon = gameResult.winner === myColor;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {iWon && <Confetti />}
        <div className="game-card w-full max-w-md text-center animate-bounce-in">
          <div className="text-6xl mb-4">{gameResult.winner === 'draw' ? '🤝' : iWon ? '🏆' : '😢'}</div>
          <h2 className="text-3xl font-bold text-purple-700 mb-2">
            {gameResult.winner === 'draw' ? '무승부!' : iWon ? '승리!' : '패배...'}
          </h2>
          <p className="text-purple-500 mb-2">{gameResult.reason}</p>
          {winnerPlayer && (
            <p className="text-lg mb-4">{winnerPlayer.avatar_emoji} {winnerPlayer.name}(이)가 이겼어!</p>
          )}
          <div className="flex flex-col gap-2 mt-4">
            {isHost && (
              <button onClick={() => { setCompleted(false); setGameResult(null); setGameStarted(false); }} className="btn-primary w-full">
                다시 하기! 🔄
              </button>
            )}
            <button onClick={() => router.push('/')} className="btn-secondary w-full">로비로</button>
          </div>
        </div>
      </div>
    );
  }

  // 대기실
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="game-card w-full max-w-md text-center">
          <div className="text-4xl mb-2">🏠</div>
          <h2 className="text-2xl font-bold text-purple-700 mb-1">체스 대기실</h2>

          <div className="my-4 p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-purple-400 mb-1">방 코드를 친구에게 알려줘!</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black text-purple-700 tracking-widest">{room.code}</span>
              <button onClick={copyCode} className="px-3 py-1 bg-purple-200 rounded-lg text-purple-700 text-sm font-bold hover:bg-purple-300">
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-purple-400 mb-2 font-semibold">참가자 ({roomPlayers.length}/2)</p>
            <div className="space-y-2">
              {roomPlayers.map(rp => (
                <div key={rp.id} className="flex items-center gap-3 p-2 bg-purple-50 rounded-xl">
                  <span className="text-2xl">{rp.player?.avatar_emoji}</span>
                  <span className="font-bold text-purple-700">{rp.player?.name}</span>
                  {rp.player_id === room.host_id && (
                    <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-0.5 rounded-full font-bold">방장</span>
                  )}
                </div>
              ))}
              {roomPlayers.length < 2 && (
                <div className="text-purple-300 animate-pulse p-2">상대를 기다리는 중...</div>
              )}
            </div>
          </div>

          {isHost && (
            <div className="mb-4">
              <p className="text-sm text-purple-400 mb-2 font-semibold">색상 선택</p>
              <div className="flex gap-2 justify-center">
                {(['w', 'b'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setHostColor(c)}
                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                      hostColor === c ? 'bg-purple-600 text-white scale-105' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    }`}
                  >
                    {c === 'w' ? '⬜ 백' : '⬛ 흑'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isHost ? (
            <button
              onClick={handleStart}
              disabled={roomPlayers.length < 2}
              className="btn-primary w-full text-lg disabled:opacity-50"
            >
              게임 시작! 🚀
            </button>
          ) : (
            <div className="text-purple-400 font-semibold animate-pulse">
              방장이 게임을 시작할 때까지 기다려줘...
            </div>
          )}

          <button onClick={() => router.push('/')} className="mt-3 text-sm text-purple-300 hover:text-purple-500">
            ← 나가기
          </button>
        </div>
      </div>
    );
  }

  // 게임 플레이
  return (
    <div className="min-h-screen p-2 sm:p-4 pt-4 sm:pt-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-purple-500">방: {room.code}</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-600">
            {myColor === 'w' ? '⬜ 백' : '⬛ 흑'}
          </span>
          <Timer running={!completed} />
        </div>

        {/* 상대 정보 */}
        <div className="flex items-center justify-between mb-2 px-1">
          {roomPlayers.filter(rp => rp.player_id !== player.id).map(rp => (
            <div key={rp.id} className="flex items-center gap-2">
              <span className="text-lg">{rp.player?.avatar_emoji}</span>
              <span className="text-sm font-bold text-purple-700">{rp.player?.name}</span>
              <span className="text-xs text-purple-400">({rp.color === 'w' ? '백' : '흑'})</span>
            </div>
          ))}
        </div>

        <ChessBoard
          playerColor={myColor}
          externalFen={room.fen}
          onMove={handleMove}
          onGameEnd={handleGameEnd}
        />

        {/* 내 정보 */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="text-lg">{player.avatar_emoji}</span>
          <span className="text-sm font-bold text-purple-700">{player.name}</span>
          <span className="text-xs text-purple-400">({myColor === 'w' ? '백' : '흑'})</span>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-2xl text-purple-400">로딩 중... ♟️</div></div>}>
      <RoomContent params={params} />
    </Suspense>
  );
}
