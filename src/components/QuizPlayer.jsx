import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import PlayerHeader from "./PlayerHeader.jsx";
import KeyHints from "./KeyHints.jsx";
import SourceNote from "./SourceNote.jsx";
import { plural, shouldIgnoreKey, shuffle } from "../lib/utils.js";

// Copies the questions in a new random order, each with its options shuffled too
// Runs at the start of every round, so a retake or re-test never repeats the same order
// (models also tend to put the right answer in the same place, which shuffling hides)
const buildRound = (questions, isFullQuiz) => {
  return {
    isFullQuiz,
    questions: shuffle(questions).map((question) => ({ ...question, options: shuffle(question.options) })),
  };
};

// One question at a time, instant feedback, and re-tests of wrong answers
const QuizPlayer = ({ artifact, onProgress, onBack }) => {
  const [round, setRound] = useState(() => buildRound(artifact.items, true));
  const [index, setIndex] = useState(0);
  // The option picked for the current question, or null before answering
  const [selected, setSelected] = useState(null);
  // Question id -> true if answered correctly in this round
  const [results, setResults] = useState({});
  const [isFinished, setIsFinished] = useState(false);

  const question = round.questions[index];
  const total = round.questions.length;
  const score = Object.values(results).filter((correct) => correct).length;
  const wrongQuestions = round.questions.filter((item) => results[item.id] === false);

  // Records the chosen option; answers cannot be changed
  const choose = (option) => {
    if (selected !== null) {
      return;
    }
    setSelected(option);
    setResults({ ...results, [question.id]: option === question.answer });
  };

  // Goes to the next question, or ends the round
  const next = () => {
    if (selected === null) {
      return;
    }
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
      return;
    }
    setIsFinished(true);
    // Only full runs count as attempts; re-tests are practice
    // The missed questions are saved too, for "practise my weak spots"
    if (round.isFullQuiz) {
      const wrongIds = wrongQuestions.map((item) => item.id);
      const attempt = { score, total, date: Date.now(), wrongIds };
      onProgress({ attempts: [...artifact.progress.attempts, attempt] });
    }
  };

  // Starts a new round with the given questions
  const startRound = (questions, isFullQuiz) => {
    setRound(buildRound(questions, isFullQuiz));
    setIndex(0);
    setSelected(null);
    setResults({});
    setIsFinished(false);
  };

  // Keys 1 to 5 pick an option, Enter moves on
  // Re-attached on every render so the handler always sees the latest state
  useEffect(() => {
    const handleKey = (event) => {
      if (shouldIgnoreKey(event) || isFinished) {
        return;
      }
      const number = Number(event.key);
      if (number >= 1 && number <= question.options.length) {
        choose(question.options[number - 1]);
      } else if (event.key === "Enter") {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Styles an option after the question is answered: soft green for the right one,
  // soft red for a wrong pick, and the rest fade
  const optionStyle = (option) => {
    if (selected === null) {
      return "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800";
    }
    if (option === question.answer) {
      return "border-emerald-500/50 bg-emerald-500/10 text-emerald-100";
    }
    if (option === selected) {
      return "border-red-500/50 bg-red-500/10 text-red-200";
    }
    return "border-zinc-800 bg-zinc-900 text-zinc-500";
  };

  // Colours the small box before an option to match
  const markerStyle = (option) => {
    if (selected !== null && option === question.answer) {
      return "bg-emerald-500/20 text-emerald-300";
    }
    if (selected !== null && option === selected) {
      return "bg-red-500/20 text-red-300";
    }
    return "bg-zinc-800 text-zinc-400";
  };

  // The small box before an option: its number, then a tick or a cross after answering
  const optionMarker = (option, optionIndex) => {
    if (selected !== null && option === question.answer) {
      return <Check size={14} />;
    }
    if (selected !== null && option === selected) {
      return <X size={14} />;
    }
    return optionIndex + 1;
  };

  const bestScore = artifact.progress.attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0);
  const subtitle = round.isFullQuiz
    ? `${plural(artifact.items.length, "question")}${artifact.progress.attempts.length > 0 ? ` · best ${bestScore}/${artifact.items.length}` : ""}`
    : "Re-testing wrong answers";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PlayerHeader title={artifact.title} subtitle={subtitle} onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-2xl">
          {isFinished ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-center text-sm text-zinc-400">{round.isFullQuiz ? "Your score" : "Re-test score"}</p>
              <p className="mt-1 text-center text-4xl font-semibold">
                {score}
                <span className="text-zinc-500">/{total}</span>
              </p>

              {wrongQuestions.length === 0 ? (
                <p className="mt-4 text-center text-zinc-200">
                  {round.isFullQuiz ? "Perfect score!" : "All correct. Every missed question is fixed."}
                </p>
              ) : (
                <div className="mt-6">
                  <p className="text-sm font-medium text-zinc-300">Missed questions</p>
                  <ul className="mt-2 space-y-2">
                    {wrongQuestions.map((item) => (
                      <li key={item.id} className="rounded-lg bg-zinc-800/60 p-3 text-sm">
                        <p className="text-zinc-200">{item.question}</p>
                        <p className="mt-1 text-emerald-300/90">Answer: {item.answer}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                {wrongQuestions.length > 0 && (
                  <button
                    type="button"
                    className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
                    onClick={() => startRound(wrongQuestions, false)}
                  >
                    Re-test {plural(wrongQuestions.length, "wrong answer")}
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                  onClick={() => startRound(artifact.items, true)}
                >
                  Retake full quiz
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>
                  Question {index + 1} of {total}
                </span>
                <span>{score} correct</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-zinc-200 transition-all"
                  style={{ width: `${((index + (selected !== null ? 1 : 0)) / total) * 100}%` }}
                />
              </div>

              <h2 className="mt-6 text-xl leading-snug font-medium md:text-2xl">{question.question}</h2>

              <div className="mt-6 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <button
                    key={option}
                    type="button"
                    disabled={selected !== null}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${optionStyle(option)}`}
                    onClick={() => choose(option)}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs ${markerStyle(option)}`}
                    >
                      {optionMarker(option, optionIndex)}
                    </span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>

              {selected !== null && (
                <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4" role="status">
                  <p
                    className={`flex items-center gap-1.5 font-medium ${
                      selected === question.answer ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {selected === question.answer ? <Check size={18} /> : <X size={18} />}
                    {selected === question.answer ? "Correct" : "Not quite"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">{question.explanation}</p>
                  <div className="mt-2">
                    <SourceNote item={question} />
                  </div>
                  <button
                    type="button"
                    autoFocus
                    className="mt-4 w-full rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white sm:w-auto"
                    onClick={next}
                  >
                    {index + 1 < total ? "Next question" : "See results"}
                  </button>
                </div>
              )}

              <KeyHints
                hints={[
                  { keys: `1–${question.options.length}`, label: "choose" },
                  { keys: "Enter", label: "next" },
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
