import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Database, Cloud, User, GitBranch, Edit2 } from 'lucide-react';

const icons: { [key: string]: React.ElementType } = {
  default: GitBranch,
  input: User,
  output: MessageSquare,
  database: Database,
  service: Cloud,
};

const ThemeCustomNode: React.FC<NodeProps> = ({ id, data, isConnectable }) => {
  const Icon = icons[data.type] || icons.default;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [sublabel, setSublabel] = useState(data.sublabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleUpdate = () => {
    if (data.onUpdate) {
      data.onUpdate(id, { label, sublabel });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUpdate();
    }
  };

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-blue-700 hover:shadow-xl transition-shadow duration-300 relative group">
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-gray-100 dark:bg-gray-700 mr-4 border-2 border-white dark:border-gray-600">
           <Icon className="text-blue-500" size={24} />
        </div>
        <div className="flex-grow">
          {isEditing ? (
            <input
              ref={inputRef}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleUpdate}
              onKeyDown={handleKeyDown}
              className="text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none w-full"
            />
          ) : (
            <div className="text-lg font-bold text-gray-900 dark:text-white">{data.label}</div>
          )}
          {isEditing ? (
             <input
              value={sublabel}
              onChange={(e) => setSublabel(e.target.value)}
              onBlur={handleUpdate}
              onKeyDown={handleKeyDown}
              className="text-xs text-gray-500 dark:text-gray-400 bg-transparent border-b-2 border-gray-400 outline-none w-full mt-1"
            />
          ) : (
            data.sublabel && <p className="text-xs text-gray-500 dark:text-gray-400">{data.sublabel}</p>
          )}
        </div>
      </div>
      {!isEditing && (
        <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1 rounded-full bg-white/50 dark:bg-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Edit2 size={14} className="text-gray-600 dark:text-gray-300" />
        </button>
      )}

      <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" isConnectable={isConnectable} />
    </div>
  );
};

export default memo(ThemeCustomNode);
