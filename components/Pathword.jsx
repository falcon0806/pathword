"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";



// Daily puzzles with unique clues for 10 days
const dailyPuzzles = [
  {
    date: "2025-05-07",
    grid: [
      ["T", "G", "Q", "H", "W", "O"],
      ["F", "R", "S", "M", "L", "A"],
      ["E", "C", "I", "A", "P", "D"],
      ["N", "E", "B", "U", "C", "G"],
      ["M", "Z", "O", "T", "Y", "E"],
      ["K", "V", "X", "J", "N", "R"]
    ],
    clues: [
      "The path begins in the first row.",
      "The second letter appears in the second column.",
      "The third letter is in row 3.",
      "The fourth letter is in the same column as the second letter.",
      "The fifth letter comes after the fourth letter alphabetically.",
      "The path ends with the letter that appears in row 6, column 6."
    ],
    answer: "TRACER"
  },
  {
    date: "2025-05-08",
    grid: [
      ["P", "Q", "V", "B", "W", "N"],
      ["S", "A", "T", "F", "Y", "D"],
      ["H", "E", "O", "X", "G", "L"],
      ["M", "C", "I", "K", "U", "Z"],
      ["R", "J", "O", "P", "L", "A"],
      ["B", "N", "D", "S", "H", "E"]
    ],
    clues: [
      "The first letter is in the top row.",
      "No vowels appear in the first three letters of the path.",
      "The third letter appears in row 2, column 3.",
      "The fourth letter is in the same row as the second letter.",
      "The fifth letter is in column 1.",
      "The path ends with a vowel in the bottom row."
    ],
    answer: "PALACE"
  },
  {
    date: "2025-05-09",
    grid: [
      ["M", "J", "S", "W", "D", "G"],
      ["O", "C", "A", "K", "N", "Y"],
      ["B", "U", "R", "Q", "I", "P"],
      ["L", "S", "V", "T", "E", "F"],
      ["O", "H", "Z", "X", "M", "A"],
      ["W", "E", "T", "D", "R", "N"]
    ],
    clues: [
      "The path starts with the letter that appears in row 2, column 3.",
      "The second letter is found in column 5.",
      "The third letter appears in the same row as the first letter.",
      "The fourth letter is in row 4.",
      "The fifth letter is two rows below the fourth letter.",
      "The last letter is the final letter of the alphabet among all letters in row 6."
    ],
    answer: "ACTION"
  },
  {
    date: "2025-05-10",
    grid: [
      ["F", "G", "B", "W", "H", "Q"],
      ["D", "S", "I", "L", "A", "Y"],
      ["P", "N", "E", "M", "R", "K"],
      ["J", "O", "A", "T", "Z", "U"],
      ["V", "C", "X", "E", "B", "G"],
      ["W", "D", "L", "S", "H", "M"]
    ],
    clues: [
      "The path begins with a letter in row 2, column 5.",
      "The second letter is in the column to the left of the first letter.",
      "The third letter is in row 3.",
      "The fourth letter appears at the center of the grid.",
      "The fifth letter is directly below the fourth letter.",
      "The path ends with a letter in the bottom row."
    ],
    answer: "ARITEM"
  },
  {
    date: "2025-05-11",
    grid: [
      ["C", "K", "M", "X", "B", "A"],
      ["Y", "L", "H", "G", "V", "O"],
      ["S", "I", "T", "N", "Z", "P"],
      ["U", "R", "D", "A", "W", "K"],
      ["E", "M", "J", "F", "L", "C"],
      ["Q", "O", "B", "S", "T", "H"]
    ],
    clues: [
      "The first letter appears in row 1.",
      "The second letter is in row 3, column 3.",
      "The third letter is two columns to the right of the second letter.",
      "The fourth letter is a vowel that appears in row 4.",
      "The fifth letter is in the same column as the first letter.",
      "The last letter is in row 5, column 6."
    ],
    answer: "CTNAKC"
  },
  {
    date: "2025-05-12",
    grid: [
      ["B", "R", "Z", "P", "K", "D"],
      ["E", "A", "L", "Y", "M", "T"],
      ["W", "O", "F", "X", "S", "I"],
      ["V", "H", "N", "U", "G", "C"],
      ["J", "Q", "P", "B", "R", "E"],
      ["Y", "X", "D", "A", "W", "L"]
    ],
    clues: [
      "The path begins with a letter in the second row.",
      "The second letter is in column 5 and is not a vowel.",
      "The third letter is adjacent to a vowel.",
      "The fourth letter is in row 3.",
      "The fifth letter is in the same column as the first letter.",
      "The path ends with a letter in row 6, column 4."
    ],
    answer: "AMSEA"
  },
  {
    date: "2025-05-13",
    grid: [
      ["W", "Y", "S", "G", "L", "D"],
      ["P", "O", "R", "M", "T", "V"],
      ["I", "Z", "B", "U", "F", "A"],
      ["N", "K", "Q", "H", "E", "J"],
      ["X", "C", "W", "S", "T", "G"],
      ["Y", "E", "M", "L", "D", "R"]
    ],
    clues: [
      "The first letter is in the top half of the grid.",
      "The second letter is in row 3.",
      "The third letter appears in column 4.",
      "The fourth letter is a vowel in row 4.",
      "The fifth letter is in the same column as the second letter.",
      "The last letter is in the bottom row and is a consonant."
    ],
    answer: "WUHCR"
  },
  {
    date: "2025-05-14",
    grid: [
      ["V", "A", "J", "M", "Y", "P"],
      ["T", "E", "B", "K", "Q", "F"],
      ["L", "O", "C", "Z", "X", "S"],
      ["I", "N", "R", "G", "D", "W"],
      ["H", "U", "V", "A", "T", "E"],
      ["M", "J", "B", "Y", "P", "L"]
    ],
    clues: [
      "The path begins in row 1, column 2.",
      "The second letter is two rows below the first letter.",
      "The third letter is in column 3.",
      "The fourth letter is in the same row as the third letter.",
      "The fifth letter is in column 4.",
      "The path ends with the letter in row 5, column 6."
    ],
    answer: "AORDE"
  },
  {
    date: "2025-05-15",
    grid: [
      ["M", "F", "D", "S", "B", "Z"],
      ["N", "O", "T", "C", "W", "J"],
      ["A", "H", "R", "Y", "P", "K"],
      ["X", "I", "G", "L", "V", "Q"],
      ["U", "E", "A", "F", "D", "S"],
      ["Z", "M", "T", "O", "W", "R"]
    ],
    clues: [
      "The first letter is in row 2.",
      "The second letter is in the row above the first letter.",
      "The third letter is in column 2.",
      "The fourth letter is a vowel in row 4.",
      "The fifth letter appears in column 3.",
      "The path ends with a letter that appears in the bottom row."
    ],
    answer: "TFIAR"
  },
  {
    date: "2025-05-16",
    grid: [
      ["P", "G", "Z", "K", "X", "C"],
      ["B", "L", "I", "S", "Q", "N"],
      ["H", "A", "Y", "D", "M", "V"],
      ["T", "F", "R", "E", "W", "O"],
      ["J", "U", "G", "B", "Z", "P"],
      ["C", "K", "S", "H", "L", "Y"]
    ],
    clues: [
      "The path begins with a letter in row 3, column 2.",
      "The second letter is in a row above the first letter.",
      "The third letter is two columns to the right of the second letter.",
      "The fourth letter is in row 4.",
      "The fifth letter is in column 6.",
      "The path ends with a letter in the bottom half of the grid."
    ],
    answer: "AISOP"
  }
];

