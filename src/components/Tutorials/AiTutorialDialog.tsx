import { useState } from 'react';
import Button from '../../utils/ui/button/Button';
import platformData from '../../data/platform-knowledge.json';

interface AiTutorialDialogProps {
  onTopicSelect: (topic: string, subtopic: string) => void;
  onClose: () => void;
}

export default function AiTutorialDialog({ onTopicSelect, onClose }: AiTutorialDialogProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white m-20 rounded-lg shadow-xl w-full max-w-2xl  p-10 dark:bg-gray-800">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Generate Luco AI Tutorial
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select a topic to generate a detailed tutorial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {platformData.topics.map((topic) => (
            <div key={topic.id} className="space-y-2">
              <div
                className={`p-2 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedTopic === topic.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-blue-300 dark:border-gray-700'
                }`}
                onClick={() => setSelectedTopic(topic.id)}
              >
                <h3 className="font-semibold text-sm text-gray-800 dark:text-white mb-2">
                  {topic.title}
                </h3>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {topic.subtopics.map((subtopic, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      {subtopic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedTopic}
            onClick={() => {
              if (selectedTopic) {
                const topic = platformData.topics.find(t => t.id === selectedTopic);
                if (topic) {
                  onTopicSelect(topic.title, topic.subtopics.join(', '));
                }
              }
            }}
          >
            Generate Tutorial
          </Button>
        </div>
      </div>
    </div>
  );
}
