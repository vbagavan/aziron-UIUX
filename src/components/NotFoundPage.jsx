export default function NotFoundPage({ onNavigate }) {
  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-white via-blue-50 to-indigo-50 overflow-hidden">
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

      {/* Left side - SVG Illustration */}
      <div className="hidden lg:flex w-1/2 items-center justify-center">
        <div className="w-full h-full flex items-center justify-center px-2 lg:px-4">
          <object
            data="/astronaut.svg"
            type="image/svg+xml"
            className="w-full h-full max-w-lg"
          />
        </div>
      </div>

      {/* Right side - Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 lg:px-6">
        <div className="flex flex-col gap-6 w-full text-center lg:text-left">
          {/* 404 Number */}
          <div>
            <p className="text-8xl lg:text-9xl font-black text-gray-900 leading-none">404</p>
          </div>

          {/* Heading and Text */}
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              UH OH! You're lost.
            </h1>
            <p className="text-lg text-gray-700 leading-relaxed">
              The page you are looking for does not exist. How you got here is a mystery. But you can click the button below to go back to the homepage.
            </p>
          </div>

          {/* Button */}
          <div className="pt-4 flex justify-center lg:justify-start">
            <button
              onClick={() => onNavigate?.("new-chat")}
              className="px-10 py-3 rounded-lg bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Back to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
