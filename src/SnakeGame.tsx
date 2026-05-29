import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SnakeGame.css';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 80;

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState('PLAYING');
  }, [generateFood]);

  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    setSnake(currentSnake => {
      const newDirection = nextDirection;
      setDirection(newDirection);

      const head = currentSnake[0];
      const newHead: Position = { ...head };

      switch (newDirection) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
      }

      if (checkCollision(newHead, currentSnake)) {
        setGameState('GAME_OVER');
        setScore(currentScore => {
          if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem('snakeHighScore', currentScore.toString());
          }
          return currentScore;
        });
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(currentScore => currentScore + 10);
        setSpeed(currentSpeed => Math.max(MIN_SPEED, currentSpeed - SPEED_INCREMENT));
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [nextDirection, food, checkCollision, generateFood, highScore]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = setInterval(moveSnake, speed);
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameState, speed, moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (direction !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (direction !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (direction !== 'RIGHT') setNextDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (direction !== 'LEFT') setNextDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          setGameState('PAUSED');
          break;
      }
    };

    const handleKeyDownPaused = (e: KeyboardEvent) => {
      if (gameState === 'PAUSED' && e.key === ' ') {
        e.preventDefault();
        setGameState('PLAYING');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDownPaused);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleKeyDownPaused);
    };
  }, [gameState, direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // 绘制食物（带发光效果）
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(foodX, foodY, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 绘制蛇
    snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;

      if (index === 0) {
        // 蛇头
        ctx.fillStyle = '#4ecdc4';
        ctx.shadowColor = '#4ecdc4';
        ctx.shadowBlur = 10;
      } else {
        // 蛇身（渐变颜色）
        const opacity = Math.max(0.4, 1 - (index / snake.length) * 0.6);
        ctx.fillStyle = `rgba(78, 205, 196, ${opacity})`;
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      // 绘制蛇头眼睛
      if (index === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        let eyeOffsetX = 0;
        let eyeOffsetY = 0;

        switch (direction) {
          case 'UP':
            eyeOffsetX = 5;
            eyeOffsetY = 4;
            break;
          case 'DOWN':
            eyeOffsetX = 5;
            eyeOffsetY = 12;
            break;
          case 'LEFT':
            eyeOffsetX = 4;
            eyeOffsetY = 5;
            break;
          case 'RIGHT':
            eyeOffsetX = 12;
            eyeOffsetY = 5;
            break;
        }

        ctx.beginPath();
        ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(x + eyeOffsetX + (direction === 'UP' || direction === 'DOWN' ? 8 : 0), y + eyeOffsetY + (direction === 'LEFT' || direction === 'RIGHT' ? 8 : 0), eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [snake, food, direction]);

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="game-title">🐍 贪吃蛇</h1>
        <div className="score-board">
          <div className="score-item">
            <span className="score-label">得分</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-item">
            <span className="score-label">最高分</span>
            <span className="score-value high">{highScore}</span>
          </div>
        </div>
      </div>

      <div className="game-board">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="game-canvas"
        />

        {gameState === 'MENU' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>贪吃蛇</h2>
              <p>使用方向键控制蛇的移动</p>
              <p>吃到食物变长并得分</p>
              <p>撞墙或撞到自己游戏结束</p>
              <button className="btn btn-primary" onClick={resetGame}>
                开始游戏
              </button>
            </div>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>游戏暂停</h2>
              <p>按空格键继续</p>
              <button className="btn btn-primary" onClick={() => setGameState('PLAYING')}>
                继续游戏
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>游戏结束</h2>
              <p className="final-score">最终得分: {score}</p>
              {score >= highScore && score > 0 && (
                <p className="new-record">🎉 新纪录!</p>
              )}
              <button className="btn btn-primary" onClick={resetGame}>
                重新开始
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="game-controls">
        {gameState === 'PLAYING' && (
          <button className="btn btn-secondary" onClick={() => setGameState('PAUSED')}>
            暂停
          </button>
        )}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <button className="btn btn-danger" onClick={() => setGameState('MENU')}>
            退出
          </button>
        )}
      </div>

      <div className="game-instructions">
        <p>⬆️ ⬇️ ⬅️ ➡️ 方向键移动 | 空格键暂停</p>
      </div>
    </div>
  );
};

export default SnakeGame;
