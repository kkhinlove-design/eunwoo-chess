'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { getAIMove } from '@/lib/chess-ai';
import ChessPiece3D from './ChessPiece3D';

const PIECE_UNICODE: Record<string, Record<string, string>> = {
  w: { k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659' },
  b: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PROMOTION_PIECES = ['q', 'r', 'b', 'n'] as const;

interface ChessBoardProps {
  playerColor: 'w' | 'b';
  onGameEnd?: (result: { winner: 'w' | 'b' | 'draw'; reason: string }) => void;
  aiLevel?: string;
  onMove?: (fen: string) => void;
  twoPlayer?: boolean;
  externalFen?: string;
  forceGameOver?: boolean;
}

interface CapturedPieces {
  w: string[];
  b: string[];
}

export default function ChessBoard({ playerColor, onGameEnd, aiLevel, onMove, twoPlayer = false, externalFen, forceGameOver = false }: ChessBoardProps) {
  const [game] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());

  // 외부에서 게임 종료 강제 (기권 등)
  useEffect(() => {
    if (forceGameOver) setGameOver(true);
  }, [forceGameOver]);

  // 외부 FEN 동기화 (온라인 멀티)
  useEffect(() => {
    if (externalFen && externalFen !== game.fen()) {
      game.load(externalFen);
      setFen(externalFen);
      setSelectedSquare(null);
      setValidMoves([]);
      checkGameEnd();
    }
  }, [externalFen]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [captured, setCaptured] = useState<CapturedPieces>({ w: [], b: [] });
  const [promotionMove, setPromotionMove] = useState<{ from: Square; to: Square } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const isFlipped = playerColor === 'b' && !twoPlayer;

  const checkGameEnd = useCallback(() => {
    if (game.isCheckmate()) {
      const winner = game.turn() === 'w' ? 'b' : 'w';
      setGameOver(true);
      onGameEnd?.({ winner, reason: '체크메이트' });
      return true;
    }
    if (game.isStalemate()) {
      setGameOver(true);
      onGameEnd?.({ winner: 'draw', reason: '스테일메이트' });
      return true;
    }
    if (game.isDraw()) {
      setGameOver(true);
      onGameEnd?.({ winner: 'draw', reason: '무승부' });
      return true;
    }
    if (game.isThreefoldRepetition()) {
      setGameOver(true);
      onGameEnd?.({ winner: 'draw', reason: '3회 반복' });
      return true;
    }
    if (game.isInsufficientMaterial()) {
      setGameOver(true);
      onGameEnd?.({ winner: 'draw', reason: '기물 부족' });
      return true;
    }
    return false;
  }, [game, onGameEnd]);

  const makeMove = useCallback((from: Square, to: Square, promotion?: string) => {
    try {
      const move = game.move({ from, to, promotion });
      if (!move) return false;

      if (move.captured) {
        setCaptured(prev => ({
          ...prev,
          [move.color === 'w' ? 'w' : 'b']: [
            ...prev[move.color === 'w' ? 'w' : 'b'],
            PIECE_UNICODE[move.color === 'w' ? 'b' : 'w'][move.captured!],
          ],
        }));
      }

      setFen(game.fen());
      setLastMove({ from: move.from as Square, to: move.to as Square });
      setMoveHistory(prev => [...prev, move.san]);
      setSelectedSquare(null);
      setValidMoves([]);
      onMove?.(game.fen());
      checkGameEnd();
      return true;
    } catch {
      return false;
    }
  }, [game, checkGameEnd, onMove]);

  // AI move
  useEffect(() => {
    if (gameOver || twoPlayer || !aiLevel) return;
    if (game.turn() === playerColor) return;

    setAiThinking(true);
    const timeout = setTimeout(() => {
      const aiMove = getAIMove(game, aiLevel);
      if (aiMove) {
        game.move(aiMove);
        const history = game.history({ verbose: true });
        const lastAiMove = history[history.length - 1];

        if (lastAiMove.captured) {
          setCaptured(prev => ({
            ...prev,
            [lastAiMove.color]: [
              ...prev[lastAiMove.color],
              PIECE_UNICODE[lastAiMove.color === 'w' ? 'b' : 'w'][lastAiMove.captured!],
            ],
          }));
        }

        setFen(game.fen());
        setLastMove({ from: lastAiMove.from as Square, to: lastAiMove.to as Square });
        setMoveHistory(prev => [...prev, lastAiMove.san]);
        onMove?.(game.fen());
        checkGameEnd();
      }
      setAiThinking(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [fen, gameOver, twoPlayer, aiLevel, playerColor, game, checkGameEnd, onMove]);

  const handleSquareClick = useCallback((square: Square) => {
    if (gameOver || aiThinking) return;
    if (!twoPlayer && game.turn() !== playerColor) return;

    const piece = game.get(square);

    // If we have a selected square and click a valid move target
    if (selectedSquare) {
      const isValid = validMoves.some(m => m.to === square);
      if (isValid) {
        // Check for promotion
        const selectedPiece = game.get(selectedSquare);
        if (
          selectedPiece?.type === 'p' &&
          ((selectedPiece.color === 'w' && square[1] === '8') ||
           (selectedPiece.color === 'b' && square[1] === '1'))
        ) {
          setPromotionMove({ from: selectedSquare, to: square });
          return;
        }
        makeMove(selectedSquare, square);
        return;
      }
    }

    // Select a piece of current turn color
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }, [game, selectedSquare, validMoves, gameOver, aiThinking, twoPlayer, playerColor, makeMove]);

  const handlePromotion = useCallback((piece: string) => {
    if (!promotionMove) return;
    makeMove(promotionMove.from, promotionMove.to, piece);
    setPromotionMove(null);
  }, [promotionMove, makeMove]);

  const renderSquare = (row: number, col: number) => {
    const displayRow = isFlipped ? 7 - row : row;
    const displayCol = isFlipped ? 7 - col : col;
    const file = FILES[displayCol];
    const rank = RANKS[displayRow];
    const square = `${file}${rank}` as Square;
    const isLight = (displayRow + displayCol) % 2 === 0;
    const piece = game.get(square);

    const isSelected = selectedSquare === square;
    const isValidMove = validMoves.some(m => m.to === square);
    const isCapture = isValidMove && piece !== null;
    const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
    const isInCheck = game.isCheck() && piece?.type === 'k' && piece.color === game.turn();

    let className = `chess-square ${isLight ? 'light' : 'dark'}`;
    if (isSelected) className += ' selected';
    if (isLastMove) className += ' last-move';
    if (isInCheck) className += ' in-check';
    if (isValidMove && !isCapture) className += ' valid-move';
    if (isCapture) className += ' valid-capture';

    return (
      <div
        key={`${row}-${col}`}
        className={className}
        onClick={() => handleSquareClick(square)}
      >
        {piece && (
          <span className="chess-piece-3d">
            <ChessPiece3D type={piece.type} color={piece.color} />
          </span>
        )}
        {/* File labels on bottom row */}
        {row === 7 && (
          <span className="absolute bottom-0.5 right-1 text-[0.55rem] font-bold opacity-40 pointer-events-none">
            {file}
          </span>
        )}
        {/* Rank labels on left column */}
        {col === 0 && (
          <span className="absolute top-0.5 left-1 text-[0.55rem] font-bold opacity-40 pointer-events-none">
            {rank}
          </span>
        )}
      </div>
    );
  };

  const renderMoveHistory = () => {
    const pairs: Array<{ num: number; white: string; black?: string }> = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1],
      });
    }

    return (
      <div className="move-history text-gray-600">
        {pairs.map(p => (
          <div key={p.num} className="contents">
            <span className="text-purple-400 font-mono">{p.num}.</span>
            <span className="font-mono">{p.white}</span>
            <span className="font-mono">{p.black || ''}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Opponent captured pieces */}
      <div className="captured-pieces">
        {(isFlipped ? captured.w : captured.b).map((p, i) => (
          <span key={i}>{p}</span>
        ))}
      </div>

      {/* Board */}
      <div ref={boardRef} className="chess-board">
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
        )}
      </div>

      {/* Player captured pieces */}
      <div className="captured-pieces">
        {(isFlipped ? captured.b : captured.w).map((p, i) => (
          <span key={i}>{p}</span>
        ))}
      </div>

      {/* Status */}
      <div className="text-center">
        {aiThinking && (
          <span className="text-purple-500 font-semibold animate-pulse">
            AI가 생각 중...
          </span>
        )}
        {game.isCheck() && !gameOver && (
          <span className="text-red-500 font-bold">체크!</span>
        )}
        {!twoPlayer && !gameOver && !aiThinking && game.turn() === playerColor && (
          <span className="text-purple-600 font-semibold">당신의 차례입니다</span>
        )}
        {twoPlayer && !gameOver && (
          <span className="text-purple-600 font-semibold">
            {game.turn() === 'w' ? '백' : '흑'}의 차례입니다
          </span>
        )}
      </div>

      {/* Move history */}
      {moveHistory.length > 0 && (
        <div className="game-card">
          <h3 className="text-sm font-bold text-purple-700 mb-2">기보</h3>
          {renderMoveHistory()}
        </div>
      )}

      {/* Promotion dialog */}
      {promotionMove && (
        <div className="promotion-overlay" onClick={() => setPromotionMove(null)}>
          <div className="promotion-dialog" onClick={e => e.stopPropagation()}>
            {PROMOTION_PIECES.map(p => (
              <button
                key={p}
                className="promotion-choice"
                onClick={() => handlePromotion(p)}
              >
                <ChessPiece3D type={p} color={game.turn()} size={40} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
