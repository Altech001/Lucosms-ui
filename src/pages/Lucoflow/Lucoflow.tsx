import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Edge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PanelRightOpen } from 'lucide-react';

import { useAuth } from '@clerk/clerk-react';
import { generateFlowFromPrompt, generateFlowFromData } from '../../utils/lucoflow-gemini';
import PageMeta from '../../utils/common/PageMeta';
import LucoflowSidebar from './LucoflowSidebar';
import ThemeCustomNode from './ThemeCustomNode';
import PageBreadcrumb from '@/utils/common/PageBreadCrumb';

const minimapStyle = {
  height: 120,
  backgroundColor: 'var(--color-gray-50)',
  borderColor: 'var(--color-gray-200)',
};

const nodeTypes = {
  custom: ThemeCustomNode,
};

type GeneratingType = 'prompt' | 'billing' | 'sms' | null;

const LucoflowPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [generatingType, setGeneratingType] = useState<GeneratingType>(null);
  const { getToken } = useAuth();

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleGenerateFromPrompt = async (prompt: string) => {
    if (!prompt) return;
    setGeneratingType('prompt');
    try {
      const { nodes: newNodes, edges: newEdges } = await generateFlowFromPrompt(prompt);
      const typedNodes = newNodes.map(node => ({ ...node, type: 'custom' }));
      setNodes(typedNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Failed to generate flow from prompt:', error);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateFromData = async (type: 'billing' | 'sms') => {
    setGeneratingType(type);
    try {
      const token = await getToken();
      const endpoint = type === 'billing' ? '/user/api/v1/billing_history' : '/user/api/v1/sms_history';
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        const noDataNode = {
          id: 'no-data',
          position: { x: 250, y: 150 },
          data: { label: 'No Data Found', sublabel: `Could not find any ${type} history.`, type: 'default' },
          type: 'custom',
        };
        setNodes([noDataNode]);
        setEdges([]);
        return;
      }

      const { nodes: newNodes, edges: newEdges } = await generateFlowFromData(type, data);
      const typedNodes = newNodes.map(node => ({ ...node, type: 'custom' }));
      setNodes(typedNodes);
      setEdges(newEdges);

    } catch (error) {
      console.error(`Failed to generate ${type} flow:`, error);
       const errorNode = {
          id: 'error-node',
          position: { x: 250, y: 150 },
          data: { label: 'Error', sublabel: `Could not generate ${type} flow.`, type: 'default' },
          type: 'custom',
        };
      setNodes([errorNode]);
      setEdges([]);
    } finally {
      setGeneratingType(null);
    }
  };
  
  return (
    <>
      <PageMeta
        title="Lucoflow | Luco SMS"
        description="Visually create and manage complex flows with AI assistance."
      />
      <PageBreadcrumb 
        pageTitle="Lucoflow"
        />
      <div className="">
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Design, visualize, and manage your data flows with an AI-powered canvas.
          </p>
      </div>

      <div className="flex h-full bg-white dark:bg-gray-900" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex-grow relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 dark:bg-gray-900/50"
          >
            <Controls />
            <MiniMap style={minimapStyle} zoomable pannable />
            <Background color="var(--color-brand-200)" gap={16} />
          </ReactFlow>
          {!isSidebarOpen && (
             <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Open AI Panel"
            >
                <PanelRightOpen className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
        <LucoflowSidebar 
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onGenerateFromPrompt={handleGenerateFromPrompt}
            onGenerateFromData={handleGenerateFromData}
            generatingType={generatingType}
        />
      </div>
    </>
  );
};

export default LucoflowPage;
