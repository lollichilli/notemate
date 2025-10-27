import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { listDocuments } from "../lib/documents";
import { listDecks } from "../lib/decks";
import { listQuizzes } from "../lib/quizzes";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    documents: 0,
    decks: 0,
    quizzes: 0,
    loading: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [docs, decks, quizzes] = await Promise.all([
        listDocuments().catch(() => []),
        listDecks().catch(() => []),
        listQuizzes().catch(() => []),
      ]);

      setStats({
        documents: docs.length,
        decks: decks.length,
        quizzes: quizzes.length,
        loading: false,
      });
    } catch (e) {
      setStats({
        documents: 0,
        decks: 0,
        quizzes: 0,
        loading: false,
      });
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <section style={{ 
      padding: 24,
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      {/* Welcome Header - Hero Section */}
      <div style={{ 
        marginBottom: 32,
        padding: 40,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 20,
        color: 'white',
        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>
            {getGreeting()} 👋
          </div>
          <h1 style={{ 
            margin: 0,
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 12,
          }}>
            {user?.name || user?.email || 'Student'}
          </h1>
          <p style={{ 
            margin: 0,
            fontSize: 16,
            opacity: 0.95,
            maxWidth: 600,
          }}>
            Ready to ace your studies? Let's make today productive! 🚀
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ 
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 20,
          color: '#111827',
        }}>
          📊 Your Overview
        </h2>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {/* Documents Card */}
          <div
            data-testid="stat-card-documents"
            onClick={() => navigate('/documents')}
            style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: 16,
              padding: 24,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.1,
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: 40,
                marginBottom: 12,
              }}>
                📄
              </div>
              <div style={{ 
                fontSize: 14,
                color: '#6b7280',
                fontWeight: 600,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Documents
              </div>
              <div style={{ 
                fontSize: 36,
                fontWeight: 800,
                color: '#111827',
                marginBottom: 4,
              }}>
                {stats.loading ? '...' : stats.documents}
              </div>
              <div style={{ 
                fontSize: 13,
                color: '#9ca3af',
              }}>
                {stats.documents === 1 ? 'document' : 'documents'} created
              </div>
            </div>
          </div>

          {/* Decks Card */}
          <div
            data-testid="stat-card-decks"
            onClick={() => navigate('/decks')}
            style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: 16,
              padding: 24,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              opacity: 0.1,
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: 40,
                marginBottom: 12,
              }}>
                🎴
              </div>
              <div style={{ 
                fontSize: 14,
                color: '#6b7280',
                fontWeight: 600,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Flashcard Decks
              </div>
              <div style={{ 
                fontSize: 36,
                fontWeight: 800,
                color: '#111827',
                marginBottom: 4,
              }}>
                {stats.loading ? '...' : stats.decks}
              </div>
              <div style={{ 
                fontSize: 13,
                color: '#9ca3af',
              }}>
                {stats.decks === 1 ? 'deck' : 'decks'} ready to study
              </div>
            </div>
          </div>

          {/* Quizzes Card */}
          <div
            data-testid="stat-card-quizzes"
            onClick={() => navigate('/quizzes')}
            style={{
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: 16,
              padding: 24,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              opacity: 0.1,
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: 40,
                marginBottom: 12,
              }}>
                📝
              </div>
              <div style={{ 
                fontSize: 14,
                color: '#6b7280',
                fontWeight: 600,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Quizzes
              </div>
              <div style={{ 
                fontSize: 36,
                fontWeight: 800,
                color: '#111827',
                marginBottom: 4,
              }}>
                {stats.loading ? '...' : stats.quizzes}
              </div>
              <div style={{ 
                fontSize: 13,
                color: '#9ca3af',
              }}>
                {stats.quizzes === 1 ? 'quiz' : 'quizzes'} available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ 
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 20,
          color: '#111827',
        }}>
          ⚡ Quick Actions
        </h2>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {/* Create Document */}
          <button
            onClick={() => navigate('/documents')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              New Document
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Upload or create content
            </div>
          </button>

          {/* Create Deck */}
          <button
            onClick={() => navigate('/decks')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎴</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              New Deck
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Create flashcard deck
            </div>
          </button>

          {/* Take Quiz */}
          <button
            onClick={() => navigate('/quizzes')}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              Take Quiz
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Test your knowledge
            </div>
          </button>

          {/* Study Cards */}
          <button
            onClick={() => navigate('/decks')}
            style={{
              background: 'white',
              color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              Study Now
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Review flashcards
            </div>
          </button>
        </div>
      </div>

      {/* Getting Started / Tips */}
      <div style={{
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: 16,
        padding: 32,
      }}>
        <h2 style={{ 
          fontSize: 20,
          fontWeight: 700,
          marginTop: 0,
          marginBottom: 20,
          color: '#111827',
        }}>
          💡 Getting Started
        </h2>
        
        <div style={{ 
          display: 'grid',
          gap: 16,
        }}>
          <div style={{ 
            display: 'flex',
            gap: 16,
            padding: 16,
            background: '#f9fafb',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ 
              fontSize: 24,
              minWidth: 40,
            }}>
              1️⃣
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                Upload Your Notes
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                Go to <strong>Documents</strong> and upload PDFs or paste markdown content to get started.
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex',
            gap: 16,
            padding: 16,
            background: '#f9fafb',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ 
              fontSize: 24,
              minWidth: 40,
            }}>
              2️⃣
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                Generate AI Content
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                Use the <strong>Generate Quiz with AI</strong> button to automatically create quizzes from your documents.
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex',
            gap: 16,
            padding: 16,
            background: '#f9fafb',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ 
              fontSize: 24,
              minWidth: 40,
            }}>
              3️⃣
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                Study & Track Progress
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                Take quizzes, review flashcards, and track your performance over time.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}