import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const initialGrid = Array(10).fill(0).map(() => Array(10).fill(0));

const getRandomEmptyPosition = (grid) => {
  let emptyCells = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === 0) {
        emptyCells.push({ x: i, y: j });
      }
    }
  }
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

const generateTrees = (grid, numTrees) => {
  let newGrid = [...grid];
  for (let i = 0; i < numTrees; i++) {
    const pos = getRandomEmptyPosition(newGrid);
    if (pos) {
      newGrid[pos.x][pos.y] = 3; // 树的位置
    }
  }
  return newGrid;
};

const App = () => {
  const [grid, setGrid] = useState(() => {
    const newGrid = generateTrees([...initialGrid], 5); // 生成 5 棵树
    newGrid[5][5] = 2; // 鼹鼠初始位置
    newGrid[2][3] = 1; // 初始大便位置
    return newGrid;
  });

  const [molePosition, setMolePosition] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      moveMole(event.data);  // 根据 Arduino 数据移动鼹鼠
    };

    return () => {
      ws.close();
    };
  }, []);

  const moveMole = (direction) => {
    const { x, y } = molePosition;
    let newX = x, newY = y;

    if (direction === 'up' && x > 0) newX -= 1;
    if (direction === 'down' && x < 9) newX += 1;
    if (direction === 'left' && y > 0) newY -= 1;
    if (direction === 'right' && y < 9) newY += 1;

    if (grid[newX][newY] !== 3) {
      const newGrid = [...grid];
      if (grid[newX][newY] === 1) {
        newGrid[newX][newY] = 0;
        setScore(score + 1);

        if (audioRef.current) {
          audioRef.current.play();
        }

        const newPoopPosition = getRandomEmptyPosition(newGrid);
        if (newPoopPosition) {
          newGrid[newPoopPosition.x][newPoopPosition.y] = 1;
        }
      }
      newGrid[x][y] = 0;
      newGrid[newX][newY] = 2;
      setGrid(newGrid);
      setMolePosition({ x: newX, y: newY });
    }
  };

  return (
    <div className="app-container">
      <div className="score-display">Score: {score}</div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className={`cell ${cell === 1 ? 'poop' : cell === 2 ? 'mole' : cell === 3 ? 'tree' : ''}`}>
                {cell === 2 ? <img src="liu.png" alt="Mole" className="mole-image" /> : cell === 1 ? '💩' : cell === 3 ? '🌳' : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      <audio ref={audioRef} src="bgm.MP3" preload="auto"></audio>
    </div>
  );
};

export default App;
