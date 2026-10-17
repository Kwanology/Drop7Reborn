/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  GameMode,
  Grid,
  Disc,
  GameSettings,
  HighScoreRecord,
  LifetimeStats,
  ActiveGameState,
} from './types/game';
import {
  createEmptyBoard,
  generateDisc,
  canDropInColumn,
  findMatches,
  processExplosionWave,
  getPointsForWave,
  getDropsRequiredForLevel,
  addBottomGreyRow,
  isBoardClear,
  hasAvailableMoves,
  resetSequenceSeed,
} from './engine/gameEngine';
import { audioEngine } from './audio/audioEngine';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  loadHighScores,
  recordScore,
  loadActiveGame,
  saveActiveGame,
  clearActiveGame,
} from './storage/gameStorage';
import { GameBoard, FallingDiscState } from './components/GameBoard';
import { GameHeader } from './components/GameHeader';
import { MainMenu } from './components/MainMenu';
import { MenuModal, MenuTab } from './components/MenuModal';
import { GameOverModal } from './components/GameOverModal';

interface FloatingScore {
  id: string;
  x: number;
  y: number;
  points: number;
}

export default function App() {
  // Navigation: start on Main Menu like the original game
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game'>('menu');

  // Persistent user configurations
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [stats, setStats] = useState<LifetimeStats>(() => loadStats());
  const [highScores, setHighScores] = useState<Record<GameMode, HighScoreRecord[]>>(() =>
    loadHighScores()
  );

  // Active game mode
  const [mode, setMode] = useState<GameMode>('normal');

  // Active game state
  const [board, setBoard] = useState<Grid>(() => createEmptyBoard());
  const [currentDisc, setCurrentDisc] = useState<Disc | null>(null);
  const [nextDisc, setNextDisc] = useState<Disc | null>(null);
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [dropsRemaining, setDropsRemaining] = useState<number>(30);
  const [totalDropsRequired, setTotalDropsRequired] = useState<number>(30);
  const [totalDropsThisGame, setTotalDropsThisGame] = useState<number>(0);
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [maxComboThisGame, setMaxComboThisGame] = useState<number>(0);

  // Cascades and floating score animation markers
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [fallingDisc, setFallingDisc] = useState<FallingDiscState | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeHoverColumn, setActiveHoverColumn] = useState<number>(3); // Centered by default
  const [lastPointsAdded, setLastPointsAdded] = useState<number | null>(null);

  // Game over state
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Modals & Menu Tab
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [menuInitialTab, setMenuInitialTab] = useState<MenuTab>('modes');

  // Check if an active, playable (not game over) session exists
  const hasActiveSession = useMemo(() => {
    if (isGameOver) return false;
    const saved = loadActiveGame(mode);
    if (!saved || saved.isGameOver) return false;
    if (!hasAvailableMoves(saved.board)) return false;
    return saved.score > 0 || saved.totalDropsThisGame > 0;
  }, [isGameOver, mode]);

  // Synchronous State Saver helper for guaranteed resume accuracy
  const persistStateNow = useCallback((
    curBoard: Grid,
    curScore: number,
    curLvl: number,
    curDropsLeft: number,
    curTotalDropsReq: number,
    curTotalDrops: number,
    curDisc: Disc | null,
    nxtDisc: Disc | null,
    curMode: GameMode,
    maxCombo: number,
    gameOver: boolean
  ) => {
    if (!curDisc || !nxtDisc || gameOver) return;
    const state: ActiveGameState = {
      mode: curMode,
      score: curScore,
      level: curLvl,
      dropsRemainingInLevel: curDropsLeft,
      totalDropsThisLevel: curTotalDropsReq,
      totalDropsThisGame: curTotalDrops,
      currentCombo: 0,
      board: curBoard,
      currentDisc: curDisc,
      nextDisc: nxtDisc,
      isGameOver: gameOver,
      historyMoves: 0,
      boardClears: 0,
      highestCombo: maxCombo,
      lastUpdated: Date.now(),
    };
    saveActiveGame(state);
  }, []);

  // Initialize new game session with original Drop7 pacing (no grey discs until level 5+)
  const startNewGame = useCallback((targetMode: GameMode = mode) => {
    if (targetMode === 'sequence') {
      resetSequenceSeed();
    }

    const newBoard = createEmptyBoard();
    const firstDisc = generateDisc(targetMode, false, 1);
    const secondDisc = generateDisc(targetMode, false, 1);
    const dropsReq = getDropsRequiredForLevel(1, targetMode);

    setMode(targetMode);
    setBoard(newBoard);
    setCurrentDisc(firstDisc);
    setNextDisc(secondDisc);
    setScore(0);
    setLevel(1);
    setDropsRemaining(dropsReq);
    setTotalDropsRequired(dropsReq);
    setTotalDropsThisGame(0);
    setCurrentCombo(0);
    setMaxComboThisGame(0);
    setIsGameOver(false);
    setIsNewHighScore(false);
    setIsProcessing(false);
    setLastPointsAdded(null);
    setFloatingScores([]);
    setActiveHoverColumn(3); // Start in center

    persistStateNow(
      newBoard,
      0,
      1,
      dropsReq,
      dropsReq,
      0,
      firstDisc,
      secondDisc,
      targetMode,
      0,
      false
    );

    setCurrentScreen('game');

    // Autoplay original soundtrack on game start
    try {
      audioEngine.ensureContext();
      if (settings.soundtrack === 'muted') {
        const updated = { ...settings, soundtrack: 'drop7_original' as const };
        setSettings(updated);
        saveSettings(updated);
        audioEngine.setSoundtrack('drop7_original');
      }
      audioEngine.startMusic();
    } catch {
      // AudioContext autoplay unlock will trigger on first interaction
    }
  }, [mode, persistStateNow, settings]);

  // Initial load or game mode selection
  useEffect(() => {
    audioEngine.setSoundtrack(settings.soundtrack);
    audioEngine.setMusicVolume(settings.musicVolume);
    audioEngine.setSfxVolume(settings.sfxVolume);

    const saved = loadActiveGame(mode);
    if (saved && saved.board && saved.currentDisc && !saved.isGameOver && hasAvailableMoves(saved.board)) {
      setBoard(saved.board);
      setCurrentDisc(saved.currentDisc);
      setNextDisc(saved.nextDisc);
      setScore(saved.score);
      setLevel(saved.level);
      setDropsRemaining(saved.dropsRemainingInLevel);
      setTotalDropsRequired(saved.totalDropsThisLevel || 30);
      setTotalDropsThisGame(saved.totalDropsThisGame || 0);
      setCurrentCombo(0);
      setMaxComboThisGame(saved.highestCombo || 0);
      setIsGameOver(false);
    } else {
      // Clean fresh start for this mode (ensures a complete reset whenever next mode is selected or after game over)
      const newBoard = createEmptyBoard();
      const firstDisc = generateDisc(mode, false, 1);
      const secondDisc = generateDisc(mode, false, 1);
      const dropsReq = getDropsRequiredForLevel(1, mode);

      setBoard(newBoard);
      setCurrentDisc(firstDisc);
      setNextDisc(secondDisc);
      setScore(0);
      setLevel(1);
      setDropsRemaining(dropsReq);
      setTotalDropsRequired(dropsReq);
      setTotalDropsThisGame(0);
      setCurrentCombo(0);
      setMaxComboThisGame(0);
      setIsGameOver(false);
      setIsNewHighScore(false);
      setIsProcessing(false);
      setLastPointsAdded(null);
      setFloatingScores([]);
      setActiveHoverColumn(3);
    }
  }, [mode, settings.soundtrack, settings.musicVolume, settings.sfxVolume]);

  // Settings update handler
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);

    if (newSettings.soundtrack) {
      audioEngine.setSoundtrack(newSettings.soundtrack);
    }
    if (typeof newSettings.musicVolume === 'number') {
      audioEngine.setMusicVolume(newSettings.musicVolume);
    }
    if (typeof newSettings.sfxVolume === 'number') {
      audioEngine.setSfxVolume(newSettings.sfxVolume);
    }

    // Ensure game over causes a reset whenever the next option or setting is selected
    if (isGameOver) {
      startNewGame(mode);
    }
  };

  // Vibration trigger helper for Samsung S26
  const triggerHaptic = useCallback((pattern: number[]) => {
    if (settings.vibrationEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignored
      }
    }
  }, [settings.vibrationEnabled]);

  // Sleep utility
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Game over routine
  const handleGameOver = useCallback((finalScore: number, finalLevel: number, finalMaxCombo: number) => {
    setIsGameOver(true);
    setIsProcessing(false);
    audioEngine.playGameOver();
    triggerHaptic([100, 80, 100, 80, 200]);

    const result = recordScore(mode, finalScore, finalLevel, finalMaxCombo);
    setIsNewHighScore(result.isNewHighScore);
    setHighScores(loadHighScores());
    setStats(loadStats());
    clearActiveGame(mode);
  }, [mode, triggerHaptic]);

  // Full cascade resolution loop matching authentic Drop7 animations
  const resolveCascades = useCallback(async (startBoard: Grid, initialWaveScore = 0) => {
    let currentGrid = startBoard;
    let wave = 1;
    let waveScoreSum = initialWaveScore;
    let highestWave = 0;

    while (true) {
      const matches = findMatches(currentGrid);
      if (matches.length === 0) {
        break;
      }

      highestWave = wave;
      setCurrentCombo(wave);
      setMaxComboThisGame((prev) => Math.max(prev, wave));

      // Calculate score for this wave
      const pointsPerDisc = getPointsForWave(wave);
      const wavePoints = pointsPerDisc * matches.length;
      waveScoreSum += wavePoints;

      setScore((prev) => prev + wavePoints);
      setLastPointsAdded(wavePoints);

      // Add floating score markers on exploding cells
      const newFloatingScores: FloatingScore[] = matches.map((m) => ({
        id: `fs_${Date.now()}_${m.x}_${m.y}`,
        x: m.x,
        y: m.y,
        points: pointsPerDisc,
      }));
      setFloatingScores(newFloatingScores);

      // Audio & Haptic feedback: chain 0-10 use d7fx_chain0.mp3 through d7fx_chain10.mp3 (repeats 10 for > 10)
      const chain = wave - 1;
      audioEngine.playChain(chain);
      triggerHaptic([25 + Math.min(wave * 10, 50)]);

      // Chain Accolade effect: tasteful, localized micro-sparkle pop near the combo banner (small, distinct from full board clear)
      if (chain >= 3) {
        const particleCount = Math.min(22, 10 + chain * 2);
        confetti({
          particleCount,
          spread: 38,
          origin: { x: 0.5, y: 0.17 },
          startVelocity: 15,
          ticks: 45,
          scalar: 0.55,
          colors:
            chain >= 10
              ? ['#FFD700', '#F43F5E', '#A855F7', '#38BDF8', '#FFFFFF']
              : chain >= 8
              ? ['#EF4444', '#F97316', '#FBBF24', '#FFFFFF']
              : chain >= 7
              ? ['#8B5CF6', '#EC4899', '#F43F5E', '#FFFFFF']
              : chain >= 5
              ? ['#F43F5E', '#FB7185', '#FDE047']
              : ['#06B6D4', '#38BDF8', '#F59E0B'],
        });
      }

      // Pre-calculate explosions & grey discs damage so the crack/break animation plays synchronously with pop
      const { newBoard, shatteredGreyDiscs, crackedGreyDiscs } = processExplosionWave(
        currentGrid,
        matches,
        mode
      );

      // Trigger SFX:
      // Crack SFX (d7fx_crack.mp3) when solid grey disc cracks
      if (crackedGreyDiscs.length > 0) {
        audioEngine.playCrack();
      }
      // Break SFX (d7fx_popclear.mp3) when a block is broken into a numbered circle
      if (shatteredGreyDiscs.length > 0) {
        setTimeout(() => audioEngine.playPopClear(), crackedGreyDiscs.length > 0 ? 45 : 0);
      }

      // Authentic Drop7 animation:
      // Matched discs burst and radiate sparkles.
      // Simultaneously, adjacent grey blocks grow, wiggle right, wiggle left, flip to their new state at peak, and shrink down to normal size!
      const visualPopBoard = currentGrid.map((col, cx) =>
        col.map((d, ry) => {
          if (!d) return null;
          const isMatch = matches.some((m) => m.x === cx && m.y === ry);
          if (isMatch) {
            return { ...d, isPopping: true };
          }
          const isCracked = crackedGreyDiscs.some((c) => c.x === cx && c.y === ry);
          if (isCracked) {
            return { ...d, isCracking: true };
          }
          const shattered = shatteredGreyDiscs.find((s) => s.x === cx && s.y === ry);
          if (shattered) {
            return { ...d, isBreaking: true, revealedValue: shattered.newValue };
          }
          return { ...d };
        })
      );
      setBoard(visualPopBoard);
      await sleep(460);

      currentGrid = newBoard;
      setBoard(currentGrid);
      setFloatingScores([]);
      await sleep(180);

      wave++;
    }

    setCurrentCombo(0);

    // Check Full Board Clear bonus (70,000 pts)
    if (isBoardClear(currentGrid)) {
      const boardClearBonus = 70000;
      setScore((prev) => prev + boardClearBonus);
      setLastPointsAdded(boardClearBonus);
      audioEngine.playBoardClear();
      triggerHaptic([80, 50, 80, 50, 150]);

      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#FF7043', '#F5A623', '#E54B4B', '#D85CA8', '#4FC3F7', '#2C5E8A'],
      });

      const updatedStats = loadStats();
      updatedStats.totalBoardClears += 1;
      saveStats(updatedStats);
      setStats(updatedStats);

      await sleep(400);
    }

    return { finalGrid: currentGrid, waveScoreSum, highestWave };
  }, [mode, triggerHaptic]);

  // Main Drop Disc Action (Guaranteed save after each move)
  const handleDropInColumn = async (colIndex: number) => {
    if (isProcessing || !currentDisc || isGameOver) return;
    if (!canDropInColumn(board, colIndex)) return;

    setIsProcessing(true);
    setLastPointsAdded(null);

    let targetRow = 0;
    while (targetRow < 7 && board[colIndex][targetRow] !== null) {
      targetRow++;
    }

    // Calculate falling distance & duration for realistic gravity
    const cellsToFall = 7 - targetRow;
    const fallDurationMs = Math.round(85 + cellsToFall * 22);

    // 1. SOUND ON RELEASE AT THE TOP
    audioEngine.playRelease();
    triggerHaptic([12]);

    // Animate falling disc down the column
    setFallingDisc({
      disc: currentDisc,
      colIndex,
      targetRow,
      durationMs: fallDurationMs,
    });

    await sleep(fallDurationMs);

    // 2. SOUND ON FINISHING ANIMATING DOWN TO THE BOTTOM (IMPACT THUD)
    audioEngine.playLand();
    triggerHaptic([20]);

    // Place disc in column at targetRow
    const newBoard = board.map((col) => [...col]);
    newBoard[colIndex][targetRow] = { ...currentDisc, isNew: true };
    setBoard(newBoard);
    setFallingDisc(null);

    // THE INSTANT THE CIRCLE STOPS TO DROP: Change playing icon in the top white bar to the next circle!
    const nextInLine = nextDisc;
    const futureDisc = generateDisc(mode, true, level);
    setCurrentDisc(nextInLine);
    setNextDisc(futureDisc);
    // Cursor remains at player's target column instead of jumping back to 3

    let newDropsRemaining = dropsRemaining - 1;
    const newTotalDrops = totalDropsThisGame + 1;
    let newLevel = level;
    let newTotalDropsReq = totalDropsRequired;
    let calculatedScore = score;

    setDropsRemaining(newDropsRemaining);
    setTotalDropsThisGame(newTotalDrops);

    await sleep(60);

    // Resolve cascades
    const { finalGrid, waveScoreSum, highestWave } = await resolveCascades(newBoard);
    calculatedScore += waveScoreSum;
    let postCascadeGrid = finalGrid;

    // Check Level-Up / Grey Row Penalty
    const isHardcoreInterval = mode === 'hardcore' && newTotalDrops % 5 === 0;
    const isLevelCompleted = newDropsRemaining <= 0;

    if (isLevelCompleted || isHardcoreInterval) {
      if (isLevelCompleted) {
        const levelBonus = 7000;
        calculatedScore += levelBonus;
        setScore(calculatedScore);
        setLastPointsAdded(levelBonus);
        audioEngine.playLevelUp();
        triggerHaptic([50, 40, 70]);

        newLevel = level + 1;
        newTotalDropsReq = getDropsRequiredForLevel(newLevel, mode);
        newDropsRemaining = newTotalDropsReq;
        setLevel(newLevel);
        setDropsRemaining(newDropsRemaining);
        setTotalDropsRequired(newTotalDropsReq);

        const currentLifetime = loadStats();
        currentLifetime.totalLevelsCompleted += 1;
        saveStats(currentLifetime);
        setStats(currentLifetime);
      }

      // Solid row rises from the bottom
      await sleep(250);
      const { newBoard: raisedBoard, isGameOver: rowCausedGameOver } = addBottomGreyRow(postCascadeGrid);
      postCascadeGrid = raisedBoard;
      setBoard(postCascadeGrid);
      if (rowCausedGameOver) {
        await sleep(150);
        handleGameOver(calculatedScore, newLevel, Math.max(maxComboThisGame, highestWave));
        return;
      }

      audioEngine.playDrop();

      await sleep(200);
      const postRise = await resolveCascades(postCascadeGrid);
      calculatedScore += postRise.waveScoreSum;
      postCascadeGrid = postRise.finalGrid;
    }

    // Check Game Over: triggers when whole gameboard is filled and there are no places left to put new circles
    if (!hasAvailableMoves(postCascadeGrid)) {
      await sleep(250);
      handleGameOver(calculatedScore, newLevel, Math.max(maxComboThisGame, highestWave));
      return;
    }

    // CRITICAL: Guarantee immediate save to localStorage after every move
    persistStateNow(
      postCascadeGrid,
      calculatedScore,
      newLevel,
      newDropsRemaining,
      newTotalDropsReq,
      newTotalDrops,
      nextInLine,
      futureDisc,
      mode,
      Math.max(maxComboThisGame, highestWave),
      false
    );

    setIsProcessing(false);
  };

  // Keyboard controls: allow player to move the cursor for selecting next column during pop animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== 'game' || isMenuOpen || isGameOver) return;

      if (e.key >= '1' && e.key <= '7') {
        const col = parseInt(e.key, 10) - 1;
        setActiveHoverColumn(col);
        if (!isProcessing) {
          handleDropInColumn(col);
        }
      } else if (e.key === 'ArrowLeft') {
        setActiveHoverColumn((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveHoverColumn((prev) => Math.min(6, prev + 1));
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (!isProcessing) {
          handleDropInColumn(activeHoverColumn);
        }
      } else if (e.key === 'Escape') {
        setMenuInitialTab('modes');
        setIsMenuOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, isMenuOpen, isGameOver, isProcessing, activeHoverColumn]);

  // Autoplay music on game screen load / first user interaction
  useEffect(() => {
    if (currentScreen !== 'game') return;

    // Initial check on game screen active
    try {
      const ctx = audioEngine.ensureContext();
      if (ctx && ctx.state === 'running' && !audioEngine.getIsPlaying() && settings.soundtrack !== 'muted') {
        audioEngine.startMusic();
      }
    } catch {
      // Browser autoplay policy
    }

    const unlockAudioAndPlay = () => {
      try {
        audioEngine.ensureContext();
        if (!audioEngine.getIsPlaying() && settings.soundtrack !== 'muted') {
          audioEngine.startMusic();
        }
      } catch {
        // ignored
      }
    };

    window.addEventListener('pointerdown', unlockAudioAndPlay, { passive: true });
    window.addEventListener('keydown', unlockAudioAndPlay, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudioAndPlay);
      window.removeEventListener('keydown', unlockAudioAndPlay);
    };
  }, [currentScreen, settings.soundtrack]);

  const currentModeHighScore = highScores[mode]?.[0]?.score || 0;

  // Background styling
  const backgroundStyle =
    settings.backgroundColor === '#121316'
      ? 'linear-gradient(180deg, #DCE9F5 0%, #BFD8EE 40%, #A8C9E4 100%)'
      : settings.backgroundColor;

  // Render Main Menu screen
  if (currentScreen === 'menu') {
    return (
      <>
        <MainMenu
          onStartGame={(newMode) => startNewGame(newMode)}
          hasActiveGame={hasActiveSession}
          onResumeGame={() => {
            setCurrentScreen('game');
            audioEngine.ensureContext();
            if (settings.soundtrack !== 'muted') {
              audioEngine.startMusic();
            }
          }}
          activeMode={mode}
          highScores={highScores}
          settings={settings}
          onOpenColorPalette={() => {
            setMenuInitialTab('palette');
            setIsMenuOpen(true);
          }}
          onOpenSoundtrack={() => {
            setMenuInitialTab('soundtrack');
            setIsMenuOpen(true);
          }}
        />

        <MenuModal
          isOpen={isMenuOpen}
          onClose={() => {
            if (isGameOver) {
              startNewGame(mode);
            }
            setIsMenuOpen(false);
          }}
          initialTab={menuInitialTab}
          activeMode={mode}
          onSelectMode={(newMode) => startNewGame(newMode)}
          onRestartCurrentGame={() => startNewGame(mode)}
          onGoToMainMenu={() => {
            if (isGameOver) {
              startNewGame(mode);
            }
            setCurrentScreen('menu');
          }}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          highScores={highScores}
          stats={stats}
        />
      </>
    );
  }

  // Render In-Game Screen (Stacked exactly like the screenshot, zero footer buttons)
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start px-2 pb-2 sm:px-4 sm:pb-4 select-none touch-none overflow-hidden transition-colors duration-300"
      style={{
        background: backgroundStyle,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2.5rem)',
      }}
    >
      {/* 1. Stacked Top Bar: Circular (+) Button (opens menu) & Mode/Best Info with M and B aligned */}
      <GameHeader
        score={score}
        highScore={currentModeHighScore}
        level={level}
        mode={mode}
        dropsRemaining={dropsRemaining}
        totalDropsRequired={totalDropsRequired}
        onOpenMenu={() => {
          setMenuInitialTab('modes');
          setIsMenuOpen(true);
        }}
        cascadeWave={currentCombo}
        lastPointsAdded={lastPointsAdded}
      />

      {/* 2. Main Game Centerpiece: Translucent White Top Cells + 7x7 Grid with Visible Lines */}
      <main className="w-full flex flex-col items-center mt-1">
        <GameBoard
          board={board}
          currentDisc={currentDisc}
          nextDisc={nextDisc}
          onDropInColumn={handleDropInColumn}
          isProcessing={isProcessing}
          activeHoverColumn={activeHoverColumn}
          setActiveHoverColumn={setActiveHoverColumn}
          floatingScores={floatingScores}
          cascadeWave={currentCombo}
          fallingDisc={fallingDisc}
        />
      </main>

      {/* Clean Bottom Spacing - Zero advertisements, zero clutter */}
      <div className="w-full max-w-[420px] h-3" />

      {/* Menu & Preferences Modal */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => {
          if (isGameOver) {
            startNewGame(mode);
          }
          setIsMenuOpen(false);
        }}
        initialTab={menuInitialTab}
        activeMode={mode}
        onSelectMode={(newMode) => startNewGame(newMode)}
        onRestartCurrentGame={() => startNewGame(mode)}
        onGoToMainMenu={() => {
          if (isGameOver) {
            startNewGame(mode);
          }
          setCurrentScreen('menu');
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        highScores={highScores}
        stats={stats}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        score={score}
        level={level}
        maxCombo={maxComboThisGame}
        mode={mode}
        isNewHighScore={isNewHighScore}
        highScores={highScores[mode] || []}
        onPlayAgain={() => startNewGame(mode)}
        onOpenMenu={() => {
          startNewGame(mode);
          setMenuInitialTab('modes');
          setIsMenuOpen(true);
        }}
        onGoToMainMenu={() => {
          startNewGame(mode);
          setCurrentScreen('menu');
        }}
      />
    </div>
  );
}
