import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import type { CallRecord, Patient } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { appendCallHistory } from '@/actions/patients';

const DisplayPage: React.FC = () => {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
	const [nextPatients, setNextPatients] = useState<Patient[]>([]);
	const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
	const lastCalledRef = useRef<{ id: number; callCount: number } | null>(null);
	const [isCalling, setIsCalling] = useState(false);
	const [audioActivated, setAudioActivated] = useState(false);

	useEffect(() => {
		const getSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setSession(session);
			setLoading(false);
		};

		getSession();

		const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			if (!session) {
				navigate('/login?redirect=/display');
			}
		});

		return () => {
			authListener?.subscription.unsubscribe();
		};
	}, [navigate]);

	const handleActivateAudio = () => {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}
		// Toca um som de sino silencioso para "aquecer" o sistema de áudio
		const bell = new Audio('/bell.mp3');
		bell.volume = 0.01;
		bell.play().catch(e => console.error("Erro ao pré-carregar áudio:", e));
		setAudioActivated(true);
	};

	useEffect(() => {
		if (!loading && !session) {
			navigate('/login?redirect=/display');
		}
	}, [session, loading, navigate]);

	useEffect(() => {
		if (!session || !audioActivated) return;

		const playBellAndSpeak = async (patient: Patient) => {
			// Previne chamadas duplicadas se o evento for recebido múltiplas vezes
			if (
				patient.id === lastCalledRef.current?.id &&
				patient.callCount === lastCalledRef.current?.callCount
			) {
				return;
			}
			lastCalledRef.current = { id: patient.id, callCount: patient.callCount };

			setIsCalling(true);
			try {
				const { data, error } = await supabase.functions.invoke('generate-tts', {
					body: { text: `Chamando ${patient.name}, para ${patient.destination}` },
				});

				if (error) throw new Error(`Erro ao invocar função: ${error.message}`);
				if (!data?.speechUrl) throw new Error('Falha ao gerar áudio TTS: URL não recebida.');

				const bell = new Audio('/bell.mp3');
				await bell.play();

				await new Promise<void>((resolve, reject) => {
					bell.onended = () => {
						const speechAudio = new Audio(data.speechUrl);
						speechAudio.play();
						speechAudio.onended = () => resolve();
						speechAudio.onerror = (e) => {
							console.error("Erro ao tocar áudio da fala:", e);
							reject(e);
						};
					};
					bell.onerror = (e) => {
						console.error("Erro ao tocar sino:", e);
						reject(e);
					};
				});
			} catch (error) {
				console.error('Erro durante a chamada de áudio:', error);
			} finally {
				setTimeout(() => setIsCalling(false), 500);
			}
		};

		const fetchDisplayData = async () => {
			// Busca o último paciente chamado
			const { data: lastCalls } = await supabase
				.from('calls')
				.select('*, patients(*)')
				.order('created_at', { ascending: false })
				.limit(1);

			const lastCall = lastCalls ? lastCalls[0] : null;

			if (lastCall && lastCall.patients) {
				const patient = {
					...lastCall.patients,
					destination: lastCall.location,
					status: 'Chamado',
				};
				setCalledPatient(patient as Patient);
			}

			// Busca o histórico de chamadas
			const { data: historyData } = await supabase
				.from('calls')
				.select('*, patients(*)')
				.order('created_at', { ascending: false })
				.limit(10);

			if (historyData) {
				const history = historyData
					.map((call) => ({
						id: call.patients.id,
						name: call.patients.name,
						destination: call.location,
						callCount: call.patients.callCount,
						calledAt: new Date(call.created_at).getTime(),
					}))
					.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
				setCallHistory(history);
			}

			// Busca próximos pacientes
			const { data: nextData } = await supabase
				.from('patients')
				.select('*')
				.eq('status', 'Aguardando')
				.order('created_at', { ascending: true });

			if (nextData) {
				setNextPatients(nextData);
			}
		};

		fetchDisplayData();

		const channel = supabase
			.channel('realtime-display')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
				fetchDisplayData();
			})
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls' }, async (payload) => {
				const newCall = payload.new as { patient_id: string; location: string };
				const { data: patientDataArr } = await supabase
					.from('patients')
					.select('*')
					.eq('id', newCall.patient_id);

				const patientData = patientDataArr ? patientDataArr[0] : null;

				if (patientData) {
					const patient = {
						...patientData,
						destination: newCall.location,
						status: 'Chamado',
					};
					playBellAndSpeak(patient as Patient);
				}
				fetchDisplayData();
			})
			.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, fetchDisplayData)
			.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calls' }, fetchDisplayData)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [session, audioActivated]);

	const patientName = calledPatient?.name || 'Aguardando chamada...';
	const room = calledPatient?.destination || '-';

	if (loading || !session) {
		return (
			<div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
				<h1 className="text-4xl mb-8">Carregando...</h1>
				<p className="mt-4 text-gray-400">Verificando autenticação.</p>
			</div>
		);
	}

	if (!audioActivated) {
		return (
			<div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-4xl mb-4">Bem-vindo à Tela de Chamadas</h1>
					<p className="text-lg text-gray-400 mb-8">
						Para garantir que os alertas sonoros funcionem, o navegador exige uma interação inicial.
					</p>
					<button
						onClick={handleActivateAudio}
						className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
					>
						<span className="material-symbols-outlined align-middle mr-2">volume_up</span>
						Ativar Som e Iniciar
					</button>
				</div>
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
				<main className="flex-grow p-6 md:p-10 w-full flex flex-col">
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
