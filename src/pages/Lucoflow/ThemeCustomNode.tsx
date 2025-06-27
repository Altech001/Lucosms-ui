import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Database, Cloud, User, GitBranch } from 'lucide-react';

const icons: { [key: string]: React.ElementType } = {
  default: GitBranch,
  input: User,
  output: MessageSquare,
  database: Database,
  service: Cloud,
};

const ThemeCustomNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  const Icon = icons[data.type] || icons.default;
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-gray-800 border-2 border-stone-400 dark:border-blue-500">
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-gray-100 dark:bg-gray-700 mr-2">
           <Icon className="text-blue-500" size={24} />
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{data.label}</div>
          {data.sublabel && <p className="text-xs text-gray-500 dark:text-gray-400">{data.sublabel}</p>}
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="w-16 !bg-teal-500" isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-teal-500" isConnectable={isConnectable} />
    </div>
  );
};

export default memo(ThemeCustomNode);
