'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChessBoard from '@/components/ChessBoard';
import Timer from '@/components/Timer';
import Confetti from '@/components/Confetti';

type GamePhase = 'setup' | 'playing' | 'ended';

export default function LocalPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [result, setResult] = useState<{ winner: 'w' | 'b' | 'draw'; reason: string } | null>(null);

  const startGame = () => {
    setPhase('playing');
    setTimerRunning(true);
    setResult(null);
  };

  const handleGameEnd = useCallback((res: { winner: 'w' | 'b' | 'draw'; reason: string }) => {
    setResult(res);
    setPhase('ended');
    setTimerRunning(false);
  }, []);

  const getWinnerName = () => {
    if (!result) return '';
    if (result.winner === 'draw') return '무승부';
    if (result.winner === 'w') return `${player1 || '백'} 승리!`;
    return `${player2 || '흑'} 승리!`;
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
            &#129309; 친구와 대결
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold text-purple-600 mb-1 block">
                &#9812; 백 플레이어
              </label>
              <input
                type="text"
                value={player1}
                onChange={e => setPlayer1(e.target.value)}
                placeholder="이름 (선택)"
                className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-purple-600 mb-1 block">
                &#9818; 흑 플레이어
              </label>
              <input
                type="text"
                value={player2}
                onChange={e => setPlayer2(e.target.value)}
                placeholder="이름 (선택)"
                className="w-full px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none font-semibold"
              />
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
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-600">
            <span className="text-purple-600">{player1 || '백'}</span>
            {' vs '}
            <span className="text-pink-500">{player2 || '흑'}</span>
          </span>
          <Timer running={timerRunning} />
        </div>
      </div>

      {/* Board */}
      <ChessBoard
        playerColor="w"
        twoPlayer={true}
        onGameEnd={handleGameEnd}
      />

      {/* Result overlay */}
      {phase === 'ended' && result && (
        <>
          {result.winner !== 'draw' && <Confetti />}
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
            <div className="game-card text-center space-y-4 animate-bounce-in max-w-sm w-full">
              <div className="text-5xl">
                {result.winner === 'draw' ? '\uD83E\uDD1D' : '\uD83C\uDFC6'}
              </div>
              <h2 className="text-2xl font-extrabold text-purple-700">
                {getWinnerName()}
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
