import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  listQuizzes,
  getQuiz,
  submitQuizAttempt,
  getQuizAttempts,
  type Quiz,
  type QuizAttempt,
} from "../lib/quizzes";

export default function Quizzes() {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string | number>>(new Map());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      setError(null);
      setLoading(true);
      const data = await listQuizzes();
      setQuizzes(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }

  async function startQuiz(quizId: string) {
    try {
      setError(null);
      setLoading(true);
      const quiz = await getQuiz(quizId);
      setSelectedQuiz(quiz);
      setCurrentQuestionIndex(0);
      setUserAnswers(new Map());
      setStartTime(Date.now());
      setResult(null);
      
      const pastAttempts = await getQuizAttempts(quizId);
      setAttempts(pastAttempts);
    } catch (e: any) {
      setError(e?.message || "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  }

  function answerQuestion(answer: string | number) {
    const newAnswers = new Map(userAnswers);
    newAnswers.set(currentQuestionIndex, answer);
    setUserAnswers(newAnswers);
  }

  function goToQuestion(index: number) {
    if (index >= 0 && selectedQuiz && index < selectedQuiz.questions.length) {
      setCurrentQuestionIndex(index);
    }
  }

  async function submitQuiz() {
    if (!selectedQuiz || !token || !startTime) return;

    try {
      setError(null);
      setLoading(true);

      const answers = Array.from(userAnswers.entries()).map(([questionIndex, userAnswer]) => ({
        questionIndex,
        userAnswer,
      }));

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const attempt = await submitQuizAttempt(selectedQuiz._id, answers, timeSpent, token);
      setResult(attempt);
    } catch (e: any) {
      setError(e?.message || "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  }

  function resetQuiz() {
    setSelectedQuiz(null);
    setCurrentQuestionIndex(0);
    setUserAnswers(new Map());
    setStartTime(null);
    setResult(null);
    setAttempts([]);
    loadQuizzes();
  }

  // RESULTS VIEW - Enhanced with celebration!
  if (result) {
    const isPerfect = result.percentage === 100;
    const isGood = result.percentage >= 80;
    const isPassing = result.percentage >= 60;

    return (
      <section style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        {/* Header with emoji celebration */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {isPerfect ? "🎉" : isGood ? "🌟" : isPassing ? "👍" : "📚"}
          </div>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Quiz Complete!</h2>
        </div>

        {/* Score Card - Enhanced with gradient */}
        <div style={{
          background: isPerfect 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : isGood
            ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            : isPassing
            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          borderRadius: 16,
          padding: 32,
          marginBottom: 32,
          color: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          transition: 'transform 0.3s ease',
        }}>
          <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 12, textAlign: 'center' }}>
            {result.score} / {result.totalPoints}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>
            {result.percentage.toFixed(1)}%
          </div>
          <div style={{ fontSize: 16, textAlign: 'center', opacity: 0.9 }}>
            ⏱️ Time: {result.timeSpent ? Math.floor(result.timeSpent / 60) : 0}m{" "}
            {result.timeSpent ? result.timeSpent % 60 : 0}s
          </div>
        </div>

        {/* Review Section */}
        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>📋 Review Answers</h3>
        <div style={{ display: "grid", gap: 20 }}>
          {selectedQuiz?.questions.map((q, i) => {
            const userAnswer = result.answers.find((a) => a.questionIndex === i);
            return (
              <div
                key={i}
                style={{
                  border: "2px solid",
                  borderColor: userAnswer?.isCorrect ? "#10b981" : "#ef4444",
                  borderRadius: 12,
                  padding: 20,
                  background: userAnswer?.isCorrect ? "#f0fdf4" : "#fef2f2",
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'start', 
                  gap: 12,
                  marginBottom: 16 
                }}>
                  <div style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: userAnswer?.isCorrect ? "#10b981" : "#ef4444",
                    minWidth: 32,
                  }}>
                    {userAnswer?.isCorrect ? "✓" : "✗"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
                      Question {i + 1}: {q.question}
                    </div>

                    {q.type === "mcq" && (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            style={{
                              padding: "12px 16px",
                              borderRadius: 8,
                              background:
                                optIdx === q.correctAnswer
                                  ? "#10b981"
                                  : optIdx === userAnswer?.userAnswer
                                  ? "#ef4444"
                                  : "#f3f4f6",
                              color:
                                optIdx === q.correctAnswer || optIdx === userAnswer?.userAnswer
                                  ? "white"
                                  : "#374151",
                              fontWeight: optIdx === q.correctAnswer ? 600 : 400,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {opt}
                            {optIdx === q.correctAnswer && " ✓ Correct"}
                            {optIdx === userAnswer?.userAnswer && optIdx !== q.correctAnswer && " ✗ Your answer"}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === "true-false" && (
                      <div style={{ 
                        padding: 12,
                        background: '#f9fafb',
                        borderRadius: 8,
                        fontSize: 14 
                      }}>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Your answer:</strong> {String(userAnswer?.userAnswer)}
                        </div>
                        <div>
                          <strong>Correct answer:</strong> {q.correctAnswer}
                        </div>
                      </div>
                    )}

                    {q.type === "short-answer" && (
                      <div style={{ 
                        padding: 12,
                        background: '#f9fafb',
                        borderRadius: 8,
                        fontSize: 14 
                      }}>
                        <div style={{ marginBottom: 4 }}>
                          <strong>Your answer:</strong> {String(userAnswer?.userAnswer)}
                        </div>
                        <div>
                          <strong>Correct answer:</strong> {q.correctAnswer}
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <div style={{ 
                        marginTop: 12,
                        padding: 12,
                        background: '#fffbeb',
                        borderLeft: '3px solid #f59e0b',
                        borderRadius: 6,
                        fontSize: 14,
                        fontStyle: 'italic',
                        color: '#92400e'
                      }}>
                        💡 {q.explanation}
                      </div>
                    )}

                    <div style={{ 
                      marginTop: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: userAnswer?.isCorrect ? "#10b981" : "#ef4444"
                    }}>
                      Points: {userAnswer?.pointsEarned || 0} / {q.points || 1}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={resetQuiz}
          style={{
            marginTop: 32,
            padding: "14px 28px",
            borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: "white",
            border: "none",
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
        >
          ← Back to Quizzes
        </button>
      </section>
    );
  }

  // QUIZ TAKING VIEW - Enhanced with better UI
  if (selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const currentAnswer = userAnswers.get(currentQuestionIndex);
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;
    const allAnswered = userAnswers.size === selectedQuiz.questions.length;

    return (
      <section style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 24 
        }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{selectedQuiz.title}</h2>
          <button 
            onClick={resetQuiz} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            ✕ Exit
          </button>
        </div>

        {/* Progress Section - Enhanced */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#6b7280'
          }}>
            <span>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div style={{ 
            height: 12, 
            background: "#e5e7eb", 
            borderRadius: 999,
            overflow: "hidden",
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ 
              width: `${progress}%`, 
              height: "100%", 
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.3s ease',
              borderRadius: 999,
            }} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: "#fee", 
            padding: 16, 
            borderRadius: 10, 
            marginBottom: 20,
            color: "#c00",
            border: '1px solid #fecaca',
            fontSize: 14,
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Question Card - Enhanced */}
        <div style={{ 
          border: "2px solid #e5e7eb", 
          borderRadius: 16, 
          padding: 28,
          marginBottom: 24,
          background: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        }}>
          <h3 style={{ 
            marginTop: 0,
            marginBottom: 24,
            fontSize: 20,
            fontWeight: 600,
            lineHeight: 1.6,
          }}>
            {currentQuestion.question}
          </h3>

          {/* MCQ Options - Enhanced */}
          {currentQuestion.type === "mcq" && (
            <div style={{ display: "grid", gap: 12 }}>
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => answerQuestion(i)}
                  style={{
                    padding: 16,
                    textAlign: "left",
                    borderRadius: 10,
                    border: currentAnswer === i ? "2px solid #667eea" : "2px solid #e5e7eb",
                    background: currentAnswer === i ? "#f5f7ff" : "white",
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: currentAnswer === i ? 600 : 400,
                    transition: 'all 0.2s ease',
                    boxShadow: currentAnswer === i ? '0 4px 12px rgba(102, 126, 234, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    if (currentAnswer !== i) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentAnswer !== i) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* True/False - Enhanced */}
          {currentQuestion.type === "true-false" && (
            <div style={{ display: "flex", gap: 12 }}>
              {["true", "false"].map((value) => (
                <button
                  key={value}
                  onClick={() => answerQuestion(value)}
                  style={{
                    flex: 1,
                    padding: 20,
                    borderRadius: 10,
                    border: currentAnswer === value ? "2px solid #667eea" : "2px solid #e5e7eb",
                    background: currentAnswer === value ? "#f5f7ff" : "white",
                    cursor: "pointer",
                    fontSize: 18,
                    fontWeight: currentAnswer === value ? 700 : 500,
                    transition: 'all 0.2s ease',
                    boxShadow: currentAnswer === value ? '0 4px 12px rgba(102, 126, 234, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    if (currentAnswer !== value) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentAnswer !== value) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {value === "true" ? "✓ True" : "✗ False"}
                </button>
              ))}
            </div>
          )}

          {/* Short Answer - Enhanced */}
          {currentQuestion.type === "short-answer" && (
            <input
              type="text"
              value={String(currentAnswer || "")}
              onChange={(e) => answerQuestion(e.target.value)}
              placeholder="Type your answer..."
              style={{
                width: "100%",
                padding: 16,
                border: "2px solid #e5e7eb",
                borderRadius: 10,
                fontSize: 15,
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          )}
        </div>

        {/* Navigation Buttons - Enhanced */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <button
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            style={{ 
              padding: "12px 24px",
              borderRadius: 10,
              border: '2px solid #e5e7eb',
              background: 'white',
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: currentQuestionIndex === 0 ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (currentQuestionIndex !== 0) {
                e.currentTarget.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            ← Previous
          </button>

          {currentQuestionIndex < selectedQuiz.questions.length - 1 ? (
            <button
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={loading || !allAnswered}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                background: loading || !allAnswered 
                  ? "#d1d5db" 
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: "white",
                border: "none",
                fontWeight: 700,
                cursor: loading || !allAnswered ? "not-allowed" : "pointer",
                boxShadow: loading || !allAnswered ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && allAnswered) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading || !allAnswered ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)';
              }}
            >
              {loading ? "⏳ Submitting..." : allAnswered ? "✓ Submit Quiz" : `Answer ${selectedQuiz.questions.length - userAnswers.size} more`}
            </button>
          )}
        </div>

        {/* Previous Attempts - Enhanced */}
        {attempts.length > 0 && (
          <div style={{ 
            marginTop: 32,
            padding: 20,
            background: '#f9fafb',
            borderRadius: 12,
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
              📊 Previous Attempts
            </h4>
            <div style={{ display: "grid", gap: 10 }}>
              {attempts.slice(0, 5).map((attempt) => (
                <div
                  key={attempt._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: 'center',
                    padding: 12,
                    background: 'white',
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ color: '#6b7280' }}>
                    {new Date(attempt.completedAt).toLocaleDateString()} {new Date(attempt.completedAt).toLocaleTimeString()}
                  </span>
                  <span style={{ 
                    fontWeight: 700,
                    color: attempt.percentage >= 80 ? '#10b981' : attempt.percentage >= 60 ? '#f59e0b' : '#ef4444'
                  }}>
                    {attempt.score}/{attempt.totalPoints} ({attempt.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  // QUIZ LIST VIEW - Enhanced with better cards
  return (
    <section style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
          📝 Your Quizzes
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 16 }}>
          Test your knowledge and track your progress
        </p>
      </div>

      {error && (
        <div style={{ 
          background: "#fee2e2", 
          padding: 16, 
          borderRadius: 12, 
          marginBottom: 24,
          color: "#991b1b",
          border: '1px solid #fecaca',
          fontWeight: 500
        }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ 
          textAlign: 'center',
          padding: 60,
          fontSize: 16,
          color: '#6b7280'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          Loading quizzes...
        </div>
      )}

      {!loading && quizzes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: '#f9fafb',
          borderRadius: 16,
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
          <div style={{ fontSize: 18, color: '#6b7280', marginBottom: 8 }}>
            No quizzes yet
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            Generate a quiz from a document on the Documents page
          </div>
        </div>
      )}

      <div style={{ 
        display: "grid", 
        gap: 20, 
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" 
      }}>
        {quizzes.map((quiz) => (
          <div
            key={quiz._id}
            style={{
              border: "2px solid #e5e7eb",
              borderRadius: 16,
              padding: 24,
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={() => startQuiz(quiz._id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.1)";
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {/* Gradient accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            }} />

            <h3 style={{ 
              marginTop: 0,
              marginBottom: 16,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.4,
            }}>
              {quiz.title}
            </h3>

            <div style={{ 
              display: 'flex',
              gap: 16,
              marginBottom: 12,
              fontSize: 14,
              color: '#6b7280',
              fontWeight: 500
            }}>
              <span>📊 {quiz.questions?.length || 0} questions</span>
              <span>⭐ {quiz.totalPoints} points</span>
            </div>

            {quiz.timeLimit && (
              <div style={{ 
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 12,
                fontWeight: 500
              }}>
                ⏱️ {quiz.timeLimit} minutes
              </div>
            )}

            <div style={{ 
              fontSize: 12,
              color: '#9ca3af',
              paddingTop: 12,
              borderTop: '1px solid #f3f4f6'
            }}>
              Created {new Date(quiz.createdAt).toLocaleDateString()}
            </div>

            {/* Hover arrow */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              fontSize: 24,
              opacity: 0.3,
              transition: 'all 0.3s ease',
            }}>
              →
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}