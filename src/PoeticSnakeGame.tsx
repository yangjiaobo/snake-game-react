import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PoeticSnakeGame.css';

interface Position {
  x: number;
  y: number;
}

interface WordItem {
  word: string;
  x: number;
  y: number;
  type: 'normal' | 'magic';
}

interface CollectedWord {
  word: string;
  poeticAssociation: string;
  type: 'normal' | 'magic';
}

interface Theme {
  name: string;
  description: string;
  words: string[];
  magicWords: string[];
  style: string;
  bgColor: string;
}

type GameState = 'MENU' | 'THEME_SELECT' | 'PLAYING' | 'POEM_SHOW' | 'GAME_OVER';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 28;
const WORDS_TO_COLLECT = 8;

const THEMES: Theme[] = [
  {
    name: '童话森林',
    description: '在魔法森林中收集单词，创作属于你的童话诗',
    words: ['树', '花', '鸟', '风', '雨', '云', '山', '河', '星', '月', '草', '石'],
    magicWords: ['精灵', '魔法', '城堡', '龙'],
    style: 'fairy tale forest magical colorful dreamy fantasy',
    bgColor: '#2d5016'
  },
  {
    name: '科幻未来',
    description: '在星际间探索，用科技词汇谱写未来诗篇',
    words: ['光', '电', '星', '空', '梦', '想', '飞', '航', '宇', '宙', '机', '人'],
    magicWords: ['黑洞', '量子', '时空', '银河'],
    style: 'sci-fi futuristic cyberpunk neon space technology',
    bgColor: '#1a1a3e'
  },
  {
    name: '唐诗意境',
    description: '追寻古人的足迹，用现代视角重新诠释诗意',
    words: ['春', '秋', '花', '月', '山', '水', '风', '雨', '雪', '霜', '柳', '梅'],
    magicWords: ['江南', '长安', '琵琶', '丹青'],
    style: 'chinese ink wash painting traditional poetic landscape',
    bgColor: '#3e2723'
  },
  {
    name: '海洋探险',
    description: '潜入深海，收集海洋生物的词汇宝藏',
    words: ['海', '浪', '鱼', '鲸', '沙', '贝', '礁', '潮', '帆', '港', '岛', '湾'],
    magicWords: ['珊瑚', '珍珠', '海神', '宝藏'],
    style: 'ocean underwater deep sea blue mysterious marine',
    bgColor: '#0d47a1'
  }
];

