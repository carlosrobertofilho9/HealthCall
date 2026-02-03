import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useElectron } from '@/hooks/useElectron';
import { useAuth } from '@/hooks/useAuth';
import * as localDb from '@/services/localDatabase';
import { signOut } from '@/features/authentication/services/authService';
import { ConnectionStatus } from '@/components/ConnectionStatus';


import headerLogo from '@/assets/healthcall-logo-header.png';

/**
 * The main header component for the application.
 * It displays the application logo, navigation links, and a user menu with a logout option.
 */
const Header: React.FC = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [initials, setInitials] = useState<string>('HC');
	const [clinicName, setClinicName] = useState<string>('HealthCall');
	const navigate = useNavigate();
	const menuRef = useRef<HTMLDivElement>(null);
	const { isElectron, openDisplayWindow } = useElectron();
	const { user } = useAuth();


	/**
	 * Handles user logout
	 */
	const handleLogout = async () => {
		await signOut();
		navigate('/auth/login');
	};

	/**
	 * Toggles the visibility of the user dropdown menu.
	 */
	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	/**
	 * Effect to handle clicks outside the user menu to close it.
	 */
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
	}, []);

	/**
	 * Effect to fetch local clinic settings on component mount
	 */
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const name = await localDb.getSetting('clinic_name');
				if (name) {
					setClinicName(name);
					// Compute initials from clinic name
					const parts = name.split(' ').filter(Boolean);
					if (parts.length >= 2) {
						setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
					} else if (parts.length === 1) {
						setInitials(parts[0].slice(0, 2).toUpperCase());
					}
				}
			} catch (error) {
				console.error('Error loading settings:', error);
			}
		};
		loadSettings();
	}, []);

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
							? 'text-primary text-base font-bold leading-normal'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors'
					}
				>
					Fila de Atendimento
				</NavLink>
				{isElectron ? (
					<button
						onClick={() => openDisplayWindow()}
						className="text-white text-base font-medium leading-normal hover:text-primary transition-colors cursor-pointer"
					>
						Display
					</button>
				) : (
					<NavLink
						to="/display"
						className={({ isActive }) =>
							isActive
								? 'text-primary text-base font-bold leading-normal'
								: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors'
						}
					>
						Display
					</NavLink>
				)}

				<NavLink
					to="/dashboard/warnings"
					className={({ isActive }) =>
						isActive
							? 'text-primary text-base font-bold leading-normal'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors'
					}
				>
					Avisos
				</NavLink>
				<NavLink
					to="/settings"
					className={({ isActive }) =>
						isActive
							? 'text-primary text-base font-bold leading-normal'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors'
					}
				>
					Configurações
				</NavLink>
			</nav>
			<div className="flex items-center gap-4">
				{/* Status de conexão de rede */}
				<ConnectionStatus showDetails />
				
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
								{user?.name || clinicName}
							</div>
							<div className="px-4 py-1 text-xs text-gray-500">
								{user?.email}
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

export default Header;