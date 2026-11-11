import { useEffect, useRef, useState } from "react";
import PlayerHeader from "./PlayerHeader.jsx";
import SourceNote from "./SourceNote.jsx";
import { countCardStatuses } from "../lib/artifacts.js";
import { plural, shouldIgnoreKey, shuffle } from "../lib/utils.js";

// Flip through cards and mark each one "Got it" or "Still learning"
const FlashcardPlayer = ({ artifact, onProgress, onBack }) => {
  const allIds = artifact.items.map((card) => card.id);
  // The ids of the cards in this round, in the order they are shown
  const [order, setOrder] = useState(allIds);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isReview, setIsReview] = useState(false);
  // Where a finger touched down, for swiping between cards on phones
  const touchStartRef = useRef(null);

  const statuses = artifact.progress.cards;
  const counts = countCardStatuses(artifact);
  const learningIds = allIds.filter((id) => statuses[id] === "learning");
  const isFinished = index >= order.length;
  const card = isFinished ? null : artifact.items.find((item) => item.id === order[index]);
  const doneCount = counts.known + counts.learning;

  // Moves to a card, always showing its front first
  const goTo = (newIndex) => {
    setIndex(newIndex);
    setFlipped(false);
  };

  // Goes to the next card, or to the summary after the last one
  const next = () => {
    if (index < order.length) {
      goTo(index + 1);
    }
  };

  // Goes back one card
  const previous = () => {
    if (index > 0) {
      goTo(index - 1);
    }
  };

  // Saves the status of the current card and moves on
  const mark = (status) => {
    onProgress({ cards: { ...statuses, [card.id]: status } });
    next();
  };

  // Starts a new round with the given cards
  const startRound = (ids, review) => {
    setOrder(ids);
    setIsReview(review);
    goTo(0);
  };

  // Remembers where a swipe starts
  const handleTouchStart = (event) => {
    touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };

  // A clear sideways swipe moves to the next card (left) or the previous one (right)
  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) {
      return;
    }
    const movedX = event.changedTouches[0].clientX - start.x;
    const movedY = event.changedTouches[0].clientY - start.y;
    // Ignore taps and mostly up-and-down moves, which are scrolling
    if (Math.abs(movedX) < 50 || Math.abs(movedX) < Math.abs(movedY)) {
      return;
    }
    if (movedX < 0) {
      next();
    } else {
      previous();
    }
  };

  // Listens for Space, arrows, 1 and 2
  // Re-attached on every render so the handler always sees the latest state
  useEffect(() => {
    const handleKey = (event) => {
      if (shouldIgnoreKey(event) || isFinished) {
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        setFlipped(!flipped);
      } else if (event.key === "ArrowRight") {
        next();
      } else if (event.key === "ArrowLeft") {
        previous();
      } else if (event.key === "1") {
        mark("learning");
      } else if (event.key === "2") {
        mark("known");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const roundLabel = isReview ? "Reviewing cards you're still learning" : `${artifact.items.length} cards`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PlayerHeader title={artifact.title} subtitle={roundLabel} onBack={onBack}>
        <button
          type="button"
          className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 sm:py-1.5"
          onClick={() => startRound(shuffle(isFinished ? allIds : order), isReview)}
        >
          Shuffle
        </button>
      </PlayerHeader>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Overall progress across every card in the set */}
          <div className="flex justify-between text-xs text-zinc-400">
            <span>
              {counts.known} known · {counts.learning} still learning · {counts.new} new
            </span>
            <span>
              {doneCount}/{artifact.items.length} done
            </span>
          </div>
          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="bg-zinc-200" style={{ width: `${(counts.known / artifact.items.length) * 100}%` }} />
            <div className="bg-zinc-500" style={{ width: `${(counts.learning / artifact.items.length) * 100}%` }} />
          </div>

          {isFinished ? (
            <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-lg font-medium">Round complete</p>
              <p className="mt-1 text-zinc-400">
                You know {counts.known} of {plural(artifact.items.length, "card")}.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                {learningIds.length > 0 && (
                  <button
                    type="button"
                    className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
                    onClick={() => startRound(learningIds, true)}
                  >
                    Review the {plural(learningIds.length, "card")} I'm still learning
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                  onClick={() => startRound(allIds, false)}
                >
                  Go through all cards again
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="flip-card mt-6 block h-72 w-full touch-pan-y text-left md:h-80"
                onClick={() => setFlipped(!flipped)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-label={flipped ? "Show question" : "Show answer"}
              >
                {/* The key restarts the card for each new card, so the flip back is not animated */}
                <div key={card.id} className={`flip-card-inner ${flipped ? "is-flipped" : ""}`}>
                  <div className="flip-card-face flex flex-col rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
                    <span className="text-xs tracking-wide text-zinc-500 uppercase">Question</span>
                    <div className="flex flex-1 items-center justify-center overflow-y-auto">
                      <p className="text-center text-xl leading-snug font-medium md:text-2xl">{card.front}</p>
                    </div>
                    <span className="text-center text-xs text-zinc-500 md:hidden">Tap to flip · swipe to move</span>
                    <span className="hidden text-center text-xs text-zinc-500 md:inline">Tap or press Space to flip</span>
                  </div>
                  <div className="flip-card-face flip-card-back flex flex-col rounded-2xl border border-zinc-600 bg-zinc-800 p-6">
                    <span className="text-xs tracking-wide text-zinc-400 uppercase">Answer</span>
                    <div className="flex flex-1 items-center justify-center overflow-y-auto">
                      <p className="text-center text-lg leading-relaxed md:text-xl">{card.back}</p>
                    </div>
                    <SourceNote item={card} />
                  </div>
                </div>
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                  onClick={() => mark("learning")}
                >
                  Still learning
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-white"
                  onClick={() => mark("known")}
                >
                  Got it
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-800 sm:py-2 disabled:opacity-40"
                  disabled={index === 0}
                  onClick={previous}
                >
                  ← Previous
                </button>
                <span className="text-sm text-zinc-400">
                  {index + 1} / {order.length}
                  {statuses[card.id] === "known" && <span className="ml-2 text-zinc-200">✓ known</span>}
                  {statuses[card.id] === "learning" && <span className="ml-2 text-zinc-500">learning</span>}
                </span>
                <button
                  type="button"
                  className="rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-zinc-800 sm:py-2"
                  onClick={next}
                >
                  Next →
                </button>
              </div>

              <p className="mt-6 hidden text-center text-xs text-zinc-600 md:block">
                Space flip · ← → move · 1 still learning · 2 got it
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardPlayer;
