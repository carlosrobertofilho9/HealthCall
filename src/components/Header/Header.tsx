import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const Header: React.FC = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
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

	return (
		<header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#264532] px-10 py-4">
			<div className="flex items-center gap-4 text-white">
				<div className="size-8 text-primary">
					<svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
							fill="currentColor"
						></path>
					</svg>
				</div>
				<h1 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">HealthCall</h1>
			</div>
			<nav className="hidden md:flex flex-1 justify-center gap-8">
				<a className="text-primary text-base font-bold leading-normal" href="#">
					Fila de Atendimento
				</a>
				<a
					className="text-white text-base font-medium leading-normal hover:text-primary transition-colors"
					href="#"
				>
					Histórico
				</a>
				<a
					className="text-white text-base font-medium leading-normal hover:text-primary transition-colors"
					href="#"
				>
					Configurações
				</a>
			</nav>
			<div className="flex items-center gap-4">
				<button className="flex cursor-pointer items-center justify-center rounded-full h-12 w-12 bg-[#264532] text-white hover:bg-[#325a42] transition-colors">
					<span className="material-symbols-outlined">notifications</span>
				</button>
				<div className="relative" ref={menuRef}>
					<button onClick={toggleMenu} className="focus:outline-none">
						<div
							className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-primary"
							style={{
								backgroundImage:
									'url("https://lh3.googleusercontent.com/a/ACg8ocJ-1E7JG_KO7d9QG3bBqg5ZgZ0wZz9wY4z_zZz9wY4z_zQ=s96-c-rg-br100")',
							}}
						></div>
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