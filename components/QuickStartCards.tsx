import React from "react";
import { Utensils, Carrot, Clock, ShoppingCart, Dumbbell, Apple, HeartPulse, CalendarCheck } from "lucide-react";

// Define the props interface
interface QuickStartCardsProps {
  onQuestionSelect: (question: string) => void;
}

// Define the question item interface
interface QuestionItem {
  icon: React.ReactNode;
  text: string;
  question: string;
}

const QuickStartCards: React.FC<QuickStartCardsProps> = ({
  onQuestionSelect,
}) => {
  const questions = [
    {
      icon: <Dumbbell className="w-5 h-5" />,
      text: "Personalized Workout Plan",
      question: "Can you create a workout plan for me? My fitness goal is [please specify your goal, e.g., weight loss, muscle gain, endurance].",
    },
    {
      icon: <Apple className="w-5 h-5" />,
      text: "Nutrition Guidance",
      question: "What should my diet look like for my fitness goal? I have [mention any dietary preferences or restrictions].",
    },
    {
      icon: <HeartPulse className="w-5 h-5" />,
      text: "Cardio & Endurance",
      question: "How can I improve my endurance and cardiovascular health? My current fitness level is [beginner/intermediate/advanced].",
    },
    {
      icon: <CalendarCheck className="w-5 h-5" />,
      text: "Workout Schedule",
      question: "What’s an optimal weekly workout schedule for me? I can work out [mention available days and duration].",
    },
  ];  
  

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full p-4">
      {questions.map((item, index) => (
        <button
          key={index}
          onClick={() => onQuestionSelect(item.question)}
          className="bg-white dark:bg-black p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center space-y-3 border border-black/10 dark:border-white/10"
        >
          <div className="text-black dark:text-white">{item.icon}</div>
          <span className="text-sm text-black dark:text-white">
            {item.text}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickStartCards;