const POETIC_ASSOCIATIONS: Record<string, string[]> = {
  '树': ['森林的守护者', '绿荫下的梦', '岁月的见证'],
  '花': ['春天的信使', '绽放的诗篇', '芬芳的记忆'],
  '鸟': ['天空的歌者', '自由的翅膀', '晨曦的问候'],
  '风': ['自然的呼吸', '远方的呼唤', '无形的诗人'],
  '雨': ['天空的眼泪', '大地的洗礼', '窗前的旋律'],
  '云': ['天空的羊群', '变幻的画布', '流浪的思绪'],
  '山': ['大地的脊梁', '云雾的居所', '勇者的挑战'],
  '河': ['时间的流淌', '生命的脉络', '远方的故事'],
  '星': ['夜空的眼睛', '宇宙的灯塔', '梦想的指引'],
  '月': ['夜的诗篇', '思念的寄托', '盈亏的哲学'],
  '草': ['大地的绒毛', '春风的足迹', '顽强的生命'],
  '石': ['沉默的智者', '岁月的化石', '大地的骨骼'],
  '光': ['希望的使者', '驱散黑暗', '温暖的拥抱'],
  '电': ['瞬间的力量', '现代的魔法', '能量的舞蹈'],
  '梦': ['心灵的旅行', '现实的镜像', '无限的可能'],
  '想': ['思维的翅膀', '创造的火花', '未来的种子'],
  '飞': ['自由的渴望', '天空的征服', '梦想的升腾'],
  '航': ['探索的勇气', '未知的旅程', '人类的智慧'],
  '宇': ['无限的广阔', '存在的舞台', '星辰的家园'],
  '宙': ['时间的河流', '永恒的循环', '万物的容器'],
  '春': ['生命的觉醒', '万物的序曲', '希望的起点'],
  '秋': ['收获的季节', '落叶的舞蹈', '成熟的韵味'],
  '雪': ['冬天的羽毛', '纯洁的覆盖', '寂静的魔法'],
  '霜': ['清晨的钻石', '寒冷的吻', '季节的印记'],
  '柳': ['春风的秀发', '离别的象征', '水边的舞者'],
  '梅': ['寒冬的勇士', '清香的傲骨', '春天的先驱'],
  '海': ['蓝色的梦境', '深邃的秘密', '无尽的辽阔'],
  '浪': ['海的呼吸', '力量的舞蹈', '永恒的律动'],
  '鱼': ['水下的精灵', '自由的泳者', '海洋的舞者'],
  '鲸': ['海洋的巨人', '深海的歌手', '古老的智者'],
  '沙': ['时间的颗粒', '海滩的金粉', '风的画布'],
  '贝': ['海洋的珠宝', '潮汐的礼物', '坚硬的柔软'],
  '礁': ['海洋的城堡', '珊瑚的家园', '浪花的舞台'],
  '潮': ['月亮的呼唤', '海的心跳', '来去的力量'],
  '帆': ['风的翅膀', '远航的梦想', '勇气的象征'],
  '港': ['船只的怀抱', '归航的期盼', '安全的港湾'],
  '岛': ['海洋的绿洲', '孤独的仙境', '探险的目的地'],
  '湾': ['大海的拥抱', '宁静的怀抱', '月光的镜子']
};

const MAGIC_EFFECTS: Record<string, { effect: string }> = {
  '精灵': { effect: '森林中出现了闪烁的精灵光芒' },
  '魔法': { effect: '整个世界被魔法笼罩' },
  '城堡': { effect: '远处浮现出神秘的城堡' },
  '龙': { effect: '天空中有龙的身影掠过' },
  '黑洞': { effect: '空间中出现了微型黑洞' },
  '量子': { effect: '世界进入了量子叠加态' },
  '时空': { effect: '时空开始扭曲变形' },
  '银河': { effect: '银河在头顶旋转' },
  '江南': { effect: '烟雨江南的画卷徐徐展开' },
  '长安': { effect: '古都长安的繁华重现' },
  '琵琶': { effect: '琵琶声在空气中回荡' },
  '丹青': { effect: '水墨丹青在天地间挥洒' },
  '珊瑚': { effect: '海底珊瑚绽放出绚丽色彩' },
  '珍珠': { effect: '深海珍珠散发出柔和光芒' },
  '海神': { effect: '海神的身影在深海中显现' },
  '宝藏': { effect: '海底宝藏箱缓缓打开' }
};

