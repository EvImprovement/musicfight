import React, { useEffect } from 'react';
import type { Option } from '../types/game';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuestionCardProps {
  options: Option[];
  selectedOption: Option | null;
  correctOption: Option | null;
  isAnswered: boolean;
  onSelectOption: (option: Option) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  options,
  selectedOption,
  correctOption,
  isAnswered,
  onSelectOption
}) => {
  // Support keyboard shortcuts 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (options[index]) {
          onSelectOption(options[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, isAnswered, onSelectOption]);

  const getOptionStateClass = (opt: Option) => {
    if (!isAnswered) return '';
    if (correctOption && opt.id === correctOption.id) return 'correct-answer';
    if (selectedOption && opt.id === selectedOption.id) return 'wrong-answer';
    return 'dimmed-answer';
  };

  return (
    <div className="question-card-container">
      <div className="options-grid">
        {options.map((option, index) => {
          const stateClass = getOptionStateClass(option);
          const isSelected = selectedOption?.id === option.id;
          const isCorrect = correctOption?.id === option.id;

          return (
            <button
              key={option.id}
              className={`option-button ${stateClass} ${isSelected ? 'selected' : ''}`}
              onClick={() => !isAnswered && onSelectOption(option)}
              disabled={isAnswered}
            >
              <div className="option-badge-key">
                <span>{index + 1}</span>
              </div>
              <div className="option-content">
                <span className="option-title">{option.title}</span>
                <span className="option-artist">{option.artistName}</span>
              </div>
              {isAnswered && (
                <div className="option-feedback-icon">
                  {isCorrect && <CheckCircle2 className="feedback-icon text-success" />}
                  {isSelected && !isCorrect && <XCircle className="feedback-icon text-danger" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