export default function Pathword() {
  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Find today's puzzle or default to the first one
  const findTodaysPuzzle = () => {
    const todayString = getTodayString();
    return dailyPuzzles.find(p => p.date === todayString) || dailyPuzzles[0];
  };

  const [currentPuzzle, setCurrentPuzzle] = useState(findTodaysPuzzle());
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState("");
  const [selectedDate, setSelectedDate] = useState(currentPuzzle.date);

  // Check the answer
  const checkAnswer = () => {
    if (guess.toUpperCase() === currentPuzzle.answer) {
      setResult("Correct! You found the path.");
    } else {
      setResult("Incorrect. Try again.");
    }
  };

  // Change puzzle when date changes
  const changePuzzle = (date) => {
    const puzzle = dailyPuzzles.find(p => p.date === date) || dailyPuzzles[0];
    setCurrentPuzzle(puzzle);
    setSelectedDate(date);
    setGuess("");
    setResult("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 font-serif bg-white">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h1 className="text-4xl font-bold text-center mb-2">Pathword</h1>
        <p className="text-center text-gray-600 text-sm">
          Find the 6-letter word hidden in the grid using the clues
        </p>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Date:</label>
        <select 
          value={selectedDate} 
          onChange={(e) => changePuzzle(e.target.value)}
          className="border border-gray-300 rounded p-2 w-full"
        >
          {dailyPuzzles.map(puzzle => (
            <option key={puzzle.date} value={puzzle.date}>
              {new Date(puzzle.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-6 gap-1 border-2 border-gray-800 p-1 mb-6 mx-auto w-fit">
        {currentPuzzle.grid.map((row, rIdx) =>
          row.map((letter, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className="w-10 h-10 md:w-12 md:h-12 border border-gray-800 flex items-center justify-center text-lg font-bold bg-white"
            >
              {letter}
            </div>
          ))
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-2">Clues:</h2>
          <ul className="list-disc pl-5 space-y-2">
            {currentPuzzle.clues.map((clue, index) => (
              <li key={index} className="text-gray-800">{clue}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-2 items-center">
        <Input
          placeholder="Enter your 6-letter answer"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          className="w-full md:w-64 border-2 border-gray-800"
          maxLength={6}
        />
        <Button 
          onClick={checkAnswer}
          className="bg-black hover:bg-gray-800 text-white w-full md:w-auto"
        >
          Check Answer
        </Button>
        
        {result && (
          <div className={`ml-0 md:ml-4 text-lg font-medium mt-2 md:mt-0 ${result.includes("Correct") ? "text-green-600" : "text-red-600"}`}>
            {result}
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-bold mb-1">How to Play:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Find a 6-letter word by creating a path through the letters in the grid.</li>
          <li>Use the clues to determine which letters to include.</li>
          <li>Each letter in your answer must follow the path constraints indicated by the clues.</li>
          <li>Enter your answer and check if you're correct!</li>
        </ol>
      </div>
    </div>
  );
}