// 生成简单快速的SVG占位图
const generateSvgImage = (word: string, theme: Theme): string => {
  const colors = ['#4ecdc4', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f45'];
  const bgColor = colors[Math.floor(Math.random() * colors.length)];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${bgColor}" opacity="0.2"/>
      <circle cx="100" cy="100" r="60" fill="${bgColor}" opacity="0.6"/>
      <text x="100" y="110" text-anchor="middle" font-size="48" fill="#fff" font-family="Arial">${word}</text>
      <text x="100" y="160" text-anchor="middle" font-size="14" fill="${bgColor}" font-family="Arial">${theme.name}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

// 生成诗歌
const generatePoem = (words: CollectedWord[], theme: Theme): string[] => {
  const lines: string[] = [];
  lines.push(`《${theme.name}的诗篇》`);
  lines.push('');
  
  words.forEach((word, index) => {
    const association = word.poeticAssociation;
    const templates = [
      `${word.word}啊，你是${association}`,
      `在${theme.name}中，${word.word}化作了${association}`,
      `${association}，那是${word.word}的呼唤`,
      `${word.word}——${association}，如此美丽`,
      `当${word.word}遇见${theme.name}，便有了${association}`
    ];
    lines.push(templates[index % templates.length]);
    
    if (word.type === 'magic') {
      const magicEffect = MAGIC_EFFECTS[word.word];
      if (magicEffect) {
        lines.push(`  ✨ ${magicEffect.effect}`);
      }
    }
  });
  
  lines.push('');
  lines.push('—— 由蛇蛇诗人创作');
  
  return lines;
};

const PoeticSnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [collectedWords, setCollectedWords] = useState<CollectedWord[]>([]);
  const [poem, setPoem] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [magicEffects, setMagicEffects] = useState<string[]>([]);
  const [currentBgColor, setCurrentBgColor] = useState(THEMES[0].bgColor);
  const [showRemix, setShowRemix] = useState(false);
  const [remixedPoem, setRemixedPoem] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(200);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gameStateRef = useRef<GameState>('MENU');

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 生成随机单词 - 确保每局不重复
  const generateRandomWord = useCallback((currentSnake: Position[], currentWords: WordItem[], usedWordsSet: Set<string>): WordItem | null => {
    const availableNormalWords = selectedTheme.words.filter(w => !usedWordsSet.has(w));
    const availableMagicWords = selectedTheme.magicWords.filter(w => !usedWordsSet.has(w));
    
    // 如果所有单词都用完了，返回null
    if (availableNormalWords.length === 0 && availableMagicWords.length === 0) {
      return null;
    }
    
    // 15%概率生成魔法单词，如果没有可用的魔法单词就用普通单词
    const isMagic = availableMagicWords.length > 0 && Math.random() < 0.15;
    const wordPool = isMagic ? availableMagicWords : availableNormalWords;
    
    // 如果选中的词池为空，使用另一个
    const finalWordPool = wordPool.length > 0 ? wordPool : (isMagic ? availableNormalWords : availableMagicWords);
    
    if (finalWordPool.length === 0) return null;
    
    const word = finalWordPool[Math.floor(Math.random() * finalWordPool.length)];
    
    let newPos: Position;
    let attempts = 0;
    do {
      newPos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      attempts++;
    } while (
      attempts < 100 && (
        currentSnake.some(s => s.x === newPos.x && s.y === newPos.y) || 
        currentWords.some(w => w.x === newPos.x && w.y === newPos.y)
      )
    );
    
    return { word, x: newPos.x, y: newPos.y, type: isMagic ? 'magic' : 'normal' };
  }, [selectedTheme]);

  // 初始化单词
  const initializeWords = useCallback((currentSnake: Position[], usedWordsSet: Set<string>) => {
    const newWords: WordItem[] = [];
    for (let i = 0; i < 3; i++) {
      const word = generateRandomWord(currentSnake, newWords, usedWordsSet);
      if (word) {
        newWords.push(word);
        usedWordsSet.add(word.word);
      }
    }
    setWords(newWords);
    setUsedWords(new Set(usedWordsSet));
  }, [generateRandomWord]);

  // 重置游戏
  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    const newUsedWords = new Set<string>();
    
    setSnake(initialSnake);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setCollectedWords([]);
    setUsedWords(newUsedWords);
    setWords([]);
    setPoem([]);
    setScore(0);
    setMagicEffects([]);
    setCurrentBgColor(selectedTheme.bgColor);
    setShowRemix(false);
    setRemixedPoem([]);
    setIsGenerating(false);
    
    // 延迟初始化，确保状态已更新
    setTimeout(() => {
      initializeWords(initialSnake, newUsedWords);
    }, 100);
    
    setGameState('PLAYING');
  }, [selectedTheme, initializeWords]);

  // 检查碰撞
  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  // 使用ref存储最新状态
  const wordsRef = useRef(words);
  const collectedWordsRef = useRef(collectedWords);
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction);
  const nextDirectionRef = useRef(nextDirection);
  const usedWordsRef = useRef(usedWords);

  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { collectedWordsRef.current = collectedWords; }, [collectedWords]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { nextDirectionRef.current = nextDirection; }, [nextDirection]);
  useEffect(() => { usedWordsRef.current = usedWords; }, [usedWords]);

  // 移动蛇
  const moveSnake = useCallback(() => {
    if (gameStateRef.current !== 'PLAYING') return;

    const currentSnake = snakeRef.current;
    const currentWords = wordsRef.current;
    const currentCollected = collectedWordsRef.current;
    const currentUsedWords = usedWordsRef.current;
    const newDirection = nextDirectionRef.current;
    
    setDirection(newDirection);

    const head = currentSnake[0];
    const newHead: Position = { ...head };

    switch (newDirection) {
      case 'UP': newHead.y -= 1; break;
      case 'DOWN': newHead.y += 1; break;
      case 'LEFT': newHead.x -= 1; break;
      case 'RIGHT': newHead.x += 1; break;
    }

    if (checkCollision(newHead, currentSnake)) {
      setGameState('GAME_OVER');
      return;
    }

    const newSnake = [newHead, ...currentSnake];
    const eatenWordIndex = currentWords.findIndex(w => w.x === newHead.x && w.y === newHead.y);
    
    if (eatenWordIndex !== -1) {
      const eatenWord = currentWords[eatenWordIndex];
      
      // 检查这个单词是否已经被收集过（防止重复）
      if (!currentUsedWords.has(eatenWord.word)) {
        const newUsedWords = new Set(currentUsedWords);
        newUsedWords.add(eatenWord.word);
        setUsedWords(newUsedWords);
        
        const associations = POETIC_ASSOCIATIONS[eatenWord.word] || ['美丽的意象'];
        const association = associations[Math.floor(Math.random() * associations.length)];
        
        const collectedWord: CollectedWord = {
          word: eatenWord.word,
          poeticAssociation: association,
          type: eatenWord.type
        };

        const updatedCollected = [...currentCollected, collectedWord];
        setCollectedWords(updatedCollected);

        // 检查是否收集够8个单词
        if (updatedCollected.length >= WORDS_TO_COLLECT) {
          setTimeout(() => {
            const generatedPoem = generatePoem(updatedCollected, selectedTheme);
            setPoem(generatedPoem);
            setGameState('POEM_SHOW');
          }, 300);
        }

        setScore(prev => prev + (eatenWord.type === 'magic' ? 20 : 10));

        if (eatenWord.type === 'magic') {
          const magicEffect = MAGIC_EFFECTS[eatenWord.word];
          if (magicEffect) {
            setMagicEffects(prev => [...prev.slice(-2), magicEffect.effect]);
          }
        }
      }

      // 生成新单词替换被吃掉的
      const remaining = currentWords.filter((_, i) => i !== eatenWordIndex);
      const newWord = generateRandomWord(newSnake, remaining, usedWordsRef.current);
      if (newWord) {
        setWords([...remaining, newWord]);
      } else {
        setWords(remaining);
      }
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [checkCollision, generateRandomWord, selectedTheme]);

  // 游戏循环
  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = setInterval(moveSnake, speedRef.current);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameState, moveSnake]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'PLAYING') return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (directionRef.current !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (directionRef.current !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (directionRef.current !== 'RIGHT') setNextDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (directionRef.current !== 'LEFT') setNextDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 触屏控制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (gameStateRef.current !== 'PLAYING') return;
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameStateRef.current !== 'PLAYING') return;
      e.preventDefault();
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const minSwipeDistance = 30;

      if (Math.max(absDx, absDy) < minSwipeDistance) return;

      if (absDx > absDy) {
        if (dx > 0 && directionRef.current !== 'LEFT') {
          setNextDirection('RIGHT');
        } else if (dx < 0 && directionRef.current !== 'RIGHT') {
          setNextDirection('LEFT');
        }
      } else {
        if (dy > 0 && directionRef.current !== 'UP') {
          setNextDirection('DOWN');
        } else if (dy < 0 && directionRef.current !== 'DOWN') {
          setNextDirection('UP');
        }
      }

      touchStartRef.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 绘制游戏画面
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // 绘制单词
    words.forEach(wordItem => {
      const x = wordItem.x * CELL_SIZE;
      const y = wordItem.y * CELL_SIZE;
      
      if (wordItem.type === 'magic') {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      } else {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(wordItem.word, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
    });

    // 绘制蛇
    snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;

      if (index === 0) {
        ctx.fillStyle = '#4ecdc4';
        ctx.shadowColor = '#4ecdc4';
        ctx.shadowBlur = 10;
      } else {
        const opacity = Math.max(0.4, 1 - (index / snake.length) * 0.6);
        ctx.fillStyle = `rgba(78, 205, 196, ${opacity})`;
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      ctx.shadowBlur = 0;

      if (index === 0) {
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        let eyeOffsetX = 0, eyeOffsetY = 0;

        switch (direction) {
          case 'UP': eyeOffsetX = 5; eyeOffsetY = 4; break;
          case 'DOWN': eyeOffsetX = 5; eyeOffsetY = 12; break;
          case 'LEFT': eyeOffsetX = 4; eyeOffsetY = 5; break;
          case 'RIGHT': eyeOffsetX = 12; eyeOffsetY = 5; break;
        }

        ctx.beginPath();
        ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
        ctx.arc(x + eyeOffsetX + (direction === 'UP' || direction === 'DOWN' ? 8 : 0), 
                y + eyeOffsetY + (direction === 'LEFT' || direction === 'RIGHT' ? 8 : 0), eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [snake, words, direction, currentBgColor]);

  const handleRemixPoem = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const remixed = generatePoem(collectedWords, selectedTheme);
      setRemixedPoem(remixed);
      setShowRemix(true);
      setIsGenerating(false);
    }, 500);
  };

  const handleShare = () => {
    const shareText = `我在${selectedTheme.name}中创作了一首诗！\n\n${poem.join('\n')}\n\n来试试你的创意吧！`;
    if (navigator.share) {
      navigator.share({
        title: '诗歌贪吃蛇 - AI创作',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('诗歌已复制到剪贴板！');
    }
  };

  return (
    <div className="poetic-game-container">
      <div className="game-header">
        <h1 className="game-title">🐍 诗歌贪吃蛇</h1>
        <div className="score-board">
          <div className="score-item">
            <span className="score-label">收集单词</span>
            <span className="score-value">{collectedWords.length}/{WORDS_TO_COLLECT}</span>
          </div>
          <div className="score-item">
            <span className="score-label">得分</span>
            <span className="score-value">{score}</span>
          </div>
        </div>
      </div>

      {magicEffects.length > 0 && (
        <div className="magic-effects">
          {magicEffects.map((effect, index) => (
            <div key={index} className="magic-effect">✨ {effect}</div>
          ))}
        </div>
      )}

      <div className="game-board">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="game-canvas"
          style={{ touchAction: 'none' }}
        />

        {gameState === 'MENU' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>🐍 诗歌贪吃蛇</h2>
              <p>收集单词，创作诗歌，生成艺术</p>
              <p>吃够8个单词，AI将为你创作一首诗</p>
              <div className="mobile-hint">
                <p>📱 手机上：滑动屏幕控制方向</p>
              </div>
              <button className="btn btn-primary" onClick={() => setGameState('THEME_SELECT')}>
                选择主题
              </button>
            </div>
          </div>
        )}

        {gameState === 'THEME_SELECT' && (
          <div className="overlay theme-select">
            <div className="overlay-content">
              <h2>选择你的创作主题</h2>
              <div className="theme-grid">
                {THEMES.map((theme, index) => (
                  <div 
                    key={index} 
                    className={`theme-card ${selectedTheme.name === theme.name ? 'selected' : ''}`}
                    style={{ backgroundColor: theme.bgColor }}
                    onClick={() => {
                      setSelectedTheme(theme);
                      setCurrentBgColor(theme.bgColor);
                    }}
                  >
                    <h3>{theme.name}</h3>
                    <p>{theme.description}</p>
                    <div className="theme-words">
                      {theme.words.slice(0, 6).join('、')}...
                    </div>
                    {selectedTheme.name === theme.name && (
                      <div className="theme-selected">✓ 已选择</div>
                    )}
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={resetGame}>
                开始创作
              </button>
            </div>
          </div>
        )}

        {gameState === 'POEM_SHOW' && (
          <div className="overlay poem-overlay">
            <div className="overlay-content poem-content">
              <h2>🎨 AI为你创作的诗</h2>
              
              {/* 诗歌和图片在同一页面 */}
              <div className="poem-and-images">
                <div className="poem-text">
                  {(showRemix && remixedPoem.length > 0 ? remixedPoem : poem).map((line, index) => (
                    <p key={index} className="poem-line">{line}</p>
                  ))}
                </div>
                
                <div className="poem-images">
                  {collectedWords.map((word, index) => (
                    <div key={index} className="poem-image-item">
                      <div className="image-wrapper">
                        <img 
                          src={generateSvgImage(word.word, selectedTheme)} 
                          alt={word.word}
                        />
                      </div>
                      <span className="word-label">{word.word}</span>
                      <span className="association-label">{word.poeticAssociation}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="poem-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={handleRemixPoem}
                  disabled={isGenerating}
                >
                  {isGenerating ? '✨ 重新混合中...' : '🎲 重新混合'}
                </button>
                <button className="btn btn-success" onClick={handleShare}>
                  📤 分享创作
                </button>
                <button className="btn btn-primary" onClick={resetGame}>
                  🔄 再玩一次
                </button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>游戏结束</h2>
              <p>你收集了 {collectedWords.length} 个单词</p>
              <p>得分: {score}</p>
              {collectedWords.length >= WORDS_TO_COLLECT ? (
                <button className="btn btn-primary" onClick={() => setGameState('POEM_SHOW')}>
                  查看诗歌
                </button>
              ) : (
                <button className="btn btn-primary" onClick={resetGame}>
                  再试一次
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {gameState === 'PLAYING' && (
        <div className="touch-controls">
          <div className="d-pad">
            <button 
              className="d-pad-btn up"
              onTouchStart={(e) => { e.preventDefault(); if (direction !== 'DOWN') setNextDirection('UP'); }}
            >⬆️</button>
            <div className="d-pad-middle">
              <button 
                className="d-pad-btn left"
                onTouchStart={(e) => { e.preventDefault(); if (direction !== 'RIGHT') setNextDirection('LEFT'); }}
              >⬅️</button>
              <button 
                className="d-pad-btn right"
                onTouchStart={(e) => { e.preventDefault(); if (direction !== 'LEFT') setNextDirection('RIGHT'); }}
              >➡️</button>
            </div>
            <button 
              className="d-pad-btn down"
              onTouchStart={(e) => { e.preventDefault(); if (direction !== 'UP') setNextDirection('DOWN'); }}
            >⬇️</button>
          </div>
        </div>
      )}

      <div className="word-collection-box">
        <h3>📦 单词收集盒</h3>
        <div className="collected-words">
          {collectedWords.map((word, index) => (
            <div key={index} className={`collected-word ${word.type}`}>
              <span className="word-text">{word.word}</span>
              <span className="word-association">{word.poeticAssociation}</span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, WORDS_TO_COLLECT - collectedWords.length) }).map((_, index) => (
            <div key={`empty-${index}`} className="collected-word empty">
              <span className="word-text">?</span>
            </div>
          ))}
        </div>
      </div>

      <div className="game-instructions">
        <p>⬆️ ⬇️ ⬅️ ➡️ 方向键/滑动屏幕移动 | 收集8个单词创作诗歌</p>
        <p>✨ 金色单词是魔法单词，有特殊效果！</p>
      </div>
    </div>
  );
};

export default PoeticSnakeGame;