
import React, { useState } from 'react';
import Spinner from './Spinner';

interface InputFormProps {
  onSubmit: (word: string) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [word, setWord] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim() && !isLoading) {
      onSubmit(word.trim());
    }
  };

  return (
    <div className="text-center p-8 bg-gray-800/50 rounded-2xl shadow-2xl max-w-lg w-full backdrop-blur-lg animate-fade-in">
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Start Your Word Web</h2>
        <p className="text-gray-400 mb-6">Enter a single word or concept to begin exploring its connections.</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g., 'Creativity'"
            className="flex-grow px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
            disabled={isLoading}
        />
        <button
            type="submit"
            className="px-6 py-3 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            disabled={isLoading || !word.trim()}
        >
            {isLoading ? <Spinner /> : 'Generate'}
        </button>
        </form>
    </div>
  );
};

export default InputForm;
