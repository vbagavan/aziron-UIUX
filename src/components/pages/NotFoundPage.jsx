export default function NotFoundPage({ onNavigate }) {
  return (
    <div className="app-page-main flex h-full min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain bg-background">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-40px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        #spaceman {
          animation: float 4s ease-in-out infinite;
        }
        #planet {
          animation: spin 20s linear infinite;
        }
        #starsBig {
          animation: twinkle 3s ease-in-out infinite;
        }
        #starsSmall {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>

      <div className="hidden lg:flex w-1/2 items-center justify-center bg-muted/30">
        <div className="flex h-full w-full items-center justify-center px-2 lg:px-4">
          <object
            data="/astronaut.svg"
            type="image/svg+xml"
            className="h-full w-full max-w-lg"
          />
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-4 lg:w-1/2 lg:px-6">
        <div className="flex w-full flex-col gap-6 text-center lg:text-left">
          <div>
            <p className="text-8xl font-black leading-none text-foreground lg:text-9xl">404</p>
          </div>

          <div className="space-y-4">
            <h1 className="type-page-title text-4xl lg:text-5xl">
              UH OH! You&apos;re lost.
            </h1>
            <p className="type-page-subtitle text-lg leading-relaxed">
              The page you are looking for does not exist. How you got here is a mystery. But you
              can click the button below to go back to the homepage.
            </p>
          </div>

          <div className="flex justify-center pt-4 lg:justify-start">
            <button
              type="button"
              onClick={() => onNavigate?.("new-chat")}
              className="rounded-lg bg-primary px-10 py-3 text-lg font-bold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
