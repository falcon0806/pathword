"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button"; // Make sure this path is correct for your setup
import {
  Lock,
  BarChart3,
  HelpCircle,
  Share2,
  X as CloseIcon,
} from "lucide-react"; // Added CloseIcon
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // Make sure this path is correct for your setup

// Daily puzzles data
const dailyPuzzles = [
  {
    date: "2024-07-27", // Use today's date or a date you want to test
    grid: [
      ["S", "L", "E", "E", "K", "X"],
      ["T", "A", "B", "L", "E", "T"],
      ["Y", "L", "R", "R", "N", "G"], // Revealed 'R'
      ["L", "E", "I", "N", "S", "E"],
      ["I", "N", "D", "C", "R", "Y"],
      ["S", "G", "O", "H", "G", "D"],
    ],
    answer: "STRING", // Example answer
    revealedLetter: { row: 2, col: 3, letter: "R" }, // This col is original
    clues: [
      { position: 1, description: "Often coiled or stretched." },
      { position: 4, description: "The ninth letter of the alphabet." },
      { position: 6, description: "Found at the end of 'king'." },
    ],
  },
  // Add other puzzles here
];

// --- ClueCard Component ---
function ClueCard({ clue, isUnlocked, isFlipped, onToggleFlip, onUnlock }) {
  const handleCardClick = () => {
    if (!isUnlocked) onUnlock();
    onToggleFlip();
  };
  return (
    <div
      className="perspective w-48 h-28 cursor-pointer group flex-shrink-0"
      onClick={handleCardClick}
    >
      <div
        className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <div
          className={`absolute w-full h-full backface-hidden bg-white border ${
            isUnlocked ? "border-teal-300" : "border-gray-300"
          } rounded-lg flex flex-col items-center justify-center shadow-sm group-hover:shadow-md transition-shadow p-2`}
        >
          {!isUnlocked && (
            <Lock className="w-6 h-6 text-gray-400 mb-1" strokeWidth={1.5} />
          )}
          <span
            className={`text-lg font-semibold ${
              isUnlocked ? "text-teal-700" : "text-gray-500"
            }`}
          >
            Clue {clue.position}
          </span>
          <span className="text-xs text-gray-500 mt-1 text-center">
            {isUnlocked
              ? isFlipped
                ? "Showing Clue"
                : "Click to Reveal"
              : "Click to Unlock"}
          </span>
        </div>
        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-teal-50 border border-teal-300 rounded-lg flex flex-col items-center justify-center p-3 text-center shadow-sm">
          <p className="text-sm text-teal-800 font-medium leading-snug">
            {clue.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Pathword Component ---
export default function Pathword() {
  // Utility Functions (Defined BEFORE state)
  const getTodayString = () => {
    const today = new Date();
    // return "2024-07-27"; // Force date for testing
    return today.toISOString().split("T")[0];
  };

  const findTodaysPuzzle = useCallback(() => {
    const todayString = getTodayString();
    return dailyPuzzles.find((p) => p.date === todayString) || dailyPuzzles[0];
  }, []);

  // Fisher-Yates shuffle
  const shuffleArray = (array) => {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  };

  // State Declarations
  const [currentPuzzle, setCurrentPuzzle] = useState(() => findTodaysPuzzle());
  const [selectedPath, setSelectedPath] = useState([]); // Stores { row, col (original), letter }
  const [unlockedClues, setUnlockedClues] = useState([]);
  const [flippedClues, setFlippedClues] = useState([]);
  const [gameState, setGameState] = useState({
    status: "playing",
    points: 100,
  });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [pathCoords, setPathCoords] = useState([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    streak: 0,
    solves: { 0: 0, 1: 0, 2: 0, 3: 0, failed: 0 },
    lastSolveDate: null,
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [columnMapping, setColumnMapping] = useState(null); // Stores mapping: originalColIndex -> displayColIndex

  // Constants
  const GAME_URL = "https://your-pathword-game-url.com"; // <<< --- REPLACE WITH YOUR ACTUAL GAME URL
  const STATS_KEY = "pathwordUserStats";
  const HELP_VIEWED_KEY = "pathwordHelpViewed";
  const COLUMN_MAP_KEY_PREFIX = "pathwordColMap-"; // For localStorage
  const CELL_SIZE_APPROX = 56;

  // Refs
  const gridRef = useRef(null);
  const cellRefs = useRef({}); // Keyed by `row-originalCol`
  const feedbackTimeoutRef = useRef(null);

    // Effects
  useEffect(() => () => { if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current); }, []);
  const setCellRef = (row, originalCol, element) => { if (element) cellRefs.current[`${row}-${originalCol}`] = element; };

  useEffect(() => {
    const loadedStats = localStorage.getItem(STATS_KEY);
    if (loadedStats) {
      try {
        const parsedStats = JSON.parse(loadedStats);
        setUserStats({
            streak: parsedStats.streak || 0,
            solves: parsedStats.solves || { "0": 0, "1": 0, "2": 0, "3": 0, "failed": 0 },
            lastSolveDate: parsedStats.lastSolveDate || null
        });
      } catch (e) { console.error("Failed to parse stats:", e); }
    }

    // --- Column Mapping Logic ---
    const today = getTodayString(); // Get the date string once for this effect run
    const columnMapStorageKey = `${COLUMN_MAP_KEY_PREFIX}${today}`;
    let todaysMappingStr = localStorage.getItem(columnMapStorageKey);
    let parsedMapping = null;

    const gridCols = currentPuzzle.grid[0]?.length;

    if (todaysMappingStr && gridCols) {
      try {
        parsedMapping = JSON.parse(todaysMappingStr);
        if (!Array.isArray(parsedMapping) || parsedMapping.length !== gridCols) {
          console.warn("Invalid column mapping length found. Regenerating.");
          parsedMapping = null;
        } else {
          const sorted = [...parsedMapping].sort((a,b)=> a-b);
          let isValidPermutation = true;
          for(let i=0; i< gridCols; i++) {
            if(sorted[i] !== i) {
              isValidPermutation = false;
              break;
            }
          }
          if (!isValidPermutation) {
            console.warn("Invalid column mapping content. Regenerating.");
            parsedMapping = null;
          }
        }
      } catch (e) { console.error("Failed to parse column mapping, regenerating.", e); parsedMapping = null; }
    }

    if (!parsedMapping && gridCols) {
      const initialMapping = Array.from({ length: gridCols }, (_, i) => i);
      parsedMapping = shuffleArray([...initialMapping]);
      localStorage.setItem(columnMapStorageKey, JSON.stringify(parsedMapping));
    }
    setColumnMapping(parsedMapping); // This is the setState call

    // --- Help Viewed Logic ---
    const helpViewed = localStorage.getItem(HELP_VIEWED_KEY);
    if (!helpViewed) {
      setIsFirstVisit(true);
      setIsHelpOpen(true);
      localStorage.setItem(HELP_VIEWED_KEY, "true");
    }
  // Only depend on currentPuzzle.grid changing.
  // getTodayString is stable, so its value can be captured inside.
  // setColumnMapping, setIsFirstVisit, setIsHelpOpen are stable from useState.
  }, [currentPuzzle.grid]);

  // --- (Rest of stats, path calculation, core game logic functions remain largely the same,
  // but ensure they use ORIGINAL column indices for selectedPath and rules) ---

 const saveStats = (stats) => { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) { console.error("Failed to save stats:", e); }};

 const updateStatsOnSuccess = (cluesUsed) => { const todayStr = getTodayString(); setUserStats(prevStats => { let newStreak = prevStats.streak; const lastSolve = prevStats.lastSolveDate; if (lastSolve) { const lastDate = new Date(lastSolve); const todayDate = new Date(todayStr); const diffTime = todayDate - lastDate; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays === 1) newStreak += 1; else if (diffDays > 1) newStreak = 1; } else newStreak = 1; const newSolves = { ...prevStats.solves }; const cluesKey = String(cluesUsed); if (newSolves.hasOwnProperty(cluesKey)) newSolves[cluesKey] = (newSolves[cluesKey] || 0) + 1; const newStats = { ...prevStats, streak: newStreak, solves: newSolves, lastSolveDate: todayStr }; saveStats(newStats); return newStats; }); };
  // Path Coordinate Calculation Effect - This should work as selectedPath stores original cols,
  // and cellRefs are keyed by original cols, pointing to the displayed DOM elements.
  useEffect(() => {
    if (!columnMapping || !gridRef.current || selectedPath.length < 2) {
      setPathCoords([]);
      return;
    }
    const calculateCoords = () => {
        const gridRect = gridRef.current?.getBoundingClientRect(); if (!gridRect) return;
        const newCoords = [];
        for (let i = 0; i < selectedPath.length - 1; i++) {
            const startItem = selectedPath[i]; // {row, col (original)}
            const endItem = selectedPath[i+1];   // {row, col (original)}

            const startCellKey = `${startItem.row}-${startItem.col}`;
            const endCellKey = `${endItem.row}-${endItem.col}`;
            const startElem = cellRefs.current[startCellKey];
            const endElem = cellRefs.current[endCellKey];

            if (startElem && endElem) {
                const cellRadius = startElem.offsetWidth / 2; // Assuming cells are same size
                const startRect = startElem.getBoundingClientRect();
                const endRect = endElem.getBoundingClientRect();
                const cx1 = startRect.left + startRect.width / 2 - gridRect.left, cy1 = startRect.top + startRect.height / 2 - gridRect.top;
                const cx2 = endRect.left + endRect.width / 2 - gridRect.left, cy2 = endRect.top + endRect.height / 2 - gridRect.top;
                const dx = cx2 - cx1, dy = cy2 - cy1; const dist = Math.sqrt(dx * dx + dy * dy); if (dist === 0) continue;
                const nx = dx / dist, ny = dy / dist; const x1 = cx1 + nx * cellRadius, y1 = cy1 + ny * cellRadius;
                const x2 = cx2 - nx * cellRadius, y2 = cy2 - ny * cellRadius;
                newCoords.push({ x1, y1, x2, y2, id: `${startCellKey}_${endCellKey}` });
            }
        }
        setPathCoords(newCoords);
    };
    calculateCoords();
    const resizeObserver = new ResizeObserver(calculateCoords);
    if (gridRef.current) resizeObserver.observe(gridRef.current);
    return () => resizeObserver.disconnect();
  }, [selectedPath, columnMapping]); // Ensure columnMapping is a dependency

  // Core Game Logic Functions - All 'col' parameters now refer to ORIGINAL column index
    // Core Game Logic Functions
  const canSelectCell = (row, originalCol) => {
        if (gameState.status !== 'playing') return false;

        const isTheRevealedCell = currentPuzzle.revealedLetter &&
                               currentPuzzle.revealedLetter.row === row &&
                               currentPuzzle.revealedLetter.col === originalCol;

        // Rule 1: First letter selection
        if (selectedPath.length === 0) {
            // Can only select from the first row (row 0).
            // The revealed letter, even if in row 0, is not special for the *first click*
            // unless the game explicitly starts with it selected (which is not our current design).
            return row === 0;
        }

        // Rule 2: Subsequent letter selection
        const lastSelected = selectedPath[selectedPath.length - 1];

        // Must be in the next row numerically after the last selected cell
        if (row !== lastSelected.row + 1) return false;

        // Cannot select from a column already used in the path
        // This check includes the revealed letter's column if it's already part of the path.
        if (selectedPath.some(p => p.col === originalCol)) return false;

        // If all above pass, the cell is selectable.
        // The fact that it might be the 'revealedLetter' is handled by styling,
        // its selectability is based on standard path rules.
        return true;
   };

    const handleCellSelect = (row, originalCol, letter) => {
        if (gameState.status !== 'playing') return;
        if (feedbackMessage) setFeedbackMessage("");
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);

        // isRevealed is still useful for the path entry data
        const isRevealedCell = currentPuzzle.revealedLetter &&
                             currentPuzzle.revealedLetter.row === row &&
                             currentPuzzle.revealedLetter.col === originalCol;

        const cellKey = `${row}-${originalCol}`;
        const element = cellRefs.current[cellKey]; // Ref key uses originalCol
        const existingIndex = selectedPath.findIndex(p => p.row === row && p.col === originalCol);

        if (existingIndex !== -1) {
            // If cell is already selected, deselect it and subsequent ones
            setSelectedPath(selectedPath.slice(0, existingIndex));
        } else {
            // Check if selection is valid according to rules (now stricter for revealed letter)
            if (canSelectCell(row, originalCol)) {
                const newPathEntry = { row, col: originalCol, letter, element, isRevealed: isRevealedCell };
                const newPath = [...selectedPath, newPathEntry];
                setSelectedPath(newPath);

                if (newPath.length === currentPuzzle.grid.length) {
                    checkAnswer(newPath);
                }
            }
        }
   };

  const checkAnswer = (path) => {
    // path contains {row, col (original), letter}
    const pathWord = path.map((p) => p.letter).join("");
    if (pathWord === currentPuzzle.answer) {
      setGameState((prev) => ({ ...prev, status: "success" }));
      setFeedbackMessage("");
      const cluesUsed = unlockedClues.length;
      updateStatsOnSuccess(cluesUsed);
      setTimeout(() => {
        setShowSuccessPopup(true);
        setIsStatsOpen(true);
      }, 2000);
    } else {
      setFeedbackMessage("Incorrect path. Try adjusting!");
      feedbackTimeoutRef.current = setTimeout(
        () => setFeedbackMessage(""),
        3000
      );
    }
  };
  const handleUnlockClue = (index) => {
    if (!unlockedClues.includes(index) && gameState.status === "playing") {
      setUnlockedClues((prev) => [...prev, index]);
      setGameState((prev) => ({
        ...prev,
        points: Math.max(0, prev.points - 25),
      }));
    }
  };
  const handleToggleFlip = (index) => {
    if (unlockedClues.includes(index)) {
      setFlippedClues((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    }
  };
  const resetGame = () => {
    setSelectedPath([]);
    setUnlockedClues([]);
    setFlippedClues([]);
    setPathCoords([]);
    setFeedbackMessage("");
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setGameState({ status: "playing", points: 100 });
    setShowSuccessPopup(false);
    setIsStatsOpen(false); /* Column mapping for the day persists */
  };

  // Cell Styling Function - Takes originalCol
      // Cell Styling Function - Takes originalCol
    const getCellClassName = (row, originalCol) => {
      const isSelected = selectedPath.some(p => p.row === row && p.col === originalCol);
      const isInCorrectPath = gameState.status === 'success' && isSelected;
      const isTheRevealedCell = currentPuzzle.revealedLetter &&
                             currentPuzzle.revealedLetter.row === row &&
                             currentPuzzle.revealedLetter.col === originalCol;
      const isSelectable = canSelectCell(row, originalCol); // This now correctly evaluates revealed cells

      let baseStyle = `w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl md:text-3xl font-medium rounded-full relative transition-all duration-300 ease-in-out z-10`;
      let backgroundStyle = 'bg-transparent';
      let textStyle = 'text-gray-700';
      let interactionStyle = 'cursor-default';

      if (isInCorrectPath) {
        backgroundStyle = 'bg-green-300 scale-110 shadow-md'; textStyle = 'text-green-900 font-semibold';
      } else if (isSelected) {
        backgroundStyle = 'bg-blue-300 scale-110 shadow-md'; textStyle = 'text-blue-900 font-semibold'; interactionStyle = 'cursor-pointer';
      } else if (isTheRevealedCell && !isSelected) { // Styling for revealed but not yet selected
        backgroundStyle = 'bg-green-200'; // Highlight it
        textStyle = 'text-green-800 font-semibold';
        // Clickability depends on whether the path allows it
        interactionStyle = gameState.status === 'playing' && isSelectable ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-80';
      } else if (gameState.status === 'playing') {
        if (isSelectable) {
            textStyle = 'text-black hover:text-blue-600'; interactionStyle = 'cursor-pointer hover:scale-105';
        } else {
            textStyle = 'text-gray-400'; interactionStyle = 'cursor-not-allowed opacity-50';
        }
      } else { // Game over, not selected
        textStyle = 'text-gray-400 opacity-60';
      }
      return `${baseStyle} ${backgroundStyle} ${textStyle} ${interactionStyle}`;
    };

  // --- Share Functionality: Updated for Path Concept & Emoji Grid ---
  const handleShare = async () => {
    if (isCopying || !columnMapping) return; // Ensure columnMapping is loaded
    setIsCopying(true);

    const cluesUsed = unlockedClues.length;
    let achievementText = "";
    if (cluesUsed === 0) achievementText = "flawlessly with NO clues! 🏅";
    else if (cluesUsed === 1) achievementText = "with just 1 clue! ✨";
    else achievementText = `using ${cluesUsed} clues!`;

    let pathGridEmoji = "";
    const gridRows = currentPuzzle.grid.length;
    const gridCols = currentPuzzle.grid[0]?.length || 0;

    for (let r = 0; r < gridRows; r++) {
      for (let dc = 0; dc < gridCols; dc++) {
        // dc is displayColumn
        // Find the original column index that is being displayed at dc
        let originalColAtThisDisplaySlot = -1;
        for (let i = 0; i < columnMapping.length; i++) {
          if (columnMapping[i] === dc) {
            originalColAtThisDisplaySlot = i;
            break;
          }
        }

        const pathIndex = selectedPath.findIndex(
          (p) => p.row === r && p.col === originalColAtThisDisplaySlot
        );

        if (pathIndex !== -1) {
          // If the cell (r, originalColAtThisDisplaySlot) is part of the selected path
          if (pathIndex === selectedPath.length - 1) {
            // Last item in path
            pathGridEmoji += "🎯";
          } else {
            // Next selected item in path (original column)
            const nextPathItemOriginalCol = selectedPath[pathIndex + 1].col;
            // Find where this nextPathItemOriginalCol is displayed
            const nextPathItemDisplayCol =
              columnMapping[nextPathItemOriginalCol];

            if (nextPathItemDisplayCol < dc) pathGridEmoji += "↙️";
            else if (nextPathItemDisplayCol > dc) pathGridEmoji += "↘️";
            else pathGridEmoji += "⬇️";
          }
        } else {
          pathGridEmoji += "⬜";
        }
      }
      if (r < gridRows - 1) pathGridEmoji += "\n";
    }

    const shareText = `I navigated today's Pathword ${getTodayString()}! 🗺️\n\nMy Journey:\n${pathGridEmoji}\n\nSolved ${achievementText}\n\nChart your own course: ${GAME_URL}\n#PathwordGame #DailyPuzzle #BrainTeaser`;

    try {
      await navigator.clipboard.writeText(shareText);
      alert("Pathword journey copied! Ready to share your adventure?");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy. Please try again or copy manually.");
    } finally {
      setTimeout(() => setIsCopying(false), 1500);
    }
  };

  // --- UI Rendering Functions ---
  const renderGrid = () => {
    if (
      !columnMapping ||
      !currentPuzzle.grid ||
      currentPuzzle.grid.length === 0
    ) {
      return (
        <div className="h-96 flex items-center justify-center text-gray-500">
          Loading Grid...
        </div>
      );
    }
    const gridRows = currentPuzzle.grid.length;
    const gridCols = currentPuzzle.grid[0].length;
    const gap = "0.75rem";

    // Create the displayGrid using the columnMapping
    const displayGridLetters = currentPuzzle.grid.map((originalRow) => {
      const displayedRow = new Array(gridCols);
      for (let originalCol = 0; originalCol < gridCols; originalCol++) {
        const displayCol = columnMapping[originalCol]; // Get where originalCol's letter should be displayed
        displayedRow[displayCol] = originalRow[originalCol];
      }
      return displayedRow;
    });

    return (
      <div
        ref={gridRef}
        className="relative p-1 mx-auto mb-6"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: gap,
          width: `calc(${gridCols} * 3.5rem + ${gridCols} * ${gap})`,
          maxWidth: "100%",
        }}
      >
        {/* Iterate through displayGrid for rendering order */}
        {displayGridLetters.map((rowLetters, rowIndex) =>
          rowLetters.map((letter, displayColIndex) => {
            // Find the original column index for the letter at this display position
            // The letter at displayGridLetters[rowIndex][displayColIndex]
            // came from currentPuzzle.grid[rowIndex][originalColForThisLetter]
            // where columnMapping[originalColForThisLetter] === displayColIndex
            let originalColIndex = -1;
            for (let i = 0; i < gridCols; i++) {
              if (columnMapping[i] === displayColIndex) {
                originalColIndex = i;
                break;
              }
            }
            // If originalColIndex is -1, it means something is wrong with mapping or grid.
            // This shouldn't happen if mapping is a valid permutation.
            if (originalColIndex === -1) {
              console.error(
                "Error finding original column for display column",
                displayColIndex,
                columnMapping
              );
              return null; // Or some error placeholder
            }

            return (
              <div
                key={`${rowIndex}-${displayColIndex}`}
                className="relative flex items-center justify-center"
                style={{ zIndex: 1 }}
              >
                {displayColIndex > 0 && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"
                    style={{
                      marginLeft: `calc(-${gap}/2)`,
                      height: "150%",
                      transform: "translate(-50%, -25%)",
                    }}
                  />
                )}
                {rowIndex > 0 && (
                  <div
                    className="absolute top-0 left-0 right-0 h-px bg-gray-200"
                    style={{
                      marginTop: `calc(-${gap}/2)`,
                      width: "150%",
                      transform: "translate(-25%, -50%)",
                    }}
                  />
                )}
                <button
                  ref={(el) => setCellRef(rowIndex, originalColIndex, el)} // Ref by original coordinates
                  onClick={() =>
                    handleCellSelect(rowIndex, originalColIndex, letter)
                  } // Logic uses original coordinates
                  disabled={
                    gameState.status !== "playing" &&
                    !selectedPath.some(
                      (p) => p.row === rowIndex && p.col === originalColIndex
                    )
                  }
                  className={`${getCellClassName(
                    rowIndex,
                    originalColIndex
                  )} z-10`} // Styling based on original coordinates
                  aria-label={`Letter ${letter} at row ${
                    rowIndex + 1
                  }, displayed column ${displayColIndex + 1}`}
                >
                  <span>{letter}</span>
                </button>
              </div>
            );
          })
        )}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-5"
          style={{ overflow: "visible" }}
          aria-hidden="true"
        >
          {" "}
          <defs>
            {" "}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {" "}
              <stop
                offset="0%"
                style={{
                  stopColor:
                    gameState.status === "success"
                      ? "rgb(134 239 172)"
                      : "rgb(147 197 253)",
                  stopOpacity: 1,
                }}
              />{" "}
              <stop
                offset="100%"
                style={{
                  stopColor:
                    gameState.status === "success"
                      ? "rgb(74 222 128)"
                      : "rgb(96 165 250)",
                  stopOpacity: 1,
                }}
              />{" "}
            </linearGradient>{" "}
          </defs>{" "}
          {pathCoords.map((coords) => (
            <line
              key={coords.id}
              x1={coords.x1}
              y1={coords.y1}
              x2={coords.x2}
              y2={coords.y2}
              stroke={`url(#lineGradient)`}
              strokeWidth="5"
              strokeLinecap="round"
              className="transition-all duration-300 ease-in-out"
            />
          ))}{" "}
        </svg>
      </div>
    );
  };

  const renderSelectedPathPreview = () => {
    const pathLength = currentPuzzle.grid.length;
    const pathMap = selectedPath.reduce((acc, item) => {
      acc[item.row] = item.letter;
      return acc;
    }, {});
    if (
      currentPuzzle.revealedLetter &&
      !pathMap[currentPuzzle.revealedLetter.row] &&
      currentPuzzle.revealedLetter.row < pathLength
    ) {
      pathMap[currentPuzzle.revealedLetter.row] =
        currentPuzzle.revealedLetter.letter;
    }
    return (
      <div className="flex space-x-2 mt-6 mb-6 justify-center items-start h-16">
        {" "}
        {[...Array(pathLength)].map((_, index) => {
          const letter = pathMap[index];
          const isRevealedSlot =
            currentPuzzle.revealedLetter &&
            currentPuzzle.revealedLetter.row === index;
          const isSelected = selectedPath.some((p) => p.row === index);
          return (
            <div key={index} className="flex flex-col items-center">
              {" "}
              <div
                className={`w-10 h-10 md:w-12 md:h-12 border-2 rounded-lg flex items-center justify-center text-lg md:text-xl font-semibold transition-colors duration-300 shadow ${
                  gameState.status === "success"
                    ? "border-green-400 text-green-700 bg-green-50"
                    : "border-gray-300"
                } ${
                  letter
                    ? isSelected
                      ? "text-blue-700 bg-blue-50 border-blue-400"
                      : isRevealedSlot
                      ? "text-green-700 bg-green-50 border-green-400"
                      : "text-gray-800"
                    : "text-gray-400 border-gray-200 bg-gray-50"
                } `}
              >
                {" "}
                {letter || ""}{" "}
              </div>{" "}
              <span className="mt-1 text-xs text-gray-500"> {index + 1} </span>{" "}
            </div>
          );
        })}{" "}
      </div>
    );
  };
  const renderCluesSection = () => (
    <div className="mt-2 mb-4 px-2 w-full max-w-full">
      {" "}
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
        Clues
      </h2>{" "}
      <div className="flex flex-row justify-center items-center gap-4 overflow-x-auto pb-2 px-2 no-scrollbar">
        {" "}
        {currentPuzzle.clues.length === 0 ? (
          <p className="text-gray-500 text-sm flex-shrink-0 px-4">
            No clues available.
          </p>
        ) : (
          currentPuzzle.clues
            .sort((a, b) => a.position - b.position)
            .map((clue, index) => (
              <ClueCard
                key={index}
                clue={clue}
                isUnlocked={unlockedClues.includes(index)}
                isFlipped={flippedClues.includes(index)}
                onUnlock={() => handleUnlockClue(index)}
                onToggleFlip={() => handleToggleFlip(index)}
              />
            ))
        )}{" "}
      </div>{" "}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>{" "}
    </div>
  );

  // --- Main Component Return (Structure remains the same, dialogs use existing logic) ---
  return (
    <div className="max-w-full mx-auto p-4 md:p-6 font-sans bg-teal-50 min-h-screen flex flex-col items-center">
      {/* Header */}
      <header className="text-center pt-6 pb-4 flex items-center justify-between px-4 md:px-0">
        <div className="w-16"></div>
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight mb-1">
            {" "}
            Pathword{" "}
          </h1>
          <p className="text-sm text-gray-600">
            {" "}
            Connect letters row by row to find the word.{" "}
          </p>
        </div>
        <div className="flex items-center justify-end">
          {/* Stats Dialog */}
          <Dialog
            open={isStatsOpen}
            onOpenChange={(open) => {
              setIsStatsOpen(open);
              if (!open) setShowSuccessPopup(false);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="View Stats">
                <BarChart3 className="h-6 w-6 text-gray-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-xl p-0">
              <DialogHeader className="flex flex-row justify-between items-center px-6 pt-5 pb-4 border-b border-gray-200">
                
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  
                  {showSuccessPopup
                    ? "Path Conquered!"
                    : "Your Journey Stats "}
                </DialogTitle>
                {/* <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  
                  <CloseIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  <span className="sr-only">Close</span>
                </DialogClose> */}
              </DialogHeader>
              <div className="p-6 text-gray-700">
                {" "}
                {showSuccessPopup && (
                  <p className="text-center text-md text-green-600 font-medium mb-5">
                    {" "}
                    Congratulations! You found:{" "}
                    <span className="font-bold">
                      {currentPuzzle.answer}
                    </span>{" "}
                  </p>
                )}{" "}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {" "}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    {" "}
                    <div className="text-3xl font-bold text-emerald-700">
                      {userStats.streak}
                    </div>{" "}
                    <div className="text-xs uppercase text-emerald-600 font-medium tracking-wide">
                      Path Streak
                    </div>{" "}
                  </div>{" "}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    {" "}
                    <div className="text-3xl font-bold text-emerald-700">
                      {" "}
                      {Object.values(userStats.solves).reduce(
                        (a, b) => a + b,
                        0
                      ) - (userStats.solves.failed || 0)}{" "}
                    </div>{" "}
                    <div className="text-xs uppercase text-emerald-600 font-medium tracking-wide">
                      Paths Found
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <h3 className="text-center font-semibold mb-3 text-gray-700 text-sm">
                  Explorer's Log{" "}
                  <span className="font-normal text-gray-500">
                    (by clues used)
                  </span>{" "}
                </h3>{" "}
                <div className="space-y-1.5 text-sm">
                  {" "}
                  {["0", "1", "2", "3"].map((clueCount) => (
                    <div
                      key={clueCount}
                      className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-md border border-slate-200"
                    >
                      {" "}
                      <span className="text-gray-600">
                        {clueCount} Clues:
                      </span>{" "}
                      <span className="font-semibold text-emerald-700">
                        {" "}
                        {userStats.solves[clueCount] || 0}{" "}
                      </span>{" "}
                    </div>
                  ))}{" "}
                </div>{" "}
              </div>
              <DialogFooter className="px-6 pb-6 pt-2 border-t border-gray-200">
                
                {showSuccessPopup ? (
                  <Button
                    onClick={handleShare}
                    disabled={isCopying}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm py-2.5"
                  >
                   
                    <Share2 className="h-4 w-4 mr-2" />
                    {isCopying ? "Path Copied! " : "Share Journey "}
                  </Button>
                ) : (
                  <DialogClose asChild>
                    
                    <Button
                      type="button"
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm py-2.5"
                    >
                      
                      Close
                    </Button>
                  </DialogClose>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
                      {/* Help Dialog */}
            <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
                 <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Help">
                        <HelpCircle className="h-6 w-6 text-gray-600" />
                    </Button>
                 </DialogTrigger>
                 {/* Help Content */}
                 <DialogContent className="bg-white rounded-lg shadow-xl p-0 sm:max-w-[41rem]">
                    <DialogHeader className="flex flex-row justify-center items-center px-6 pt-5 pb-4 border-b border-gray-200">
                        <DialogTitle className="text-lg font-semibold text-gray-900">How to Play Pathword</DialogTitle>
                        {/* <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <CloseIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            <span className="sr-only">Close</span>
                        </DialogClose> */}
                    </DialogHeader>
                    <div className="px-6 text-gray-700 space-y-4 text-sm leading-relaxed max-h-[70vh] overflow-y-auto"> {/* ADDED: max-h and overflow for height control */}
                        <p className="text-center text-base font-medium text-teal-700">
                        Chart Your Course, Find Your Pathword Daily!
                        </p>

                        <div>
                        <h3 className="font-semibold text-gray-800 mb-1.5">Your Mission:</h3>
                        <p>
                            Navigate the grid to uncover the hidden{" "}
                            <strong>{currentPuzzle.grid.length}-letter Pathword</strong>. Each day brings a new journey!
                        </p>
                        </div>

                        <div>
                        <h3 className="font-semibold text-gray-800 mb-1.5">The Pathfinding Rules:</h3>
                        <ol className="list-decimal pl-5 space-y-1.5">
                            <li>
                            Begin your expedition by selecting a letter from the{" "}
                            <strong>very first row</strong>.
                            </li>
                            <li>
                            Your next step must be to a letter in the row{" "}
                            <strong>directly below</strong> your current position.
                            </li>
                            <li>
                            Forge a unique path! You <strong>cannot revisit a column</strong> once a letter from it has been chosen.
                            </li>
                            <li>
                            Continue this way, one letter per row, until your path spans all{" "}
                            <strong>{currentPuzzle.grid.length} rows</strong>.
                            </li>
                        </ol>
                        </div>

                        <div>
                        <h3 className="font-semibold text-gray-800 mb-1.5">Helpful Hints:</h3>
                        <ul className="list-disc pl-5 space-y-1.5">
                            <li>
                            A <span className="text-green-700 font-semibold p-0.5 bg-green-100 rounded">green highlighted letter</span> on the grid is a free starting beacon, revealed for you!
                            </li>
                            <li>
                            Misstep? No worries! Simply tap the <strong>last letter you selected</strong> (it'll be <span className="text-blue-700 font-semibold p-0.5 bg-blue-100 rounded">blue</span>) to backtrack from that point.
                            </li>
                            <li>
                            Feeling stuck? You have <strong>3 Clue Cards</strong> available below the grid. Each card, marked with a number (1, 2, or 3), corresponds to a letter in the Pathword. Click a card to unlock its hint.
                            </li>
                        </ul>
                        </div>

                        <div>
                        <h3 className="font-semibold text-gray-800 mb-1.5">Your Goal:</h3>
                        <p>
                            Successfully chart the Pathword using the <strong className="text-teal-600">fewest clues possible</strong>. Can you achieve a flawless navigation?
                        </p>
                        </div>

                        <p className="text-center font-medium pt-2">Happy Pathfinding! ✨</p>
                    </div>
                    <DialogFooter className="px-6 pb-6 pt-4 border-t border-gray-200">
                       <DialogClose asChild>
                          <Button
                            type="button"
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-md text-sm py-2.5"
                          >
                            Let's Go!
                          </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
         </div>
      </header>
      <main className="flex-grow flex flex-col items-center w-full mt-4">
        {columnMapping ? (
          renderGrid()
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">
            Shuffling Path...
          </div>
        )}
        {renderSelectedPathPreview()}
        <div className="text-center h-8 mb-2 px-4 w-full">
          {" "}
          {gameState.status === "success" && !isStatsOpen && (
            <p className="text-green-600 font-semibold text-lg animate-pulse">
              {" "}
              Success! Word found: {currentPuzzle.answer}{" "}
            </p>
          )}{" "}
          {feedbackMessage && (
            <p className="text-red-600 font-semibold text-md">
              {" "}
              {feedbackMessage}{" "}
            </p>
          )}{" "}
          {gameState.status === "playing" && !feedbackMessage && (
            <div className="h-full"></div>
          )}{" "}
        </div>
        {renderCluesSection()}
      </main>
      <footer className="pb-6 px-4 text-center w-full mt-auto">
        {gameState.status === "playing" && selectedPath.length > 0 && (
          <Button
            onClick={resetGame}
            variant="outline"
            className="border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-full px-6 py-2 mb-6 shadow-sm"
          >
            {" "}
            Reset Path{" "}
          </Button>
        )}
        {/* <div className="text-xs text-gray-500 max-w-md mx-auto">
          {" "}
          <h3 className="font-semibold mb-1 text-gray-600">
            {" "}
            How to Play:{" "}
          </h3>{" "}
          <p>
            {" "}
            Select letters from top to bottom, one per row, using different
            columns. The{" "}
            <span className="text-green-700 font-semibold">
              {" "}
              green highlighted{" "}
            </span>{" "}
            letter is revealed. Click a selected letter to backtrack. Use clues
            for hints.{" "}
          </p>{" "}
        </div> */}
      </footer>
      <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        button {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .relative.flex.items-center.justify-center {
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
