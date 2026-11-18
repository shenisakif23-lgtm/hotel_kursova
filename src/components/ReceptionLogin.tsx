import { Eye, EyeOff, Lock } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { checkReceptionPassword } from '../utils/hotelLogic';

interface ReceptionLoginProps {
  onLoginSuccess: () => void;
}

export default function ReceptionLogin({ onLoginSuccess }: ReceptionLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (checkReceptionPassword(password)) {
      setErrorMessage('');
      setPassword('');
      onLoginSuccess();
    } else {
      setErrorMessage('Грешна парола. Моля, опитай отново.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white space-y-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-teal-300 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">Вход за рецепция</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          <div>
            <label
              htmlFor="reception-password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Парола
            </label>
            <div className="relative">
              <input
                id="reception-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) {
                    setErrorMessage('');
                  }
                }}
                placeholder="Въведи парола"
                required
                className="w-full pl-3.5 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-colors"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Скрий паролата' : 'Покажи паролата'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:bg-teal-50 hover:text-teal-700 rounded-md transition-all duration-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] rounded-lg transition-all duration-200 cursor-pointer"
          >
            Влизане
          </button>
        </form>
      </div>
    </div>
  );
}
