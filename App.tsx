import React, { useState, useCallback } from 'react';
import { WordNode } from './types';
import { generateRelatedWords } from './services/geminiService';
import MindMap from './components/MindMap';
import InputForm from './components/InputForm';

const MAP_SIZE = 4000;

// Shared function for consistent node sizing, used for rendering and collision physics
const getNodeSize = (depth: number): number => {
    return Math.max(40, 90 - depth * 10);
};

/**
 * Adjusts node positions to prevent them from overlapping using a simple
 * iterative physics simulation (repulsion force).
 * @param nodes The current record of all nodes in the mind map.
 * @returns A new record of nodes with adjusted positions.
 */
const resolveCollisions = (nodes: Record<string, WordNode>): Record<string, WordNode> => {
    const updatedNodes = JSON.parse(JSON.stringify(nodes)); // Deep copy to avoid state mutation
    const nodeValues: WordNode[] = Object.values(updatedNodes);
    const iterations = 50; // More iterations lead to a more stable layout
    const padding = 10; // Extra space between nodes

    for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < nodeValues.length; j++) {
            for (let k = j + 1; k < nodeValues.length; k++) {
                const nodeA = nodeValues[j];
                const nodeB = nodeValues[k];

                const dx = nodeB.position.x - nodeA.position.x;
                const dy = nodeB.position.y - nodeA.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                const sizeA = getNodeSize(nodeA.depth);
                const sizeB = getNodeSize(nodeB.depth);
                const minDistance = (sizeA / 2) + (sizeB / 2) + padding;

                if (distance < minDistance) {
                    const overlap = minDistance - distance;
                    const forceX = (dx / distance) * overlap * 0.5;
                    const forceY = (dy / distance) * overlap * 0.5;

                    // Move nodes apart, but keep the root node anchored
                    if (nodeA.depth !== 0) {
                        nodeA.position.x -= forceX;
                        nodeA.position.y -= forceY;
                    }
                    if (nodeB.depth !== 0) {
                        nodeB.position.x += forceX;
                        nodeB.position.y += forceY;
                    }
                }
            }
        }
    }

    // Convert the array back into a record for the state
    const finalNodes: Record<string, WordNode> = {};
    for (const node of nodeValues) {
        finalNodes[node.id] = node;
    }
    return finalNodes;
};


const App: React.FC = () => {
  const [nodes, setNodes] = useState<Record<string, WordNode>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setNodes({});
    setError(null);
  };

  const handleStart = async (word: string) => {
    setIsGenerating(true);
    setError(null);
    setNodes({});

    const rootId = 'root';
    const rootNode: WordNode = {
      id: rootId,
      word,
      parentId: null,
      position: { x: MAP_SIZE / 2, y: MAP_SIZE / 2 },
      depth: 0,
      isExpanded: false,
      isLoading: true,
    };
    
    setNodes({ [rootId]: rootNode });
    await expandNode(rootId, { [rootId]: rootNode });
    setIsGenerating(false);
  };

  const expandNode = useCallback(async (nodeId: string, currentNodes: Record<string, WordNode>) => {
    const parentNode = currentNodes[nodeId];
    if (!parentNode || parentNode.isExpanded) return;

    setNodes(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], isLoading: true },
    }));

    try {
      const existingWords = Object.values(currentNodes).map(n => n.word);
      const relatedWords = await generateRelatedWords(parentNode.word, existingWords);
      
      if (relatedWords.length === 0) {
        // No new unique words were generated, so just mark as expanded
         setNodes(prev => ({
          ...prev,
          [nodeId]: { ...prev[nodeId], isExpanded: true, isLoading: false },
        }));
        return;
      }

      const newNodes: Record<string, WordNode> = {};
      const isRootNode = parentNode.depth === 0;
      const grandparent = parentNode.parentId ? currentNodes[parentNode.parentId] : null;
      const incomingAngle = grandparent
        ? Math.atan2(parentNode.position.y - grandparent.position.y, parentNode.position.x - grandparent.position.x)
        : -Math.PI / 2;
      
      const arc = isRootNode ? 2 * Math.PI : (4 / 3) * Math.PI;
      const startAngle = isRootNode ? -Math.PI / 2 : incomingAngle - arc / 2;
      const radius = Math.max(120, 350 / (parentNode.depth + 1.5));

      relatedWords.forEach((word, i) => {
        const id = `${nodeId}-${i}`;
        let angle: number;
        if (isRootNode) {
            angle = startAngle + (i / relatedWords.length) * arc;
        } else {
            angle = relatedWords.length > 1 
              ? startAngle + (i / (relatedWords.length - 1)) * arc
              : startAngle + arc / 2;
        }

        const position = {
          x: parentNode.position.x + radius * Math.cos(angle),
          y: parentNode.position.y + radius * Math.sin(angle),
        };
        newNodes[id] = { id, word, parentId: nodeId, position, depth: parentNode.depth + 1, isExpanded: false, isLoading: false };
      });
      
      setNodes(prev => {
         const nodesWithNewAdditions = {
            ...prev,
            ...newNodes,
            [nodeId]: { ...prev[nodeId], isExpanded: true, isLoading: false },
         };
         return resolveCollisions(nodesWithNewAdditions);
      });

    } catch (err) {
      console.error(err);
      setError('Failed to generate words. Please try again.');
      setNodes(prev => ({
        ...prev,
        [nodeId]: { ...prev[nodeId], isLoading: false },
      }));
    }
  }, []);
  
  const handleNodeClick = (nodeId: string) => {
      setNodes(currentNodes => {
        if (!currentNodes[nodeId].isExpanded && !currentNodes[nodeId].isLoading) {
             expandNode(nodeId, currentNodes);
        }
        return currentNodes;
      });
  };

  const hasNodes = Object.keys(nodes).length > 0;

  return (
    <div className="relative w-screen h-screen bg-gray-900 overflow-hidden flex flex-col font-sans">
      <header className="absolute top-0 left-0 right-0 z-10 p-4 bg-gray-900/50 backdrop-blur-sm flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          WordWeb AI
        </h1>
        {hasNodes && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reset
          </button>
        )}
      </header>
      
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {hasNodes ? (
        <MindMap nodes={nodes} onNodeClick={handleNodeClick} mapSize={MAP_SIZE} />
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <InputForm onSubmit={handleStart} isLoading={isGenerating} />
        </div>
      )}
    </div>
  );
};

export default App;