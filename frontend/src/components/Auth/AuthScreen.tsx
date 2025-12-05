import React from 'react';
import { BookOpen } from 'lucide-react';
import { theme } from '../../types';

interface AuthScreenProps {
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  isRegistering: boolean;
  setIsRegistering: (r: boolean) => void;
  handleLogin: (e: React.FormEvent) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  isRegistering,
  setIsRegistering,
  handleLogin,
}) => (
  <div className={`min-h-screen flex items-center justify-center ${theme.softBg} font-serif relative overflow-hidden`}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
      body, .font-serif { font-family: 'Lora', serif; }
    `}</style>
    
    {/* Фон и декорации */}
    <div className="absolute top-0 left-0 w-64 h-64 bg-[#274E7D]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#274E7D]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

    <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#274E7D]/20 z-10 relative">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#274E7D] rounded-full mx-auto mb-4 flex items-center justify-center text-white">
          <BookOpen size={32} />
        </div>
        <h1 className={`text-4xl font-bold ${theme.primaryText} mb-2 tracking-tight`}>lazy reading</h1>
        <p className="text-gray-500 italic font-serif text-sm">Добро пожаловать в ваше тихое место</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 font-serif">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider ${theme.primaryText} mb-2`}>
            Имя пользователя
          </label>
          <input 
            type="text" 
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274E7D] focus:border-transparent transition-all"
            placeholder="Введите имя пользователя"
          />
        </div>
        
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider ${theme.primaryText} mb-2`}>
            Пароль
          </label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274E7D] focus:border-transparent transition-all"
            placeholder="Введите пароль"
          />
        </div>

        <button 
          type="submit"
          className={`w-full ${theme.primary} text-white py-4 rounded-lg hover:opacity-90 transition duration-200 font-bold shadow-lg shadow-[#274E7D]/20 mt-4`}
        >
          {isRegistering ? 'Создать карту' : 'Войти в библиотеку'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm font-serif pt-6 border-t border-gray-100">
        <span className="text-gray-500">
          {isRegistering ? "Уже есть карта? " : "Нет карты? "}
        </span>
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className={`${theme.primaryText} font-bold hover:underline transition-all`}
        >
          {isRegistering ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </div>
    </div>
  </div>
);