interface ProgressOverlayProps {
  currentStep: number;
  error: string | null;
  onRetry: () => void;
}

const steps = [
  { id: 1, text: "Mengunggah dokumen..." },
  { id: 2, text: "Azure AI membaca dokumen..." },
  { id: 3, text: "Mengekstrak data dari dokumen..." },
  { id: 4, text: "Mencocokkan data dengan Purchase Order..." },
  { id: 5, text: "Menyimpan hasil ke database..." },
  { id: 6, text: "Selesai! Mengalihkan ke hasil verifikasi..." },
];

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const ScanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="7" width="10" height="10" rx="1" />
  </svg>
);

const ExtractIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CompareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" x2="12" y1="22.08" y2="12" />
  </svg>
);

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" x2="9" y1="9" y2="15" />
    <line x1="9" x2="15" y1="9" y2="15" />
  </svg>
);

const Spinner = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export function ProgressOverlay({ currentStep, error, onRetry }: ProgressOverlayProps) {
  const getIcon = (stepId: number) => {
    switch (stepId) {
      case 1: return <UploadIcon />;
      case 2: return <ScanIcon />;
      case 3: return <ExtractIcon />;
      case 4: return <CompareIcon />;
      case 5: return <DatabaseIcon />;
      case 6: return <CheckIcon />;
      default: return null;
    }
  };

  const getStepStatus = (stepId: number) => {
    if (error && stepId === currentStep) return 'error';
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#F7F8F6',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}
      >
        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#DC2626', marginBottom: '16px' }}>
              <ErrorIcon />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F1A16', marginBottom: '12px' }}>
              Terjadi Kesalahan
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.5' }}>
              {error}
            </p>
            <button
              onClick={onRetry}
              style={{
                width: '100%',
                height: '48px',
                background: '#0D4B3B',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#0a3d30'}
              onMouseOut={(e) => e.currentTarget.style.background = '#0D4B3B'}
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F1A16', marginBottom: '8px', textAlign: 'center' }}>
              Memproses Verifikasi
            </h2>
            <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', marginBottom: '32px' }}>
              Proses ini biasanya memakan waktu 15-30 detik. Mohon jangan tutup halaman ini.
            </p>

            {/* Progress Bar */}
            <div
              style={{
                height: '8px',
                background: '#E5E7EB',
                borderRadius: '4px',
                marginBottom: '32px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#0D4B3B',
                  borderRadius: '4px',
                  width: `${progress}%`,
                  transition: 'width 0.5s ease'
                }}
              />
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {steps.map((step) => {
                const status = getStepStatus(step.id);
                return (
                  <div
                    key={step.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: status === 'active' ? '#F0FAF7' : 'transparent',
                      transition: 'background 0.3s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          status === 'completed'
                            ? '#DCFCE7'
                            : status === 'active'
                            ? '#0D4B3B'
                            : '#E5E7EB',
                        color:
                          status === 'completed'
                            ? '#16A34A'
                            : status === 'active'
                            ? 'white'
                            : '#9CA3AF',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {status === 'active' ? <Spinner /> : status === 'completed' ? <CheckIcon /> : getIcon(step.id)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: status === 'active' ? '600' : '400',
                          color: status === 'active' ? '#0D4B3B' : '#6B7280',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {step.text}
                      </p>
                    </div>
                    {status === 'completed' && (
                      <div
                        style={{
                          color: '#16A34A',
                          animation: 'fadeIn 0.3s ease'
                        }}
                      >
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
