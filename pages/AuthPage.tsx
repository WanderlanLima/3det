
import React, { useState } from 'react';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const inputClass = "w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-100 placeholder-slate-400";
  const buttonClass = "w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300";
  const switchButtonClass = "text-sky-400 hover:text-sky-300 transition duration-150";

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-sky-400 mb-8">
          {isLogin ? 'Login' : 'Criar Conta'}
        </h2>
        
        <form className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nome Completo</label>
              <input type="text" name="name" id="name" required className={inputClass} placeholder="Seu Nome" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" name="email" id="email" required className={inputClass} placeholder="seuemail@exemplo.com" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <input type="password" name="password" id="password" required className={inputClass} placeholder="********" />
          </div>
          {!isLogin && (
             <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirmar Senha</label>
              <input type="password" name="confirmPassword" id="confirmPassword" required className={inputClass} placeholder="********" />
            </div>
          )}
          <div>
            <button type="submit" className={buttonClass}>
              {isLogin ? 'Entrar' : 'Registrar'}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
          <button onClick={() => setIsLogin(!isLogin)} className={`ml-2 font-semibold ${switchButtonClass}`}>
            {isLogin ? 'Crie uma agora' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
