import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Users, Monitor, Megaphone, Settings } from 'lucide-react';

import headerLogo from '@/assets/healthcall-logo-header.png';

export const Header: React.FC = () => {
	const location = useLocation();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const { user, signOut } = useAuth();
	
	// Initials state
	const [initials, setInitials] = useState<string>('');
	const [clinicName, setClinicName] = useState<string>('Clínica');

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const handleLogout = async () => {
		try {
			await signOut();
			setIsMenuOpen(false);
		} catch (error) {
			console.error('Logout failed', error);
		}
	};

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [menuRef]);

	// Load settings for initials
	useEffect(() => {
		const loadSettings = () => {
			try {
				const savedSettings = localStorage.getItem('clinic_settings');
				if (savedSettings) {
					const { name } = JSON.parse(savedSettings);
					setClinicName(name || 'Clínica');
					
					const parts = name.split(' ').filter(Boolean);
					if (parts.length >= 2) {
						setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
					} else if (parts.length === 1) {
						setInitials(parts[0].slice(0, 2).toUpperCase());
					} else {
						setInitials('CL');
					}
				} else {
					setInitials('CL');
				}
			} catch (error) {
				console.error('Error loading settings:', error);
				setInitials('CL');
			}
		};
		loadSettings();
	}, []);

	// Update initials when user changes (optional, if user name prevails over clinic settings)
	useEffect(() => {
		if (user?.name) {
			// If we want to show user initials instead of clinic
			// For now keeping legacy behavior which seemed to load from local settings
		}
	}, [user]);

	return (
		<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#264532] px-10 py-4">
			<div className="flex items-center gap-4 text-white">
				<Link to="/" className="h-8 w-auto">
					<img src={headerLogo} alt="HealthCall Logo" className="h-full w-auto object-contain" />
				</Link>
				<Link to="/">
					<h1 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">HealthCall</h1>
				</Link>
			</div>
			<nav className="hidden md:flex flex-1 justify-center gap-8">
				<NavLink
					to="/"
					end
					className={({ isActive }) =>
						isActive
							? 'text-primary text-base font-bold leading-normal flex items-center gap-2'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors flex items-center gap-2'
					}
				>
					<Users size={20} />
					Fila
				</NavLink>
				
				<NavLink
					to="/display"
					className={({ isActive }) =>
						isActive
							? 'text-primary text-base font-bold leading-normal flex items-center gap-2'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors flex items-center gap-2'
					}
				>
					<Monitor size={20} />
					Painel
				</NavLink>

				<NavLink
					to="/warnings"
					className={({ isActive }) =>
						isActive
							? 'text-primary text-base font-bold leading-normal flex items-center gap-2'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors flex items-center gap-2'
					}
				>
					<Megaphone size={20} />
					Avisos
				</NavLink>
				<NavLink
					to="/settings"
					className={({ isActive }) =>
						isActive
							? 'text-primary text-base font-bold leading-normal flex items-center gap-2'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors flex items-center gap-2'
					}
				>
					<Settings size={20} />
					Ajustes
				</NavLink>
			</nav>
			<div className="flex items-center gap-4">
				{/* Status de conexão de rede */}
				<ConnectionStatus />
				
				<div className="relative" ref={menuRef}>
					<button onClick={toggleMenu} className="focus:outline-none">
						<div
							className="aspect-square rounded-full size-12 border-2 border-primary bg-[#325a42] text-white flex items-center justify-center font-bold"
							aria-label="Iniciais da clínica"
							role="img"
						>
							{initials}
						</div>
					</button>
					{isMenuOpen && (
						<div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
							<div className="px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
								{user?.email || clinicName}
							</div>
							<Link
								to="/settings"
								className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
								onClick={() => setIsMenuOpen(false)}
							>
								<span className="material-symbols-outlined mr-2">settings</span>
								Configurações
							</Link>
							<button
								onClick={handleLogout}
								className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
							>
								<span className="material-symbols-outlined mr-2">logout</span>
								Sair
							</button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};