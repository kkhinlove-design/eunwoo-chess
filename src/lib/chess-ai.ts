import { Chess, Move } from 'chess.js';

// Piece values
const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables (from white's perspective, index 0 = a8)
const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

const PST: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE,
};

function squareToIndex(square: string): number {
  const file = square.charCodeAt(0) - 97; // a=0, h=7
  const rank = parseInt(square[1]);        // 1-8
  // Row 0 = rank 8, Row 7 = rank 1
  const row = 8 - rank;
  return row * 8 + file;
}

function evaluateBoard(game: Chess): number {
  const board = game.board();
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const idx = row * 8 + col;
      const mirrorIdx = (7 - row) * 8 + col;
      const pieceVal = PIECE_VALUE[piece.type] || 0;
      const pstVal = PST[piece.type]?.[piece.color === 'w' ? idx : mirrorIdx] || 0;

      if (piece.color === 'w') {
        score += pieceVal + pstVal;
      } else {
        score -= pieceVal + pstVal;
      }
    }
  }

  return score;
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0) return evaluateBoard(game);

  if (game.isCheckmate()) {
    return isMaximizing ? -99999 : 99999;
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  const moves = game.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(game: Chess, aiLevel: string): string | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  const isWhite = game.turn() === 'w';

  switch (aiLevel) {
    case 'baby': {
      // Random move
      const idx = Math.floor(Math.random() * moves.length);
      return moves[idx].san;
    }

    case 'student': {
      // Evaluate each move, pick from top 3
      const scored = moves.map((move) => {
        game.move(move.san);
        const score = evaluateBoard(game);
        game.undo();
        return { move: move.san, score };
      });

      scored.sort((a, b) => isWhite ? b.score - a.score : a.score - b.score);
      const topN = Math.min(3, scored.length);
      const pick = Math.floor(Math.random() * topN);
      return scored[pick].move;
    }

    case 'genius': {
      // Minimax depth 2
      let bestMove: string | null = null;
      let bestScore = isWhite ? -Infinity : Infinity;

      for (const move of moves) {
        game.move(move.san);
        const score = minimax(game, 2, -Infinity, Infinity, !isWhite);
        game.undo();

        if (isWhite ? score > bestScore : score < bestScore) {
          bestScore = score;
          bestMove = move.san;
        }
      }
      return bestMove;
    }

    case 'robot': {
      // Minimax depth 3
      let bestMove: string | null = null;
      let bestScore = isWhite ? -Infinity : Infinity;

      for (const move of moves) {
        game.move(move.san);
        const score = minimax(game, 3, -Infinity, Infinity, !isWhite);
        game.undo();

        if (isWhite ? score > bestScore : score < bestScore) {
          bestScore = score;
          bestMove = move.san;
        }
      }
      return bestMove;
    }

    default:
      return moves[0].san;
  }
}
