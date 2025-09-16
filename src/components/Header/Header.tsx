import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const Header: React.FC = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [initials, setInitials] = useState<string>('');
	const navigate = useNavigate();
	const menuRef = useRef<HTMLDivElement>(null);

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error('Error logging out:', error);
		} else {
			navigate('/login');
		}
	};

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

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

	useEffect(() => {
		function computeInitials(text: string | null | undefined) {
			const value = (text ?? '').trim();
			if (!value) return '?';
			if (value.includes(' ')) {
				const parts = value.split(' ').filter(Boolean);
				const first = parts[0][0] ?? '';
				const last = parts[parts.length - 1][0] ?? '';
				return (first + last).toUpperCase();
			}
			// email ou nome único
			return value.slice(0, 2).toUpperCase();
		}

		(async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;
			const meta = (user.user_metadata ?? {}) as Record<string, any>;
			const name: string | undefined = meta.name || meta.full_name;
			const avatar: string | undefined = meta.avatar_url;
			setAvatarUrl(avatar ?? null);
			setInitials(computeInitials(name || user.email));
		})();
	}, []);

	return (
		<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#264532] px-10 py-4">
			<div className="flex items-center gap-4 text-white">
				<Link to="/" className="size-8 text-primary">
					<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
							fill="currentColor"
						></path>
					</svg>
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
				<NavLink
					to="/display"
					className={({ isActive }) =>
						isActive
							? 'text-primary text-base font-bold leading-normal'
							: 'text-white text-base font-medium leading-normal hover:text-primary transition-colors'
					}
				>
					Histórico
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
				{isApiAvailable && (
					<div className="flex cursor-pointer items-center justify-center rounded-full h-12 w-12 bg-[#264532] text-white hover:bg-[#325a42] transition-colors">
						<google-cast-launcher style={{ width: '24px', height: '24px' }} />
					</div>
				)}
				<div className="relative" ref={menuRef}>
					<button onClick={toggleMenu} className="focus:outline-none">
						{avatarUrl ? (
							<div
								className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-primary"
								style={{ backgroundImage: `url("${avatarUrl}")` }}
								aria-label="Foto do usuário"
								role="img"
							></div>
						) : (
							<div
								className="aspect-square rounded-full size-12 border-2 border-primary bg-[#325a42] text-white flex items-center justify-center font-bold"
								aria-label="Iniciais do usuário"
								role="img"
							>
								{initials}
							</div>
						)}
					</button>
					{isMenuOpen && (
						<div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
							<button
								onClick={handleLogout}
								className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
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