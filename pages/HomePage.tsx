
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="text-center py-10">
      <h1 className="text-5xl font-bold text-sky-400 mb-6 font-['Orbitron'] tracking-wide">
        Bem-vindo ao 3DeT Victory!
      </h1>
      <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
        Sua plataforma completa para gerenciar personagens, campanhas e mergulhar em aventuras épicas no universo 3D&T Alpha e além!
      </p>
      <div className="space-x-4">
        <Link 
          to="/characters"
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 transform hover:scale-105"
        >
          Ver Minhas Fichas
        </Link>
        <Link 
          to="/campaigns"
          className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 transform hover:scale-105"
        >
          Explorar Campanhas
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <h3 className="text-2xl font-semibold text-sky-400 mb-3">Gerenciamento de Fichas</h3>
          <p className="text-slate-400">Crie, edite e organize suas fichas de personagem com facilidade. Atributos, vantagens, desvantagens, tudo em um só lugar.</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <h3 className="text-2xl font-semibold text-sky-400 mb-3">Mestre suas Campanhas</h3>
          <p className="text-slate-400">Planeje suas aventuras, convide jogadores, gerencie NPCs e registre o progresso de cada sessão.</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
          <h3 className="text-2xl font-semibold text-sky-400 mb-3">Compêndio de Regras</h3>
          <p className="text-slate-400">Acesse rapidamente um compêndio de vantagens, técnicas, perícias e outras regras do sistema 3D&T.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
