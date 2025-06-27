import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node as ReactFlowNode,
  Edge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { PanelRightOpen } from 'lucide-react';

import { useAuth, useUser } from '@clerk/clerk-react';
import { generateFlowFromPrompt, generateFlowFromData, Template, UserProfile } from '../../utils/lucoflow-gemini';
import { apiService, Transaction, SMSHistory } from '../../lib/api-service';
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

type GeneratingType = 'prompt' | 'billing' | 'sms' | 'template' | 'user' | null;

interface LucoflowSettings {
  animateEdges: boolean;
  showEdgeLabels: boolean;
  snapToGrid: boolean;
}

const LucoflowPage: React.FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const {
    data: transactions,
    isLoading: isBillingLoading,
    error: billingError,
  } = useQuery<Transaction[], Error>({
    queryKey: ['lucoflow-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      return apiService.getTransactionHistory(getToken, user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: smsHistory,
    isLoading: isSmsLoading,
    error: smsError,
  } = useQuery<SMSHistory[], Error>({
    queryKey: ['lucoflow-sms-history'],
    queryFn: () => apiService.getSmsHistory(getToken),
    staleTime: 5 * 60 * 1000,
  });
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [generatingType, setGeneratingType] = useState<GeneratingType>(null);
  const edgeLabelsRef = useRef<Map<string, React.ReactNode>>(new Map());
  const [settings, setSettings] = useState<LucoflowSettings>({
    animateEdges: true,
    showEdgeLabels: false,
    snapToGrid: true,
  });
  

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeUpdate = useCallback((nodeId: string, data: { label: string; sublabel: string }) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, [setNodes]);

  const processFlowData = useCallback((newNodes: ReactFlowNode[], newEdges: Edge[]) => {
    edgeLabelsRef.current.clear();
    newEdges.forEach(edge => {
      if (edge.label) {
        edgeLabelsRef.current.set(edge.id, edge.label);
      }
    });

    const typedNodes: ReactFlowNode[] = newNodes.map((node) => ({
      ...node,
      type: 'custom',
      data: { ...node.data, onUpdate: handleNodeUpdate },
    }));
    const styledEdges = newEdges.map((edge) => ({
      ...edge,
      animated: settings.animateEdges,
      label: settings.showEdgeLabels ? edge.label : undefined,
    }));
    setNodes(typedNodes);
    setEdges(styledEdges);
  }, [handleNodeUpdate, settings.animateEdges, settings.showEdgeLabels, setNodes, setEdges]);

  const handleGenerateFromPrompt = async (prompt: string) => {
    if (!prompt) return;
    setGeneratingType('prompt');
    try {
      const { nodes: newNodes, edges: newEdges } = await generateFlowFromPrompt(prompt);
      processFlowData(newNodes, newEdges);
    } catch (error) {
      console.error('Failed to generate flow from prompt:', error);
    } finally {
      setGeneratingType(null);
    }
  };

    useEffect(() => {
    if (billingError) {
      console.error('Failed to fetch billing data:', billingError);
      processFlowData([{ id: 'error-node', position: { x: 250, y: 150 }, data: { label: 'Error', sublabel: 'Could not fetch billing data.', type: 'default' } } as ReactFlowNode], []);
    }
    if (smsError) {
      console.error('Failed to fetch SMS data:', smsError);
      processFlowData([{ id: 'error-node', position: { x: 250, y: 150 }, data: { label: 'Error', sublabel: 'Could not fetch SMS data.', type: 'default' } } as ReactFlowNode], []);
    }
  }, [billingError, smsError, processFlowData]);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: settings.animateEdges,
        label: settings.showEdgeLabels ? edgeLabelsRef.current.get(edge.id) : undefined,
      }))
    );
  }, [settings.animateEdges, settings.showEdgeLabels, setEdges]);

  const handleGenerateFromData = async (type: 'billing' | 'sms' | 'template' | 'user') => {
    setGeneratingType(type);
    try {
            let data: (Transaction | SMSHistory | Template | UserProfile)[] = [];
      if (type === 'billing') {
        if (isBillingLoading) {
          processFlowData([{ id: 'loading-node', position: { x: 250, y: 150 }, data: { label: 'Loading...', sublabel: 'Fetching billing history.', type: 'default' } } as ReactFlowNode], []);
          return;
        }
        data = transactions || [];
      } else if (type === 'sms') {
        if (isSmsLoading) {
          processFlowData([{ id: 'loading-node', position: { x: 250, y: 150 }, data: { label: 'Loading...', sublabel: 'Fetching SMS history.', type: 'default' } } as ReactFlowNode], []);
          return;
        }
        data = smsHistory || [];
      } else if (type === 'user') {
        if (!user) throw new Error('User not found');
        data = [user];
      } else if (type === 'template') {
        // Placeholder for template fetching logic
        data = [{ name: 'Welcome Message', body: 'Hi {{name}}, welcome to our service!' }, { name: 'Password Reset', body: 'Your password reset code is {{code}}.' }];
      }

      if (!data || data.length === 0) {
        processFlowData([{ id: 'no-data', position: { x: 250, y: 150 }, data: { label: 'No Data Found', sublabel: `Could not find any ${type} history.`, type: 'default' } } as ReactFlowNode], []);
        return;
      }

      const { nodes: newNodes, edges: newEdges } = await generateFlowFromData(type, data);
      processFlowData(newNodes, newEdges);

    } catch (error) {
      console.error(`Failed to generate ${type} flow:`, error);
      processFlowData([{ id: 'error-node', position: { x: 250, y: 150 }, data: { label: 'Error', sublabel: `Could not generate ${type} flow.`, type: 'default' } } as ReactFlowNode], []);
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
            fitView
            nodeTypes={nodeTypes}
            className="bg-gray-50 dark:bg-gray-900"
            snapToGrid={settings.snapToGrid}
            snapGrid={[15, 15]}
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
            settings={settings}
            onSettingsChange={(newSettings) => setSettings(newSettings)}
        />
      </div>
    </>
  );
};

export default LucoflowPage;
