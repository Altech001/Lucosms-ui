import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
} from 'reactflow';

import 'reactflow/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Message Received' }, type: 'input' },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'Process Data' } },
  { id: '3', position: { x: 200, y: 200 }, data: { label: 'Send Response' } },
  { id: '4', position: { x: -200, y: 200 }, data: { label: 'Log Event' } },
  { id: '5', position: { x: 0, y: 300 }, data: { label: 'Done' }, type: 'output' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-5', source: '3', target: '5', animated: true },
  { id: 'e4-5', source: '4', target: '5' },
];

const minimapStyle = {
  height: 120,
  backgroundColor: 'var(--color-gray-50)',
  borderColor: 'var(--color-gray-200)',
};

const controlStyles = {
  button: {
    backgroundColor: 'var(--color-brand-50)',
    color: 'var(--color-brand-600)',
    border: 'none',
  },
};

const SidePanel: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '100%' }} className="bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        style={{
          backgroundColor: 'var(--color-gray-50)',
        }}
      >
        <Controls style={controlStyles} />
        <MiniMap style={minimapStyle} zoomable pannable />
        <Background color="var(--color-brand-200)" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default SidePanel;
