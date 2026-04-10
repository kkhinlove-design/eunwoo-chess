'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ChessBoard from '@/components/ChessBoard';
import Timer from '@/components/Timer';
import Confetti from '@/components/Confetti';

type GamePhase = 'setup' | 'playing' | 'ended';
type PlayerColor = 'w' | 'b';

const AI_LEVELS = [
  { key: 'baby', label: '아기 AI', emoji: '\uD83D\uDC76', desc: '랜덤 이동' },
  { key: 'student', label: '학생 AI', emoji: '\uD83E\uDDD1\u200D\uD83C\uDF93', desc: '기본 전략' },
  { key: 'genius', label: '천재 AI', emoji: '\uD83E\uDDE0', desc: '2수 앞을 봄' },
  { key: 'robot', label: '로봇 AI', emoji: '\uD83E\uDD16', desc: '3수 앞을 봄' },
];

export default function PlayPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [aiLevel, setAiLevel] = useState('baby');
  const [timerRunning, setTimerRunning] = useState(false);
  const [result, setResult] = useState<{ winner: 'w' | 'b' | 'draw'; reason: string } | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // 로그인된 플레이어 ID 로드
  useEffect(() => {
    const saved = localStorage.getItem('chess_player_id');
    if (saved) setPlayerId(saved);
  }, []);

  const startGame = () => {
    setPhase('playing');
    setTimerRunning(true);
    setResult(null);
  };

  // 전적 DB 저장
  const saveStats = useCallback(async (res: { winner: 'w' | 'b' | 'draw'; reason: string }) => {
    if (!playerId) return;
    const { data: p } = await supabase
      .from('players')
      .select('chess_games_played, chess_games_won, chess_total_score')
      .eq('id', playerId)
      .single();
    if (!p) return;

    const isWin = res.winner === playerColor;
    const isDraw = res.winner === 'draw';
    await supabase.from('players').update({
      chess_games_played: p.chess_games_played + 1,
      chess_games_won: p.chess_games_won + (isWin ? 1 : 0),
      chess_total_score: p.chess_total_score + (isWin ? 100 : isDraw ? 30 : 0),
    }).eq('id', playerId);
  }, [playerId, playerColor]);

  const handleGameEnd = useCallback((res: { winner: 'w' | 'b' | 'draw'; reason: string }) => {
    setResult(res);
    setPhase('ended');
    setTimerRunning(false);
    saveStats(res);
  }, [saveStats]);

  const getResultMessage = () => {
    if (!result) return '';
    if (result.winner === 'draw') return `무승부 (${result.reason})`;
    if (result.winner === playerColor) return '승리! 축하합니다!';
    return 'AI가 이겼습니다...';
  };

  const getResultEmoji = () => {
    if (!result) return '';
    if (result.winner === 'draw') return '\uD83E\uDD1D';
    if (result.winner === playerColor) return '\uD83C\uDF89';
    return '\uD83D\uDE22';
  };

  if (phase === 'setup') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="game-card w-full max-w-md space-y-6">
          <button
            onClick={() => router.push('/')}
            className="text-purple-500 text-sm font-semibold hover:text-purple-700"
          >
            &larr; 돌아가기
          </button>

          <h2 className="text-2xl font-extrabold text-center text-purple-700">
            &#129302; AI 대결
          </h2>

          {/* Color selection */}
          <div>
            <h3 className="font-bold text-purple-600 mb-2">색상 선택</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPlayerColor('w')}
                className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all border-2 ${
                  playerColor === 'w'
                    ? 'border-purple-500 bg-purple-100 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                }`}
              >
                &#9812; 백(선공)
              </button>
              <button
                onClick={() => setPlayerColor('b')}
                className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all border-2 ${
                  playerColor === 'b'
                    ? 'border-purple-500 bg-purple-100 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                }`}
              >
                &#9818; 흑(후공)
              </button>
            </div>
          </div>

          {/* AI level */}
          <div>
            <h3 className="font-bold text-purple-600 mb-2">AI 난이도</h3>
            <div className="grid grid-cols-2 gap-3">
              {AI_LEVELS.map(level => (
                <button
                  key={level.key}
                  onClick={() => setAiLevel(level.key)}
                  className={`p-3 rounded-xl text-left transition-all border-2 ${
                    aiLevel === level.key
                      ? 'border-purple-500 bg-purple-100'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{level.emoji}</div>
                  <div className="font-bold text-sm text-gray-800">{level.label}</div>
                  <div className="text-xs text-gray-500">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={startGame} className="btn-primary w-full py-4 text-lg">
            게임 시작!
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 pt-6">
      {/* Header */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-between mb-4">
        <button
          onClick={() => {
            setPhase('setup');
            setTimerRunning(false);
          }}
          className="text-purple-500 text-sm font-semibold hover:text-purple-700"
        >
          &larr; 설정
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-purple-600">
            {AI_LEVELS.find(l => l.key === aiLevel)?.emoji}{' '}
            {AI_LEVELS.find(l => l.key === aiLevel)?.label}
          </span>
          <Timer running={timerRunning} />
        </div>
      </div>

      {/* Board */}
      <ChessBoard
        playerColor={playerColor}
        aiLevel={aiLevel}
        onGameEnd={handleGameEnd}
      />

      {/* Result overlay */}
      {phase === 'ended' && result && (
        <>
          {result.winner === playerColor && <Confetti />}
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
            <div className="game-card text-center space-y-4 animate-bounce-in max-w-sm w-full">
              <div className="text-5xl">{getResultEmoji()}</div>
              <h2 className="text-2xl font-extrabold text-purple-700">
                {getResultMessage()}
              </h2>
              <p className="text-gray-500 text-sm">{result.reason}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPhase('setup');
                    setResult(null);
                  }}
                  className="btn-secondary flex-1 py-3"
                >
                  설정으로
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary flex-1 py-3"
                >
                  다시 하기
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
