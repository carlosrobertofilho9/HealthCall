import React, { useEffect, useRef, useState } from 'react';
import type { CallRecord, Patient } from '@/types';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

const DisplayPage: React.FC = () => {
	const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
	const [nextPatients, setNextPatients] = useState<Patient[]>([]);
	const [isReady, setIsReady] = useState(false);
	const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
	const { speak } = useSpeechSynthesis();
	const lastCalledRef = useRef<{ id: number; callCount: number } | null>(null);
	const [isCalling, setIsCalling] = useState(false);

	const handleStart = () => {
		setIsReady(true);
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		const buffer = audioContext.createBuffer(1, 1, 22050);
		const source = audioContext.createBufferSource();
		source.buffer = buffer;
		source.connect(audioContext.destination);
		source.start(0);
	};

	useEffect(() => {
		if (!isReady) return;

		const playBellAndSpeak = async (patient: Patient) => {
			setIsCalling(true);
			const bell = new Audio('/bell.mp3');
			try {
				await bell.play();
			} catch (error) {
				console.error('Erro ao tocar o som da campainha:', error);
			}
			await new Promise<void>((resolve) => {
				bell.onended = () => resolve();
				setTimeout(() => resolve(), 3000);
			});
			const textToSpeak = `Chamando ${patient.name}, para ${patient.destination}`;
			try {
				await speak(textToSpeak);
			} catch {}
			setTimeout(() => setIsCalling(false), 300);
		};

		const updateDisplay = () => {
			const storedCalledPatient = localStorage.getItem('calledPatient');
			const storedNextPatients = localStorage.getItem('nextPatients');
			const storedCallHistory = localStorage.getItem('callHistory');

			if (storedCalledPatient) {
				const patient: Patient = JSON.parse(storedCalledPatient);
				if (
					patient.id !== lastCalledRef.current?.id ||
					patient.callCount !== lastCalledRef.current?.callCount
				) {
					setCalledPatient(patient);
					playBellAndSpeak(patient);
					lastCalledRef.current = { id: patient.id, callCount: patient.callCount };
				}
			}
			if (storedNextPatients) setNextPatients(JSON.parse(storedNextPatients));
			if (storedCallHistory) {
				try {
					setCallHistory(JSON.parse(storedCallHistory));
				} catch {}
			}
		};

		const initialLoad = () => {
			const storedCalledPatient = localStorage.getItem('calledPatient');
			const storedNextPatients = localStorage.getItem('nextPatients');
			const storedCallHistory = localStorage.getItem('callHistory');
			if (storedCalledPatient) setCalledPatient(JSON.parse(storedCalledPatient));
			if (storedNextPatients) setNextPatients(JSON.parse(storedNextPatients));
			if (storedCallHistory) {
				try {
					setCallHistory(JSON.parse(storedCallHistory));
				} catch {}
			}
		};

		initialLoad();
		window.addEventListener('storage', updateDisplay);
		return () => window.removeEventListener('storage', updateDisplay);
	}, [isReady, speak]);

	const patientName = calledPatient?.name || 'Aguardando chamada...';
	const room = calledPatient?.destination || '-';

	if (!isReady) {
		return (
			<div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
				<h1 className="text-4xl mb-8">Tela de Chamada de Pacientes</h1>
				<button
					onClick={() => setIsReady(true)}
					className="bg-[#38e07b] text-gray-900 font-bold text-2xl px-12 py-6 rounded-lg shadow-lg hover:bg-green-400 transition-transform transform hover:scale-105"
				>
					▶ Iniciar Tela
				</button>
				<p className="mt-4 text-gray-400">Clique para habilitar o som</p>
			</div>
		);
	}

	if (isCalling) {
		return (
			<div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
				<div className="flex flex-col min-h-screen">
					<header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
						<div className="flex items-center gap-3">
							<svg className="text-[#38e07b]" fill="none" height="24" viewBox="0 0 48 48" width="24" xmlns="http://www.w3.org/2000/svg">
								<path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
							</svg>
							<h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
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
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gray-900 text-white" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
			<div className="flex flex-col min-h-screen">
				<header className="px-6 py-4 flex items-center justify-between border-b border-gray-700">
					<div className="flex items-center gap-3">
						<svg className="text-[#38e07b]" fill="none" height="24" viewBox="0 0 48 48" width="24" xmlns="http://www.w3.org/2000/svg">
							<path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
						</svg>
						<h1 className="text-xl font-bold">PSF Maria Lucia da Silva</h1>
					</div>
				</header>
				<main className="flex-grow p-6 md:p-10 w-full max-w-7xl mx-auto flex flex-col">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-grow">
						<div className="md:col-span-2 bg-gray-800 rounded-2xl p-8 text-center flex flex-col justify-center animate-slide-in">
							<h2 className="text-4xl md:text-5xl font-bold text-[#38e07b] mb-4">
								{calledPatient ? 'Chamado' : 'Aguardando chamada'}
							</h2>
							<p className="text-5xl md:text-6xl font-black mb-6">{patientName}</p>
							<div className="inline-flex items-center justify-center gap-4 bg-gray-700 rounded-full px-8 py-4">
								<span className="material-symbols-outlined text-4xl md:text-5xl text-[#38e07b]">meeting_room</span>
								<p className="text-4xl md:text-5xl font-bold">{room}</p>
							</div>
						</div>
						<aside className="bg-gray-800 rounded-2xl p-6 flex flex-col">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-xl font-bold">Histórico de Chamadas</h3>
							</div>
							<div className="space-y-3 pr-2 flex-grow">
								{callHistory.slice(0, 5).length === 0 && (
									<div className="flex items-center justify-center h-full">
										<p className="text-gray-400">Nenhuma chamada registrada.</p>
									</div>
								)}
								{callHistory.slice(0, 5).map((rec, idx) => (
									<div
										key={`${rec.id}-${rec.callCount}-${rec.calledAt}`}
										className={`p-4 rounded-lg transition-all duration-300 ${
											idx === 0
												? 'bg-green-800/50 border border-green-600 shadow-lg'
												: 'bg-gray-700/60 hover:bg-gray-700/90'
										}`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<span className="material-symbols-outlined text-2xl text-green-400">
													{idx === 0 ? 'campaign' : 'history'}
												</span>
												<div>
													<p className="font-bold text-white">{rec.name}</p>
													<p className="text-sm text-gray-300">{rec.destination}</p>
												</div>
											</div>
											<div className="text-right">
												<p className="text-sm font-semibold text-green-300">
													{new Date(rec.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</p>
												<span className="text-xs text-gray-400">{rec.callCount}ª chamada</span>
											</div>
										</div>
										{idx === 0 && calledPatient && (
											<div className="mt-2 text-center">
												<p className="text-sm font-semibold text-green-300 animate-pulse">Chamado</p>
											</div>
										)}
									</div>
								))}
							</div>
						</aside>
					</div>
					<section className="mt-8 bg-gray-800 rounded-2xl p-6">
						<h3 className="text-xl font-bold mb-4">Próximos pacientes</h3>
						{nextPatients.slice(0, 3).length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{nextPatients.slice(0, 3).map((p) => (
									<div key={p.id} className="bg-gray-700 rounded-xl p-4 flex items-center justify-between">
										<div>
											<p className="font-semibold">{p.name}</p>
											<p className="text-sm text-gray-300">{p.destination}</p>
										</div>
										<span className="material-symbols-outlined text-[#38e07b]">chevron_right</span>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-300">Não há pacientes na fila de espera.</p>
						)}
					</section>
				</main>
			</div>
		</div>
	);
};

export default DisplayPage;

