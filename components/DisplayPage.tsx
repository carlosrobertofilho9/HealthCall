import React from 'react';

const DisplayPage: React.FC = () => {
  // Dados mocados por enquanto
  const patientName = "Sofia Oliveira";
  const room = "Sala 2";
  const nextPatients = [
    "Carlos Mendes", "Ana Souza", "Lucas Pereira", "Mariana Costa", 
    "Ricardo Almeida", "Isabela Santos", "Gabriel Lima", "Fernanda Rocha", 
    "Rodrigo Martins", "Camila Fernandes"
  ];

  return (
    <div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="flex flex-col min-h-screen">
        <header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <svg className="text-[#38e07b]" fill="none" height="24" viewBox="0 0 48 48" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
            <h1 className="text-xl font-bold">PSF Central</h1>
          </div>
        </header>
        <main className="flex-grow flex flex-col justify-center items-center text-center p-8">
          <div className="animate-slide-in w-full max-w-4xl">
            <h2 className="text-6xl md:text-7xl font-bold text-[#38e07b] mb-4">Chamando</h2>
            <p className="text-7xl md:text-8xl font-black mb-6">{patientName}</p>
            <div className="inline-flex items-center gap-4 bg-gray-800 rounded-full px-8 py-4">
              <span className="material-symbols-outlined text-5xl text-[#38e07b]">meeting_room</span>
              <p className="text-6xl md:text-7xl font-bold">{room}</p>
            </div>
          </div>
        </main>
        <footer className="bg-gray-800 w-full overflow-hidden">
          <div className="flex items-center gap-12 p-4 animate-marquee">
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="font-semibold text-lg">Próximos:</span>
              <p className="text-lg text-gray-300">{nextPatients[0]}</p>
            </div>
            {nextPatients.slice(1).map((patient, index) => (
              <React.Fragment key={index}>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <p className="text-lg text-gray-300">{patient}</p>
              </React.Fragment>
            ))}
            {/* Duplicado para letreiro contínuo */}
            <div className="flex items-center gap-4 flex-shrink-0 pl-12">
                <span className="font-semibold text-lg">Próximos:</span>
                <p className="text-lg text-gray-300">{nextPatients[0]}</p>
            </div>
            {nextPatients.slice(1).map((patient, index) => (
                <React.Fragment key={`dup-${index}`}>
                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                    <p className="text-lg text-gray-300">{patient}</p>
                </React.Fragment>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DisplayPage;
