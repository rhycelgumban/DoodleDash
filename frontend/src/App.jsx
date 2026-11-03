
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000/api/words/random'
const SCORE_API = 'http://localhost:5000/api/games/score'
const LEADERBOARD_API = 'http://localhost:5000/api/leaderboard'

const TOTAL_WORDS = 10
const DRAW_SECONDS = 5
const GUESS_SECONDS = 40

const COLORS = [
  '#29243b',
  '#f05d8b',
  '#8b5cf6',
  '#39966f',
  '#f59e0b',
  '#3999e6',
]

function App() {
  const [phase, setPhase] = useState('idle')
  const [roundWords, setRoundWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(DRAW_SECONDS)
  const [color, setColor] = useState(COLORS[0])
  const [brushSize, setBrushSize] = useState(5)
  const [previewHasDrawing, setPreviewHasDrawing] = useState(false)
  const [answers, setAnswers] = useState(Array(TOTAL_WORDS).fill(''))
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPlayConfirm, setShowPlayConfirm] = useState(false)

  const [playerName, setPlayerName] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [savingScore, setSavingScore] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)

  const canvasRef = useRef(null)
  const drawingRef = useRef(false)

  const previewCanvasRef = useRef(null)
  const previewDrawingRef = useRef(false)

  const finishedRef = useRef(false)
  const saveAttemptedRef = useRef(false)

  const currentWord = roundWords[currentIndex]
  const score = results.filter((result) => result.correct).length

  // FETCH A RANDOM WORD
  async function fetchRandomWord() {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error('Could not get a word from the database.')
    }

    const data = await response.json()

    if (!data.word) {
      throw new Error('The server did not return a word.')
    }

    return data.word
  }

  // FETCH TOP 5 LEADERBOARD
  async function fetchLeaderboard() {
    try {
      const response = await fetch(LEADERBOARD_API)

      if (!response.ok) {
        throw new Error('Could not load leaderboard.')
      }

      const data = await response.json()
      setLeaderboard(data)
    } catch (err) {
      console.error('Leaderboard error:', err)
    }
  }

  // LOAD LEADERBOARD WHEN HOME PAGE OPENS
  useEffect(() => {
    if (phase === 'idle') {
      fetchLeaderboard()
    }
  }, [phase])

  // START GAME: OPEN NAME ENTRY
  function startGame() {
    setPlayerName('')
    setError('')
    setPhase('name')
  }

  // PREPARE THE GAME AFTER NAME ENTRY
  async function prepareGame() {
    setLoading(true)
    setError('')
    setRoundWords([])
    setAnswers(Array(TOTAL_WORDS).fill(''))
    setResults([])
    setScoreSaved(false)
    setSavingScore(false)
    saveAttemptedRef.current = false
    setCurrentIndex(0)
    finishedRef.current = false

    try {
      const selected = new Set()
      let attempts = 0

      while (selected.size < TOTAL_WORDS && attempts < 100) {
        const word = await fetchRandomWord()
        selected.add(word)
        attempts++
      }

      if (selected.size < TOTAL_WORDS) {
        throw new Error(
          'Unable to collect 10 unique words. Check your word stock.'
        )
      }

      const newRound = [...selected].map((word) => ({
        word,
        drawing: null,
      }))

      setRoundWords(newRound)
      setShowPlayConfirm(false)
      setPhase('setup')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Could not start the game. Check your backend.')
      setPhase('name')
    } finally {
      setLoading(false)
    }
  }

  // SUBMIT PLAYER NAME
  function handleNameSubmit(event) {
    event.preventDefault()

    const cleanedName = playerName.trim()

    if (!cleanedName) {
      setError('Please enter your name first.')
      return
    }

    if (cleanedName.length > 30) {
      setError('Your name must not exceed 30 characters.')
      return
    }

    setPlayerName(cleanedName)
    setError('')
    prepareGame()
  }

  // BEGIN DRAWING ROUND
  function beginGame() {
    setShowPlayConfirm(false)
    setCurrentIndex(0)
    setSecondsLeft(DRAW_SECONDS)
    finishedRef.current = false
    setPhase('drawing')
  }

  // RETURN HOME
  function returnHome() {
    setShowPlayConfirm(false)
    setPhase('idle')
    setRoundWords([])
    setAnswers(Array(TOTAL_WORDS).fill(''))
    setResults([])
    setCurrentIndex(0)
    setSecondsLeft(DRAW_SECONDS)
    setError('')
    setPreviewHasDrawing(false)
    setSavingScore(false)
    finishedRef.current = false

    const previewCanvas = previewCanvasRef.current

    if (previewCanvas) {
      const ctx = previewCanvas.getContext('2d')
      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
    }
  }

  // FINISH CURRENT DRAWING
  const finishDrawing = useCallback(() => {
    if (finishedRef.current || phase !== 'drawing') return

    finishedRef.current = true
    drawingRef.current = false

    const canvas = canvasRef.current
    const drawing = canvas ? canvas.toDataURL('image/png') : null

    const updated = roundWords.map((item, index) =>
      index === currentIndex ? { ...item, drawing } : item
    )

    setRoundWords(updated)

    if (currentIndex < TOTAL_WORDS - 1) {
      setCurrentIndex((index) => index + 1)
      setSecondsLeft(DRAW_SECONDS)
      finishedRef.current = false
    } else {
      setPhase('flashback')
    }
  }, [phase, roundWords, currentIndex])

  // FINISH GUESSING ROUND
  const finishGuessing = useCallback(() => {
    if (finishedRef.current || phase !== 'guessing') return

    finishedRef.current = true

    const checked = roundWords.map((item, index) => {
      const correct =
        answers[index].trim().toLowerCase() ===
        item.word.trim().toLowerCase()

      return {
        word: item.word,
        drawing: item.drawing,
        answer: answers[index],
        correct,
      }
    })

    setResults(checked)
    setPhase('results')
  }, [phase, roundWords, answers])

  // GAME TIMERS
  useEffect(() => {
    if (phase !== 'drawing' && phase !== 'guessing') return

    if (secondsLeft <= 0) {
      if (phase === 'drawing') {
        finishDrawing()
      } else {
        finishGuessing()
      }
      return
    }

    const timer = setTimeout(() => {
      setSecondsLeft((seconds) => seconds - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [phase, secondsLeft, finishDrawing, finishGuessing])

  // SAVE SCORE AFTER GAME FINISHES
  useEffect(() => {
    if (
      phase !== 'results' ||
      !playerName ||
      saveAttemptedRef.current
    ) {
      return
    }

    saveAttemptedRef.current = true

    async function saveScore() {
      setSavingScore(true)
      setError('')

      try {
        const response = await fetch(SCORE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: playerName,
            score,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Could not save your score.')
        }

        setScoreSaved(true)

        await fetchLeaderboard()
      } catch (err) {
        console.error('Score saving error:', err)
        setError(err.message || 'Could not save your score.')
        saveAttemptedRef.current = false
      } finally {
        setSavingScore(false)
      }
    }

    saveScore()
  }, [phase, playerName, score])

  // CLEAR CANVAS FOR EACH NEW WORD
  useEffect(() => {
    if (phase !== 'drawing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [phase, currentIndex])

  // GET CANVAS POSITION
  function getCanvasPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  // ACTUAL GAME DRAWING
  function startDrawing(event) {
    const canvas = canvasRef.current
    if (!canvas || phase !== 'drawing') return

    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)

    const ctx = canvas.getContext('2d')
    const position = getCanvasPosition(canvas, event)

    ctx.beginPath()
    ctx.moveTo(position.x, position.y)
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  function draw(event) {
    if (!drawingRef.current || phase !== 'drawing') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const position = getCanvasPosition(canvas, event)

    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.lineTo(position.x, position.y)
    ctx.stroke()
  }

  function stopDrawing() {
    drawingRef.current = false
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // MINI TEST CANVAS
  function startPreviewDrawing(event) {
    const canvas = previewCanvasRef.current
    if (!canvas) return

    previewDrawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    setPreviewHasDrawing(true)

    const ctx = canvas.getContext('2d')
    const position = getCanvasPosition(canvas, event)

    ctx.beginPath()
    ctx.moveTo(position.x, position.y)
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  function drawPreview(event) {
    if (!previewDrawingRef.current) return

    const canvas = previewCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const position = getCanvasPosition(canvas, event)

    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.lineTo(position.x, position.y)
    ctx.stroke()
  }

  function stopPreviewDrawing() {
    previewDrawingRef.current = false
  }

  function clearPreviewCanvas() {
    const canvas = previewCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    previewDrawingRef.current = false
    setPreviewHasDrawing(false)
  }

  // START GUESSING
  function startGuessing() {
    setAnswers(Array(TOTAL_WORDS).fill(''))
    setSecondsLeft(GUESS_SECONDS)
    finishedRef.current = false
    setPhase('guessing')
  }

  // UPDATE ANSWER
  function updateAnswer(index, value) {
    setAnswers((previous) =>
      previous.map((answer, i) => (i === index ? value : answer))
    )
  }

  // FORMAT TIMER
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return (
    <main className={`dd-app ${phase}-phase`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">✎</span>
          DoodleDash
        </div>

        <span className="topbar-note">
          Draw it. Remember it. Guess it!
        </span>
      </header>

      <section className="welcome">
        <span className="eyebrow">DRAW • REMEMBER • GUESS</span>

        <h1>
          Your memory, your doodles<span>!</span>
        </h1>

        <p>
          Draw 10 random words, review your artwork, then guess them all in
          40 seconds.
        </p>
      </section>

      {error && <div className="error-message">{error}</div>}

      {/* PLAYER NAME PAGE */}
      {phase === 'name' && (
        <section className="game-panel start-panel">
          <div className="start-illustration">👋 </div>

          <h2>Who's playing today?</h2>

          <p>Enter your name before starting the DoodleDash challenge.</p>

          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Enter your name..."
              maxLength={30}
              autoComplete="off"
              required
            />

            <button
              type="submit"
              className="primary-button big-button"
              disabled={loading}
            >
              {loading ? 'Preparing your words...' : 'Continue →'}
            </button>
          </form>

          <button
            type="button"
            className="secondary-button"
            onClick={returnHome}
            disabled={loading}
          >
            ← Back to Home
          </button>
        </section>
      )}

      {/* HOME PAGE */}
           {/* HOME PAGE */}
      {phase === 'idle' && (
        <div className="home-content">
          <section className="game-panel start-panel">
            <div className="start-illustration">🎨 🧠 ✨</div>

            <h2>Ready for the challenge?</h2>

            <p>
              You will have 5 seconds for each drawing. After all 10 drawings,
              review them and guess every word before your 40 seconds run out.
            </p>

            <div className="rules-grid">
              <div>
                <strong>10</strong>
                <span>Random words</span>
              </div>

              <div>
                <strong>5s</strong>
                <span>Each drawing</span>
              </div>

              <div>
                <strong>40s</strong>
                <span>Guessing time</span>
              </div>
            </div>

            <button
              className="primary-button big-button"
              onClick={startGame}
              disabled={loading}
            >
              Start Game →
            </button>
          </section>

          {/* TOP 5 LEADERBOARD */}
          <section className="game-panel leaderboard-panel">
            <div className="game-topline">
              <div>
                <span className="section-label">DOODLEDASH RANKINGS</span>
                <h2>Top 5 Players 🏆</h2>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <p className="muted">
                No players ranked yet. Be the first to play!
              </p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((player, index) => (
                  <div
                    className="leaderboard-item"
                    key={player.player_id}
                  >
                    <span className="leaderboard-rank">
                      {index + 1}
                    </span>

                    <span className="leaderboard-name">
                      {player.username}
                    </span>

                    <strong className="leaderboard-score">
                      {player.best_score}/10
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      
      {/* CUSTOMIZATION PAGE */}
      {phase === 'setup' && (
        <section className="game-panel setup-panel">
          <div className="setup-heading">
            <span className="section-label">BEFORE YOU PLAY</span>
            <h2>Customize Your Brush</h2>
            <p>Choose your preferred drawing style before playing.</p>
          </div>

          <div className="setup-options">
            <div className="setup-option">
              <h3>Brush Color</h3>

              <div className="color-tools setup-colors">
                {COLORS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`color-dot ${color === item ? 'selected' : ''}`}
                    style={{ backgroundColor: item }}
                    aria-label={`Choose color ${item}`}
                    onClick={() => setColor(item)}
                  />
                ))}
              </div>
            </div>

            <div className="setup-option">
              <h3>Brush Size</h3>

              <label className="setup-brush">
                <span>Adjust thickness</span>

                <input
                  type="range"
                  min="2"
                  max="18"
                  value={brushSize}
                  onChange={(event) =>
                    setBrushSize(Number(event.target.value))
                  }
                />
              </label>

              <div className="brush-preview">
                <span
                  style={{
                    width: `${brushSize * 2}px`,
                    height: `${brushSize * 2}px`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          </div>

          {/* TEST DRAWING AREA */}
          <div className="setup-option setup-test-card">
            <h3>Test Your Brush</h3>

            <div className="setup-test-area">
              <div className="setup-test-canvas-frame">
                <canvas
                  ref={previewCanvasRef}
                  width={900}
                  height={230}
                  className="setup-test-canvas"
                  onPointerDown={startPreviewDrawing}
                  onPointerMove={drawPreview}
                  onPointerUp={stopPreviewDrawing}
                  onPointerLeave={stopPreviewDrawing}
                  onPointerCancel={stopPreviewDrawing}
                  aria-label="Test drawing pad"
                />

                {!previewHasDrawing && (
                  <span className="setup-test-hint">
                    Draw here!
                  </span>
                )}
              </div>

              <button
                type="button"
                className="setup-clear-button"
                onClick={clearPreviewCanvas}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="setup-play-area">
            <button
              type="button"
              className="primary-button setup-play-button"
              onClick={() => setShowPlayConfirm(true)}
            >
              ▶ PLAY
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={returnHome}
            >
              ← Back to Home
            </button>
          </div>
        </section>
      )}

      {/* PLAY CONFIRMATION */}
      {phase === 'setup' && showPlayConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(35, 27, 45, 0.55)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              borderRadius: '20px',
              backgroundColor: '#ffffff',
              boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
              textAlign: 'center',
              color: '#29243b',
            }}
          >
            <h3
              id="confirm-title"
              style={{ marginTop: 0, marginBottom: '12px' }}
            >
              Ready to play?
            </h3>

            <p style={{ marginBottom: '24px' }}>
              Your 10-word drawing challenge is about to begin!
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowPlayConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={beginGame}
              >
                Yes, Let's Play!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWING ROUND */}
      {phase === 'drawing' && currentWord && (
        <section className="game-panel">
          <div className="game-topline">
            <div>
              <span className="section-label">DRAWING ROUND</span>
              <h2>Draw what you see!</h2>
            </div>

            <div className={`timer ${secondsLeft <= 5 ? 'timer-urgent' : ''}`}>
              <span>⏱</span> {formatTime(secondsLeft)}
            </div>
          </div>

          <div className="progress-row">
            <span>
              Word {currentIndex + 1} of {TOTAL_WORDS}
            </span>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentIndex + 1) / TOTAL_WORDS) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="word-card">
            <span className="word-icon">💭</span>

            <div>
              <span className="small-label">DRAW THIS WORD</span>
              <h3>{currentWord.word}</h3>
            </div>
          </div>

          <div className="drawing-toolbar">
            <div className="color-tools">
              {COLORS.map((item) => (
                <button
                  key={item}
                  className={`color-dot ${color === item ? 'selected' : ''}`}
                  style={{ backgroundColor: item }}
                  aria-label={`Choose color ${item}`}
                  onClick={() => setColor(item)}
                />
              ))}
            </div>

            <label className="brush-control">
              <span>Brush</span>

              <input
                type="range"
                min="2"
                max="18"
                value={brushSize}
                onChange={(event) =>
                  setBrushSize(Number(event.target.value))
                }
              />
            </label>

            <button
              className="secondary-button"
              onClick={clearCanvas}
            >
              Clear
            </button>
          </div>

          <div className="canvas-frame">
            <canvas
              ref={canvasRef}
              className="drawing-canvas"
              width={900}
              height={460}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onLostPointerCapture={stopDrawing}
              aria-label="Drawing pad"
            />
          </div>

          <div className="drawing-footer">
            <span>✦ Make your drawing easy to recognize!</span>

            <button
              className="primary-button"
              onClick={finishDrawing}
            >
              {currentIndex === TOTAL_WORDS - 1
                ? 'Finish Drawing →'
                : 'Next Word →'}
            </button>
          </div>
        </section>
      )}

      {/* DRAWING RECAP */}
      {phase === 'flashback' && (
        <section className="game-panel">
          <div className="game-topline">
            <div>
              <span className="section-label">DRAWING RECAP</span>
              <h2>Look at your doodles!</h2>

              <p className="muted">
                Review all 10 drawings before the guessing round.
              </p>
            </div>

            <span className="brain-badge">10 drawings ✨</span>
          </div>

          <div className="drawing-gallery">
            {roundWords.map((item, index) => (
              <article
                className="gallery-card"
                key={`${item.word}-${index}`}
              >
                <span className="gallery-number">
                  DRAWING {index + 1}
                </span>

                {item.drawing ? (
                  <img
                    src={item.drawing}
                    alt={`Your drawing ${index + 1}`}
                  />
                ) : (
                  <div className="empty-drawing">No drawing</div>
                )}
              </article>
            ))}
          </div>

          <div className="recap-actions">
            <p>
              Ready? You will have just 40 seconds to guess all 10 words.
            </p>

            <button
              className="primary-button big-button"
              onClick={startGuessing}
            >
              Start Guessing →
            </button>
          </div>
        </section>
      )}

      {/* GUESSING ROUND */}
      {phase === 'guessing' && (
        <section className="game-panel">
          <div className="game-topline">
            <div>
              <span className="section-label">GUESSING ROUND</span>
              <h2>What did you draw?</h2>

              <p className="muted">
                Type the word you think matches each drawing.
              </p>
            </div>

            <div className={`timer ${secondsLeft <= 10 ? 'timer-urgent' : ''}`}>
              <span>⏱</span> {formatTime(secondsLeft)}
            </div>
          </div>

          <div className="guess-progress">
            Your time ends automatically. Unanswered words count as incorrect.
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              finishGuessing()
            }}
          >
            <div className="guess-grid">
              {roundWords.map((item, index) => (
                <label
                  className="guess-card"
                  key={`${item.word}-${index}`}
                >
                  <span className="gallery-number">
                    DRAWING {index + 1}
                  </span>

                  {item.drawing ? (
                    <img
                      src={item.drawing}
                      alt={`Guess drawing ${index + 1}`}
                    />
                  ) : (
                    <div className="empty-drawing">No drawing</div>
                  )}

                  <span className="answer-label">Your answer</span>

                  <input
                    type="text"
                    value={answers[index]}
                    onChange={(event) =>
                      updateAnswer(index, event.target.value)
                    }
                    placeholder="Type the word..."
                    autoComplete="off"
                  />
                </label>
              ))}
            </div>

            <div className="submit-row">
              <span>
                {answers.filter((answer) => answer.trim()).length} of 10
                answered
              </span>

              <button
                className="primary-button big-button"
                type="submit"
              >
                Check My Answers ✓
              </button>
            </div>
          </form>
        </section>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <section className="game-panel">
          <div className="results-heading">
            <span className="eyebrow">ROUND COMPLETE</span>
            <h2>Your final score</h2>

            <div className="score-circle">
              <strong>{score}</strong>
              <span>out of 10</span>
            </div>

            <p>
              {score === 10
                ? 'Amazing! You remembered every word! 🎉'
                : score >= 5
                  ? 'Great job! Your memory is getting stronger! 💗'
                  : 'Good try! Play again and see if you can beat your score! ✨'}
            </p>

            {savingScore && (
              <p className="muted">Saving your score...</p>
            )}

            {scoreSaved && (
              <p className="answer-correct">
                ✓ Your score has been saved!
              </p>
            )}

            {error && !scoreSaved && (
              <p className="answer-wrong">{error}</p>
            )}

            {!scoreSaved && !savingScore && error && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  saveAttemptedRef.current = false
                  setError('')
                  setPhase('idle')
                  setPhase('results')
                }}
              >
                Try saving again
              </button>
            )}
          </div>

          <div className="results-list">
            {results.map((item, index) => (
              <article
                className="result-card"
                key={`${item.word}-${index}`}
              >
                {item.drawing ? (
                  <img
                    src={item.drawing}
                    alt={`Your drawing ${index + 1}`}
                  />
                ) : (
                  <div className="empty-drawing">No drawing</div>
                )}

                <div className="result-details">
                  <span className="gallery-number">
                    DRAWING {index + 1}
                  </span>

                  <strong>{item.word}</strong>

                  <span
                    className={
                      item.correct ? 'answer-correct' : 'answer-wrong'
                    }
                  >
                    {item.correct
                      ? '✓ Correct'
                      : `✗ Your answer: ${item.answer.trim() || 'No answer'}`}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <button
            className="primary-button big-button play-again"
            onClick={returnHome}
          >
            ↻ Back to Home
          </button>
        </section>
      )}

      <footer className="page-footer">
        Made for curious minds and creative hands <span>♡</span>
      </footer>
    </main>
  )
}

export default App
