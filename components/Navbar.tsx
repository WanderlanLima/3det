
import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  const linkClass = "px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-sky-600 hover:text-white transition-colors";
  const activeLinkClass = "nav-link-active"; // Defined in index.html <style>

  return (
    <nav className="bg-slate-800 shadow-lg fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 text-white text-2xl font-bold font-['Orbitron']" aria-label="Página Inicial 3DeT Victory">
              3DeT Victory
            </NavLink>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} end aria-label="Página Inicial">Home</NavLink>
              <NavLink to="/characters" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} aria-label="Galeria de Fichas">Fichas</NavLink>
              <NavLink to="/character/new" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} aria-label="Criar Nova Ficha">Criar Ficha</NavLink>
              <NavLink to="/campaigns" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} aria-label="Galeria de Campanhas">Campanhas</NavLink>
              <NavLink to="/compendium" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} aria-label="Compêndio de Regras">Compêndio</NavLink>
              <NavLink to="/combat-simulator" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} aria-label="Simulador de Combate">Simulador</NavLink>
            </div>
          </div>
          <div className="hidden md:block">
             <NavLink to="/profile" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} aria-label="Perfil do Usuário">Perfil</NavLink>
             <NavLink to="/auth" className={({ isActive }) => isActive ? `${linkClass} ${activeLinkClass}` : linkClass} aria-label="Login ou Cadastro">Login/Cadastro</NavLink>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button type="button" className="bg-slate-700 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white" aria-label="Abrir menu principal">
              <span className="sr-only">Open main menu</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu, show/hide based on menu state - Implementation can be added later */}
      {/* <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <NavLink to="/" className={({ isActive }) => isActive ? `${activeLinkClass} block` : `block ${linkClass}`}>Home</NavLink>
          ... other links ...
        </div>
      </div> */}
    </nav>
  );
};

export default Navbar;
