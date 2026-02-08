import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { LayoutList, Monitor, Bell, Settings, LogOut, CalendarDays, Menu, X, FileText } from 'lucide-react';

/**
 * The main header component for the application.
 * It displays the application logo, navigation links, and a user menu with a logout option.
 */
const Header: React.FC = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [initials, setInitials] = useState<string>('');
	const navigate = useNavigate();
	const menuRef = useRef<HTMLDivElement>(null);

	/**
	 * Handles the user logout process.
	 * Signs the user out of Supabase and navigates to the login page.
	 */
	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error('Error logging out:', error);
		} else {
			navigate('/login');
		}
	};

	/**
	 * Toggles the visibility of the user dropdown menu.
	 */
	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
	 * Effect to fetch the current user's data on component mount
	 * to display their avatar or initials.
	 */
	useEffect(() => {
		/**
		 * Computes user initials from a name or email string.
		 * @param {string | null | undefined} text - The user's name or email.
		 * @returns {string} The computed initials (e.g., "JD" for "John Doe").
		 */
		function computeInitials(text: string | null | undefined) {
			const value = (text ?? '').trim();
			if (!value) return '?';
			if (value.includes(' ')) {
				const parts = value.split(' ').filter(Boolean);
				const first = parts[0][0] ?? '';
				const last = parts[parts.length - 1][0] ?? '';
				return (first + last).toUpperCase();
			}
			// email or single name
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

	const navLinkClass = ({ isActive }: { isActive: boolean }) =>
		`flex items-center gap-2 text-base leading-normal transition-colors ${
			isActive
				? 'text-primary font-bold'
				: 'text-white font-medium hover:text-primary'
		}`;

	return (
		<header className="relative flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#264532] px-10 py-4">
			<div className="flex items-center gap-4 text-white">
				<Link to="/" className="h-8 w-auto">
					<img src="/healthcall-logo-header.png" alt="HealthCall Logo" className="h-full w-auto object-contain" />
				</Link>
				<Link to="/">
					<h1 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">HealthCall</h1>
				</Link>
			</div>
			
			<nav className="hidden md:flex items-center gap-8">
				<NavLink to="/" end className={navLinkClass}>
					<LayoutList className="w-5 h-5" />
					<span>Fila</span>
				</NavLink>
				<NavLink to="/appointments" className={navLinkClass}>
					<CalendarDays className="w-5 h-5" />
					<span>Marcações</span>
				</NavLink>
				<NavLink to="/display" className={navLinkClass}>
					<Monitor className="w-5 h-5" />
					<span>Display</span>
				</NavLink>
        <NavLink to="/documents" className={navLinkClass}>
					<FileText className="w-5 h-5" />
					<span>Documentos</span>
				</NavLink>
        <NavLink to="/warnings" className={navLinkClass}>
					<Bell className="w-5 h-5" />
					<span>Avisos</span>
				</NavLink>
				<NavLink to="/settings" className={navLinkClass}>
					<Settings className="w-5 h-5" />
					<span>Ajustes</span>
				</NavLink>
			</nav>

			<div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

				<div className="relative hidden md:block" ref={menuRef}>
					<button 
						onClick={toggleMenu} 
						className="focus:outline-none"
					>
						{avatarUrl ? (
							<div
								className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-primary"
								style={{ backgroundImage: `url("${avatarUrl}")` }}
								aria-label="Foto do usuário"
								role="img"
							/>
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
								<LogOut className="mr-2 w-4 h-4" />
								Sair
							</button>
						</div>
					)}
				</div>
			</div>

      {/* Mobile Menu Overlay */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 top-[73px] bg-[#1a3a26] p-6 flex flex-col gap-6 md:hidden z-50 overflow-y-auto">
					<NavLink 
            to="/" 
            end 
            className={(props) => navLinkClass(props) + ' text-lg py-2'}
            onClick={() => setIsMobileMenuOpen(false)}
          >
						<LayoutList className="w-5 h-5" />
						<span>Fila</span>
					</NavLink>
					<NavLink 
            to="/appointments" 
            className={(props) => navLinkClass(props) + ' text-lg py-2'}
            onClick={() => setIsMobileMenuOpen(false)}
          >
						<CalendarDays className="w-5 h-5" />
						<span>Marcações</span>
					</NavLink>
					<NavLink 
            to="/display" 
            className={(props) => navLinkClass(props) + ' text-lg py-2'}
            onClick={() => setIsMobileMenuOpen(false)}
          >
						<Monitor className="w-5 h-5" />
						<span>Display</span>
					</NavLink>
          <NavLink 
            to="/warnings" 
            className={(props) => navLinkClass(props) + ' text-lg py-2'}
            onClick={() => setIsMobileMenuOpen(false)}
          >
						<Bell className="w-5 h-5" />
						<span>Avisos</span>
					</NavLink>
					<NavLink 
            to="/settings" 
            className={(props) => navLinkClass(props) + ' text-lg py-2'}
            onClick={() => setIsMobileMenuOpen(false)}
          >
						<Settings className="w-5 h-5" />
						<span>Ajustes</span>
					</NavLink>
          
          <div className="border-t border-[#264532] pt-6 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-white font-medium hover:text-red-400 w-full text-lg py-2"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
				</div>
			)}
		</header>
	);
};

export default Header;